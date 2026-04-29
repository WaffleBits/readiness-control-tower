import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Boxes,
  CalendarClock,
  Gauge,
  Plane,
  RadioTower,
  RefreshCw,
  ShieldCheck,
  Users,
  Wrench,
  Zap
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { fetchDashboard, runWhatIf } from "./api";
import type {
  AssetRisk,
  DashboardData,
  Recommendation,
  RootCause,
  TimelineEvent,
  WhatIfRequest,
  WhatIfResult
} from "./types";

type Tab = "command" | "assets" | "timeline" | "scenario";

const tabs: Array<{ id: Tab; label: string; icon: LucideIcon }> = [
  { id: "command", label: "Command", icon: Gauge },
  { id: "assets", label: "Assets", icon: Plane },
  { id: "timeline", label: "Timeline", icon: CalendarClock },
  { id: "scenario", label: "What-if", icon: Zap }
];

const restorableSystems = ["parts-tracker", "maintenance-scheduler", "sensor-tasking"];

function App() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [source, setSource] = useState<"api" | "fallback">("fallback");
  const [activeTab, setActiveTab] = useState<Tab>("command");
  const [isLoading, setIsLoading] = useState(true);
  const [scenario, setScenario] = useState<WhatIfRequest>({
    expedite_parts_days: 2,
    restore_systems: ["parts-tracker"],
    add_available_maintainers: 2
  });
  const [scenarioResult, setScenarioResult] = useState<WhatIfResult | null>(null);

  useEffect(() => {
    let mounted = true;
    fetchDashboard().then((result) => {
      if (!mounted) {
        return;
      }
      setData(result.data);
      setSource(result.source);
      setIsLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const criticalAssets = useMemo(
    () => data?.asset_risks.filter((asset) => asset.posture === "critical").length ?? 0,
    [data]
  );

  async function handleScenarioRun() {
    const result = await runWhatIf(scenario);
    setScenarioResult(result);
  }

  function toggleSystem(system: string) {
    setScenario((current) => {
      const exists = current.restore_systems.includes(system);
      return {
        ...current,
        restore_systems: exists
          ? current.restore_systems.filter((item) => item !== system)
          : [...current.restore_systems, system]
      };
    });
  }

  if (isLoading || data === null) {
    return (
      <main className="app-shell">
        <section className="loading-state">
          <Activity className="spin" size={28} />
          <span>Loading readiness picture</span>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="masthead">
        <div>
          <p className="eyebrow">Mission operations fusion</p>
          <h1>Readiness Control Tower</h1>
          <p className="subtitle">
            Synthetic sortie, maintenance, supply, personnel, and outage data fused into
            a readiness decision surface.
          </p>
        </div>
        <div className="header-actions" aria-label="Dashboard status">
          <span className={`source-pill ${source}`}>
            <RadioTower size={16} />
            {source === "api" ? "Live API" : "Demo data"}
          </span>
          <span className="source-pill">
            <ShieldCheck size={16} />
            Public-safe
          </span>
        </div>
      </header>

      <section className="score-strip" aria-label="Readiness summary">
        <Metric
          label="Readiness"
          value={`${data.summary.readiness_score}`}
          detail="Composite score"
          icon={Gauge}
          tone="blue"
        />
        <Metric
          label="MC assets"
          value={`${data.summary.mission_capable_assets}/${data.summary.asset_count}`}
          detail={`${data.summary.mission_capable_rate}% capable`}
          icon={Plane}
          tone="green"
        />
        <Metric
          label="Critical assets"
          value={`${criticalAssets}`}
          detail="Highest risk posture"
          icon={AlertTriangle}
          tone="red"
        />
        <Metric
          label="Personnel"
          value={`${data.summary.personnel_available_rate}%`}
          detail="Available"
          icon={Users}
          tone="amber"
        />
      </section>

      <nav className="tabbar" aria-label="Readiness views">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              className={activeTab === tab.id ? "active" : ""}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={18} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {activeTab === "command" && (
        <CommandView
          rootCauses={data.root_causes}
          recommendations={data.recommendations}
          components={data.summary.components}
        />
      )}
      {activeTab === "assets" && <AssetsView assets={data.asset_risks} />}
      {activeTab === "timeline" && <TimelineView events={data.timeline} />}
      {activeTab === "scenario" && (
        <ScenarioView
          scenario={scenario}
          result={scenarioResult}
          onChange={setScenario}
          onToggleSystem={toggleSystem}
          onRun={handleScenarioRun}
        />
      )}
    </main>
  );
}

function Metric({
  label,
  value,
  detail,
  icon: Icon,
  tone
}: {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  tone: "blue" | "green" | "amber" | "red";
}) {
  return (
    <article className={`metric ${tone}`}>
      <div className="metric-icon">
        <Icon size={20} />
      </div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{detail}</small>
      </div>
    </article>
  );
}

function CommandView({
  rootCauses,
  recommendations,
  components
}: {
  rootCauses: RootCause[];
  recommendations: Recommendation[];
  components: Record<string, number>;
}) {
  return (
    <section className="workspace-grid">
      <div className="panel">
        <div className="panel-heading">
          <h2>Root Causes</h2>
          <Boxes size={20} />
        </div>
        <div className="cause-list">
          {rootCauses.map((cause) => (
            <article key={cause.name} className="cause-row">
              <div className="cause-score">{cause.score}</div>
              <div>
                <h3>{cause.name}</h3>
                <ul>
                  {cause.evidence.slice(0, 3).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="panel-heading">
          <h2>Recommendations</h2>
          <Wrench size={20} />
        </div>
        <div className="recommendation-list">
          {recommendations.map((recommendation) => (
            <article key={recommendation.title} className="recommendation">
              <span className={`priority ${recommendation.priority.toLowerCase()}`}>
                {recommendation.priority}
              </span>
              <h3>{recommendation.title}</h3>
              <p>{recommendation.action}</p>
              <small>{recommendation.expected_impact}</small>
            </article>
          ))}
        </div>
      </div>

      <div className="panel wide">
        <div className="panel-heading">
          <h2>Score Components</h2>
          <Activity size={20} />
        </div>
        <div className="component-grid">
          {Object.entries(components).map(([name, value]) => (
            <div key={name} className="component">
              <span>{name}</span>
              <div className="component-track">
                <div style={{ width: `${Math.min((value / 40) * 100, 100)}%` }} />
              </div>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AssetsView({ assets }: { assets: AssetRisk[] }) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>Asset Risk</h2>
        <Plane size={20} />
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Asset</th>
              <th>Platform</th>
              <th>Squadron</th>
              <th>Risk</th>
              <th>Posture</th>
              <th>Primary blockers</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((asset) => (
              <tr key={asset.asset_id}>
                <td>
                  <strong>{asset.asset_id}</strong>
                  <span>{asset.tail_number}</span>
                </td>
                <td>{asset.platform}</td>
                <td>{asset.squadron}</td>
                <td>{asset.risk_score}</td>
                <td>
                  <span className={`posture ${asset.posture}`}>{asset.posture}</span>
                </td>
                <td>{asset.blockers.slice(0, 2).join("; ") || "none"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function TimelineView({ events }: { events: TimelineEvent[] }) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>Mission Timeline</h2>
        <CalendarClock size={20} />
      </div>
      <div className="timeline">
        {events.map((event) => (
          <article key={event.mission_id} className="timeline-event">
            <div className={`timeline-dot ${event.status}`} />
            <div>
              <div className="timeline-topline">
                <strong>{event.mission_id}</strong>
                <span>{event.mission_date}</span>
                <span className={`posture ${event.risk_posture}`}>{event.risk_posture}</span>
              </div>
              <h3>{event.mission_type}</h3>
              <p>
                {event.platform} {event.asset_id} / {event.squadron}
              </p>
              <small>
                {event.status}
                {event.delay_minutes > 0 ? `, ${event.delay_minutes} min delay` : ""} -{" "}
                {event.primary_blocker}
              </small>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ScenarioView({
  scenario,
  result,
  onChange,
  onToggleSystem,
  onRun
}: {
  scenario: WhatIfRequest;
  result: WhatIfResult | null;
  onChange: (scenario: WhatIfRequest) => void;
  onToggleSystem: (system: string) => void;
  onRun: () => void;
}) {
  return (
    <section className="workspace-grid">
      <div className="panel">
        <div className="panel-heading">
          <h2>Interventions</h2>
          <RefreshCw size={20} />
        </div>
        <div className="form-grid">
          <label>
            Expedite parts by days
            <input
              type="number"
              min={0}
              max={14}
              value={scenario.expedite_parts_days}
              onChange={(event) =>
                onChange({
                  ...scenario,
                  expedite_parts_days: Number(event.target.value)
                })
              }
            />
          </label>
          <label>
            Add available maintainers
            <input
              type="number"
              min={0}
              max={20}
              value={scenario.add_available_maintainers}
              onChange={(event) =>
                onChange({
                  ...scenario,
                  add_available_maintainers: Number(event.target.value)
                })
              }
            />
          </label>
          <div className="system-toggle-group" aria-label="Restore systems">
            {restorableSystems.map((system) => (
              <button
                key={system}
                type="button"
                aria-pressed={scenario.restore_systems.includes(system)}
                onClick={() => onToggleSystem(system)}
              >
                {system}
              </button>
            ))}
          </div>
          <button className="primary-action" type="button" onClick={onRun}>
            Run scenario
          </button>
        </div>
      </div>

      <div className="panel">
        <div className="panel-heading">
          <h2>Projected Readiness</h2>
          <Zap size={20} />
        </div>
        {result ? (
          <div className="scenario-result">
            <strong>{result.projected_score}</strong>
            <span>Current {result.current_score}</span>
            <p>Delta +{result.delta}</p>
            <small>{result.assumptions.model}</small>
          </div>
        ) : (
          <div className="empty-result">Run a scenario to calculate projected readiness.</div>
        )}
      </div>
    </section>
  );
}

export default App;

