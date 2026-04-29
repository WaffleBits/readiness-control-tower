from __future__ import annotations

import csv
import os
from pathlib import Path
from typing import Any


SEVERITY_WEIGHT = {
    "critical": 30,
    "high": 22,
    "medium": 12,
    "low": 5,
}

CRITICALITY_WEIGHT = {
    "critical": 26,
    "high": 18,
    "medium": 10,
    "low": 4,
}

INT_FIELDS = {
    "hours_since_maintenance",
    "delay_minutes",
    "estimated_hours",
    "eta_days",
    "impact_score",
}

BOOL_FIELDS = {"mission_capable", "available"}


def _default_data_dir() -> Path:
    return Path(__file__).resolve().parents[2] / "data" / "synthetic"


def _as_bool(value: str) -> bool:
    return value.strip().lower() in {"true", "1", "yes", "y"}


def _normalize_row(row: dict[str, str]) -> dict[str, Any]:
    normalized: dict[str, Any] = {}
    for key, value in row.items():
        if key in BOOL_FIELDS:
            normalized[key] = _as_bool(value)
        elif key in INT_FIELDS:
            normalized[key] = int(value)
        else:
            normalized[key] = value
    return normalized


class ReadinessAnalytics:
    """Analytics layer over a public-safe synthetic readiness dataset."""

    def __init__(self, data_dir: str | Path | None = None) -> None:
        self.data_dir = Path(data_dir or os.getenv("DATA_DIR") or _default_data_dir())
        self.assets = self._load("assets.csv")
        self.missions = self._load("missions.csv")
        self.maintenance = self._load("maintenance.csv")
        self.parts = self._load("parts.csv")
        self.personnel = self._load("personnel.csv")
        self.outages = self._load("outages.csv")

    def _load(self, filename: str) -> list[dict[str, Any]]:
        path = self.data_dir / filename
        with path.open(newline="", encoding="utf-8") as handle:
            return [_normalize_row(row) for row in csv.DictReader(handle)]

    def dashboard(self) -> dict[str, Any]:
        return {
            "summary": self.readiness_summary(),
            "root_causes": self.root_causes(),
            "recommendations": self.recommendations(),
            "asset_risks": self.asset_risks(),
            "timeline": self.timeline(),
        }

    def readiness_summary(self) -> dict[str, Any]:
        asset_count = len(self.assets)
        mission_count = len(self.missions)
        personnel_count = len(self.personnel)

        mission_capable_assets = sum(1 for asset in self.assets if asset["mission_capable"])
        degraded_missions = [
            mission
            for mission in self.missions
            if mission["status"] in {"delayed", "cancelled"}
        ]
        open_maintenance = [
            event
            for event in self.maintenance
            if event["status"] in {"open", "in-progress"}
        ]
        constrained_parts = [
            part for part in self.parts if part["status"] != "on-hand"
        ]
        degraded_systems = [
            outage for outage in self.outages if outage["status"] == "degraded"
        ]
        available_personnel = [
            person for person in self.personnel if person["available"]
        ]

        mission_capable_rate = mission_capable_assets / asset_count
        mission_success_rate = 1 - (len(degraded_missions) / mission_count)
        personnel_available_rate = len(available_personnel) / personnel_count
        part_health = 1 - min(len(constrained_parts) / max(len(self.parts), 1), 1)
        outage_health = 1 - min(
            sum(outage["impact_score"] for outage in degraded_systems) / 80,
            1,
        )

        score = round(
            mission_capable_rate * 40
            + mission_success_rate * 25
            + personnel_available_rate * 15
            + part_health * 10
            + outage_health * 10,
            1,
        )

        return {
            "readiness_score": score,
            "asset_count": asset_count,
            "mission_capable_assets": mission_capable_assets,
            "mission_capable_rate": round(mission_capable_rate * 100, 1),
            "delayed_or_cancelled_missions": len(degraded_missions),
            "open_maintenance_events": len(open_maintenance),
            "constrained_parts": len(constrained_parts),
            "degraded_systems": len(degraded_systems),
            "personnel_available_rate": round(personnel_available_rate * 100, 1),
            "components": {
                "assets": round(mission_capable_rate * 40, 1),
                "missions": round(mission_success_rate * 25, 1),
                "personnel": round(personnel_available_rate * 15, 1),
                "parts": round(part_health * 10, 1),
                "systems": round(outage_health * 10, 1),
            },
        }

    def asset_risks(self) -> list[dict[str, Any]]:
        risks = [self._asset_risk(asset) for asset in self.assets]
        return sorted(risks, key=lambda item: item["risk_score"], reverse=True)

    def _asset_risk(self, asset: dict[str, Any]) -> dict[str, Any]:
        asset_id = asset["asset_id"]
        score = 0.0
        blockers: list[str] = []

        if not asset["mission_capable"]:
            score += 28
            blockers.append("asset is not mission capable")

        if asset["hours_since_maintenance"] >= 96:
            score += 10
            blockers.append("maintenance age exceeds 96 hours")

        open_events = [
            event
            for event in self.maintenance
            if event["asset_id"] == asset_id and event["status"] in {"open", "in-progress"}
        ]
        for event in open_events:
            score += SEVERITY_WEIGHT[event["severity"]]
            blockers.append(f"{event['severity']} {event['category']} maintenance")

        constrained_parts = [
            part
            for part in self.parts
            if part["asset_id"] == asset_id and part["status"] != "on-hand"
        ]
        for part in constrained_parts:
            score += CRITICALITY_WEIGHT[part["criticality"]]
            score += min(part["eta_days"], 7)
            blockers.append(f"{part['criticality']} part waiting {part['eta_days']} days")

        degraded_missions = [
            mission
            for mission in self.missions
            if mission["asset_id"] == asset_id
            and mission["status"] in {"delayed", "cancelled"}
        ]
        for mission in degraded_missions:
            score += min(mission["delay_minutes"] / 5, 25)
            blockers.append(f"{mission['status']} mission {mission['mission_id']}")

        outage_impact = sum(
            outage["impact_score"]
            for outage in self.outages
            if outage["status"] == "degraded"
            and outage["scope"] in {asset["squadron"], "all"}
        )
        if outage_impact:
            score += outage_impact / 2
            blockers.append("squadron system degradation")

        score = round(min(score, 100), 1)

        if score >= 70:
            posture = "critical"
        elif score >= 45:
            posture = "high"
        elif score >= 25:
            posture = "elevated"
        else:
            posture = "normal"

        return {
            "asset_id": asset_id,
            "tail_number": asset["tail_number"],
            "platform": asset["platform"],
            "squadron": asset["squadron"],
            "priority": asset["priority"],
            "risk_score": score,
            "posture": posture,
            "blockers": blockers[:5],
        }

    def root_causes(self) -> list[dict[str, Any]]:
        causes = [
            self._maintenance_cause(),
            self._parts_cause(),
            self._outage_cause(),
            self._personnel_cause(),
            self._asset_age_cause(),
        ]
        return sorted(
            [cause for cause in causes if cause["score"] > 0],
            key=lambda item: item["score"],
            reverse=True,
        )

    def _maintenance_cause(self) -> dict[str, Any]:
        events = [
            event
            for event in self.maintenance
            if event["status"] in {"open", "in-progress"}
        ]
        score = sum(SEVERITY_WEIGHT[event["severity"]] for event in events)
        evidence = [
            f"{event['asset_id']} has {event['severity']} {event['category']} work"
            for event in events[:4]
        ]
        return {
            "name": "Maintenance backlog",
            "score": score,
            "evidence": evidence,
        }

    def _parts_cause(self) -> dict[str, Any]:
        parts = [part for part in self.parts if part["status"] != "on-hand"]
        score = sum(
            CRITICALITY_WEIGHT[part["criticality"]] + part["eta_days"]
            for part in parts
        )
        evidence = [
            f"{part['asset_id']} waiting on {part['nomenclature']} ({part['eta_days']} days)"
            for part in parts[:4]
        ]
        return {
            "name": "Supply constraint",
            "score": score,
            "evidence": evidence,
        }

    def _outage_cause(self) -> dict[str, Any]:
        outages = [
            outage for outage in self.outages if outage["status"] == "degraded"
        ]
        score = sum(outage["impact_score"] for outage in outages)
        evidence = [
            f"{outage['system']} degraded for {outage['scope']}"
            for outage in outages[:4]
        ]
        return {
            "name": "System degradation",
            "score": score,
            "evidence": evidence,
        }

    def _personnel_cause(self) -> dict[str, Any]:
        unavailable_by_squadron: dict[str, int] = {}
        total_by_squadron: dict[str, int] = {}
        for person in self.personnel:
            total_by_squadron[person["squadron"]] = total_by_squadron.get(person["squadron"], 0) + 1
            if not person["available"]:
                unavailable_by_squadron[person["squadron"]] = unavailable_by_squadron.get(person["squadron"], 0) + 1

        evidence = []
        score = 0
        for squadron, total in total_by_squadron.items():
            unavailable = unavailable_by_squadron.get(squadron, 0)
            unavailable_rate = unavailable / total
            if unavailable_rate >= 0.4:
                score += round(unavailable_rate * 25)
                evidence.append(
                    f"{squadron} has {unavailable} of {total} personnel unavailable"
                )

        return {
            "name": "Personnel availability",
            "score": score,
            "evidence": evidence,
        }

    def _asset_age_cause(self) -> dict[str, Any]:
        assets = [
            asset for asset in self.assets if asset["hours_since_maintenance"] >= 96
        ]
        score = sum(10 for _ in assets)
        evidence = [
            f"{asset['asset_id']} at {asset['hours_since_maintenance']} hours since maintenance"
            for asset in assets
        ]
        return {
            "name": "Inspection pressure",
            "score": score,
            "evidence": evidence,
        }

    def recommendations(self) -> list[dict[str, Any]]:
        root_causes = self.root_causes()
        recommendations: list[dict[str, Any]] = []

        for cause in root_causes[:4]:
            if cause["name"] == "Supply constraint":
                recommendations.append({
                    "priority": "P1",
                    "title": "Expedite mission-blocking parts",
                    "action": "Prioritize critical and high ETA parts for A-102 and A-202 before lower-priority work.",
                    "expected_impact": "Improves near-term sortie recovery and reduces cancellation risk.",
                    "evidence": cause["evidence"][:2],
                })
            elif cause["name"] == "Maintenance backlog":
                recommendations.append({
                    "priority": "P1",
                    "title": "Re-sequence maintenance crews by asset risk",
                    "action": "Move maintainers toward the highest-risk open events before scheduled low-risk work.",
                    "expected_impact": "Reduces critical asset blockers and restores mission-capable rate.",
                    "evidence": cause["evidence"][:2],
                })
            elif cause["name"] == "System degradation":
                recommendations.append({
                    "priority": "P2",
                    "title": "Restore degraded planning systems",
                    "action": "Treat parts-tracker and maintenance-scheduler recovery as operational readiness work.",
                    "expected_impact": "Reduces coordination delay across maintenance and supply teams.",
                    "evidence": cause["evidence"][:2],
                })
            elif cause["name"] == "Personnel availability":
                recommendations.append({
                    "priority": "P2",
                    "title": "Rebalance scarce personnel by squadron",
                    "action": "Temporarily shift qualified maintainers to units with elevated unavailable rates.",
                    "expected_impact": "Raises execution confidence for delayed missions.",
                    "evidence": cause["evidence"][:2],
                })

        return recommendations

    def timeline(self) -> list[dict[str, Any]]:
        asset_lookup = {asset["asset_id"]: asset for asset in self.assets}
        risk_lookup = {risk["asset_id"]: risk for risk in self.asset_risks()}

        events = []
        for mission in self.missions:
            asset = asset_lookup[mission["asset_id"]]
            risk = risk_lookup[mission["asset_id"]]
            primary_blocker = risk["blockers"][0] if risk["blockers"] else "no active blocker"
            events.append({
                "mission_id": mission["mission_id"],
                "mission_date": mission["mission_date"],
                "mission_type": mission["mission_type"],
                "status": mission["status"],
                "delay_minutes": mission["delay_minutes"],
                "asset_id": mission["asset_id"],
                "platform": asset["platform"],
                "squadron": asset["squadron"],
                "risk_posture": risk["posture"],
                "primary_blocker": primary_blocker,
            })

        return sorted(events, key=lambda item: (item["mission_date"], item["mission_id"]))

    def what_if(
        self,
        expedite_parts_days: int = 0,
        restore_systems: list[str] | None = None,
        add_available_maintainers: int = 0,
    ) -> dict[str, Any]:
        restore_systems = restore_systems or []
        current_score = self.readiness_summary()["readiness_score"]

        constrained_parts = [
            part for part in self.parts if part["status"] != "on-hand"
        ]
        part_gain = sum(
            min(expedite_parts_days, part["eta_days"]) * 1.4
            for part in constrained_parts
            if part["criticality"] in {"critical", "high"}
        )

        outage_gain = sum(
            outage["impact_score"] / 6
            for outage in self.outages
            if outage["status"] == "degraded" and outage["system"] in restore_systems
        )

        maintainer_gain = min(add_available_maintainers * 2.5, 10)
        projected_score = round(
            min(current_score + part_gain + outage_gain + maintainer_gain, 100),
            1,
        )

        return {
            "current_score": current_score,
            "projected_score": projected_score,
            "delta": round(projected_score - current_score, 1),
            "assumptions": {
                "expedite_parts_days": expedite_parts_days,
                "restore_systems": restore_systems,
                "add_available_maintainers": add_available_maintainers,
                "model": "lightweight scoring model for demo use only",
            },
        }

