import type { DashboardData, WhatIfRequest, WhatIfResult } from "./types";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export const fallbackData: DashboardData = {
  summary: {
    readiness_score: 58.2,
    asset_count: 8,
    mission_capable_assets: 5,
    mission_capable_rate: 62.5,
    delayed_or_cancelled_missions: 3,
    open_maintenance_events: 4,
    constrained_parts: 3,
    degraded_systems: 3,
    personnel_available_rate: 70,
    components: {
      assets: 25,
      missions: 15.6,
      personnel: 10.5,
      parts: 4,
      systems: 3.1
    }
  },
  root_causes: [
    {
      name: "Maintenance backlog",
      score: 76,
      evidence: [
        "A-102 has critical flight-control work",
        "A-202 has high engine work",
        "A-302 has medium sensor-payload work"
      ]
    },
    {
      name: "Supply constraint",
      score: 68,
      evidence: [
        "A-102 waiting on flight-control-actuator (6 days)",
        "A-202 waiting on turbine-temperature-sensor (3 days)"
      ]
    },
    {
      name: "System degradation",
      score: 55,
      evidence: [
        "parts-tracker degraded for 55 FS",
        "maintenance-scheduler degraded for 41 AS"
      ]
    }
  ],
  recommendations: [
    {
      priority: "P1",
      title: "Re-sequence maintenance crews by asset risk",
      action: "Move maintainers toward the highest-risk open events before scheduled low-risk work.",
      expected_impact: "Reduces critical asset blockers and restores mission-capable rate.",
      evidence: ["A-102 has critical flight-control work", "A-202 has high engine work"]
    },
    {
      priority: "P1",
      title: "Expedite mission-blocking parts",
      action: "Prioritize critical and high ETA parts for A-102 and A-202 before lower-priority work.",
      expected_impact: "Improves near-term sortie recovery and reduces cancellation risk.",
      evidence: [
        "A-102 waiting on flight-control-actuator (6 days)",
        "A-202 waiting on turbine-temperature-sensor (3 days)"
      ]
    },
    {
      priority: "P2",
      title: "Restore degraded planning systems",
      action: "Treat parts-tracker and maintenance-scheduler recovery as operational readiness work.",
      expected_impact: "Reduces coordination delay across maintenance and supply teams.",
      evidence: ["parts-tracker degraded for 55 FS"]
    }
  ],
  asset_risks: [
    {
      asset_id: "A-102",
      tail_number: "87-0324",
      platform: "F-16C",
      squadron: "55 FS",
      priority: "high",
      risk_score: 100,
      posture: "critical",
      blockers: [
        "asset is not mission capable",
        "critical flight-control maintenance",
        "critical part waiting 6 days"
      ]
    },
    {
      asset_id: "A-202",
      tail_number: "92-0199",
      platform: "C-130J",
      squadron: "41 AS",
      priority: "medium",
      risk_score: 100,
      posture: "critical",
      blockers: [
        "asset is not mission capable",
        "high engine maintenance",
        "cancelled mission M-1004"
      ]
    },
    {
      asset_id: "A-302",
      tail_number: "11-3004",
      platform: "MQ-9",
      squadron: "432 WG",
      priority: "medium",
      risk_score: 86.5,
      posture: "critical",
      blockers: [
        "asset is not mission capable",
        "medium sensor-payload maintenance",
        "delayed mission M-1006"
      ]
    }
  ],
  timeline: [
    {
      mission_id: "M-1002",
      mission_date: "2027-02-01",
      mission_type: "defensive-counter-air",
      status: "delayed",
      delay_minutes: 95,
      asset_id: "A-102",
      platform: "F-16C",
      squadron: "55 FS",
      risk_posture: "critical",
      primary_blocker: "asset is not mission capable"
    },
    {
      mission_id: "M-1004",
      mission_date: "2027-02-02",
      mission_type: "airlift",
      status: "cancelled",
      delay_minutes: 180,
      asset_id: "A-202",
      platform: "C-130J",
      squadron: "41 AS",
      risk_posture: "critical",
      primary_blocker: "asset is not mission capable"
    },
    {
      mission_id: "M-1007",
      mission_date: "2027-02-04",
      mission_type: "tanker-support",
      status: "scheduled",
      delay_minutes: 0,
      asset_id: "A-401",
      platform: "KC-46A",
      squadron: "22 ARW",
      risk_posture: "elevated",
      primary_blocker: "medium hydraulics maintenance"
    }
  ]
};

export async function fetchDashboard(): Promise<{ data: DashboardData; source: "api" | "fallback" }> {
  try {
    const response = await fetch(`${API_BASE}/api/readiness`);
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }
    return { data: await response.json(), source: "api" };
  } catch {
    return { data: fallbackData, source: "fallback" };
  }
}

export async function runWhatIf(payload: WhatIfRequest): Promise<WhatIfResult> {
  try {
    const response = await fetch(`${API_BASE}/api/what-if`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }
    return response.json();
  } catch {
    const partGain = payload.expedite_parts_days * 3.6;
    const systemGain = payload.restore_systems.length * 4.2;
    const maintainerGain = Math.min(payload.add_available_maintainers * 2.5, 10);
    const projectedScore = Math.min(
      fallbackData.summary.readiness_score + partGain + systemGain + maintainerGain,
      100
    );
    return {
      current_score: fallbackData.summary.readiness_score,
      projected_score: Number(projectedScore.toFixed(1)),
      delta: Number((projectedScore - fallbackData.summary.readiness_score).toFixed(1)),
      assumptions: {
        ...payload,
        model: "frontend fallback model"
      }
    };
  }
}

