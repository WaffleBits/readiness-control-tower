export type Summary = {
  readiness_score: number;
  asset_count: number;
  mission_capable_assets: number;
  mission_capable_rate: number;
  delayed_or_cancelled_missions: number;
  open_maintenance_events: number;
  constrained_parts: number;
  degraded_systems: number;
  personnel_available_rate: number;
  components: Record<string, number>;
};

export type RootCause = {
  name: string;
  score: number;
  evidence: string[];
};

export type Recommendation = {
  priority: "P1" | "P2" | "P3";
  title: string;
  action: string;
  expected_impact: string;
  evidence: string[];
};

export type AssetRisk = {
  asset_id: string;
  tail_number: string;
  platform: string;
  squadron: string;
  priority: string;
  risk_score: number;
  posture: "critical" | "high" | "elevated" | "normal";
  blockers: string[];
};

export type TimelineEvent = {
  mission_id: string;
  mission_date: string;
  mission_type: string;
  status: string;
  delay_minutes: number;
  asset_id: string;
  platform: string;
  squadron: string;
  risk_posture: string;
  primary_blocker: string;
};

export type DashboardData = {
  summary: Summary;
  root_causes: RootCause[];
  recommendations: Recommendation[];
  asset_risks: AssetRisk[];
  timeline: TimelineEvent[];
};

export type WhatIfRequest = {
  expedite_parts_days: number;
  restore_systems: string[];
  add_available_maintainers: number;
};

export type WhatIfResult = {
  current_score: number;
  projected_score: number;
  delta: number;
  assumptions: WhatIfRequest & {
    model: string;
  };
};

