from pathlib import Path
import sys
import unittest


sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.analytics import ReadinessAnalytics  # noqa: E402


DATA_DIR = Path(__file__).resolve().parents[2] / "data" / "synthetic"


class ReadinessAnalyticsTest(unittest.TestCase):
    def setUp(self) -> None:
        self.analytics = ReadinessAnalytics(DATA_DIR)

    def test_readiness_summary_is_bounded_and_counts_degraded_missions(self) -> None:
        summary = self.analytics.readiness_summary()

        self.assertGreaterEqual(summary["readiness_score"], 0)
        self.assertLessEqual(summary["readiness_score"], 100)
        self.assertEqual(summary["asset_count"], 8)
        self.assertEqual(summary["delayed_or_cancelled_missions"], 3)

    def test_root_causes_surface_operational_blockers(self) -> None:
        names = [cause["name"] for cause in self.analytics.root_causes()]

        self.assertIn("Maintenance backlog", names)
        self.assertIn("Supply constraint", names)
        self.assertIn("System degradation", names)

    def test_highest_risk_asset_has_blockers(self) -> None:
        highest_risk = self.analytics.asset_risks()[0]

        self.assertIn(highest_risk["posture"], {"critical", "high"})
        self.assertGreater(len(highest_risk["blockers"]), 0)

    def test_what_if_improves_score_when_blockers_are_removed(self) -> None:
        result = self.analytics.what_if(
            expedite_parts_days=2,
            restore_systems=["parts-tracker", "maintenance-scheduler"],
            add_available_maintainers=2,
        )

        self.assertGreater(result["projected_score"], result["current_score"])
        self.assertGreater(result["delta"], 0)


if __name__ == "__main__":
    unittest.main()

