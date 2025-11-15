import { AlertTriangle, CheckCircle2, AlertCircle } from "lucide-react";
import { Card } from "./ui/card";

export type Trend = {
  feature: string;
  current: number;
  average: number;
  trend: "increasing" | "decreasing" | "stable";
  changePercent: number;
};

export type Feature = {
  label: string;
  value: number;
  threshold: number;
  direction: "left" | "right";
  isAboveThreshold?: boolean;
};

export type PredictionMeta = {
  explanation?: string | null;
  detailedExplanation?: {
    summary?: string;
    keyFactors?: string[];
    recommendations?: string[];
    trends?: Trend[];
  };
  features?: Feature[];
  trends?: Trend[]; // sometimes top-level
} | null;

interface RiskMeterProps {
  riskLevel: number; // 0-100
  predictionMeta?: PredictionMeta;
}

/**
 * Helper: human friendly label map
 */
const HUMAN_LABELS: Record<string, string> = {
  sleep_hours: "Sleep",
  screen_time_hours: "Screen time",
  prodrome_symptoms: "Prodrome symptoms",
  stress_level: "Stress level",
  attacks_last_7_days: "Recent attacks (7 days)",
  attacks_last_30_days: "Recent attacks (30 days)",
  days_since_last_attack: "Days since last attack",
  hydration_low: "Hydration",
  skipped_meal: "Skipped meal",
  bright_light_exposure: "Bright light exposure",
  pressure_drop: "Pressure changes",
};

type Driver = {
  label: string;
  current: number;
  threshold: number;
  direction: Feature["direction"];
  score: number; // normalized 0..1
  rawScore: number; // pre-normalized
  trend?: Trend;
};

/**
 * Compute top drivers from features + trends.
 *
 * Algorithm (conservative):
 * - Deduplicate features by label, choosing the entry that yields the larger raw magnitude
 * - Compute base magnitude:
 *    - direction === 'left' -> magnitude = max(0, (threshold - value) / max(0.1, threshold))
 *    - direction === 'right' -> magnitude = max(0, (value - threshold) / max(0.1, threshold))
 * - Apply trend weight:
 *    - If trend moves toward risk (e.g. sleep decreasing when direction==='left'), weight = 1.2
 *    - If trend moves away from risk, weight = 0.9
 * - Normalize by max rawScore
 */
function computeTopDrivers(features: Feature[] = [], trends: Trend[] = []): Driver[] {
  if (!features || features.length === 0) return [];

  // Deduplicate - pick most "risky" entry for each label
  // Use a typed map to avoid attaching runtime properties to Feature (no `any`)
  const map = new Map<string, { feature: Feature; magnitude: number }>();
  for (const f of features) {
    const existing = map.get(f.label);
    const thresholdSafe = Math.max(0.1, Math.abs(f.threshold || 0.1));
    const magnitude = f.direction === "left"
      ? Math.max(0, (f.threshold - f.value) / thresholdSafe)
      : Math.max(0, (f.value - f.threshold) / thresholdSafe);

    if (!existing) {
      map.set(f.label, { feature: f, magnitude });
    } else {
      // compute existing magnitude
      const existingMagnitude = existing.magnitude ?? 0;
      if (magnitude > existingMagnitude) {
        map.set(f.label, { feature: f, magnitude });
      }
    }
  }

  const drivers: Driver[] = [];

  for (const [label, entry] of map.entries()) {
    const f = entry.feature;
    const thresholdSafe = Math.max(0.1, Math.abs(f.threshold || 0.1));
    const base = f.direction === "left"
      ? Math.max(0, (f.threshold - f.value) / thresholdSafe)
      : Math.max(0, (f.value - f.threshold) / thresholdSafe);

    // trend based weight
    const t = trends.find(tr => tr.feature === label);
    let weight = 1;
    if (t) {
      // If trend moves toward risk, increase weight
      if ((t.trend === "decreasing" && f.direction === "left") || (t.trend === "increasing" && f.direction === "right")) {
        weight = 1.2;
      } else if ((t.trend === "increasing" && f.direction === "left") || (t.trend === "decreasing" && f.direction === "right")) {
        weight = 0.9;
      }
      // larger change percent => slight amplification
      const absChange = Math.abs(t.changePercent || 0);
      if (absChange > 20) weight *= 1.1;
    }

    const rawScore = base * weight;
    drivers.push({
      label,
      current: f.value,
      threshold: f.threshold,
      direction: f.direction,
      score: rawScore, // temporary; will normalize below
      rawScore,
      trend: t,
    });
  }

  // Normalize scores
  const maxRaw = Math.max(...drivers.map(d => d.rawScore), 0.000001);
  for (const d of drivers) {
    d.score = Math.min(1, d.rawScore / maxRaw);
  }

  // Sort descending and take top 3
  drivers.sort((a, b) => b.score - a.score);
  return drivers.slice(0, 3);
}

export function RiskMeter({ riskLevel, predictionMeta }: RiskMeterProps) {
  const getRiskStatus = () => {
    if (riskLevel < 30) return { label: "Low Chance", color: "text-success", gradient: "gradient-risk-low", icon: CheckCircle2 };
    if (riskLevel < 70) return { label: "Moderate Chance", color: "text-warning", gradient: "gradient-risk-moderate", icon: AlertCircle };
    return { label: "High Chance", color: "text-destructive", gradient: "gradient-risk-high", icon: AlertTriangle };
  };

  const status = getRiskStatus();
  const Icon = status.icon;

  // Prepare trends (prefer detailedExplanation.trends, fallback to top-level)
  const trendsSource = predictionMeta?.detailedExplanation?.trends ?? predictionMeta?.trends ?? [];
  const featuresSource = predictionMeta?.features ?? [];

  const topDrivers = computeTopDrivers(featuresSource, trendsSource);

  // small helper for display text
  const humanLabel = (label: string) => HUMAN_LABELS[label] ?? label.replace(/_/g, " ");

  return (
    <Card className="p-6 relative overflow-hidden">
      {/* Background gradient effect */}
      <div className={`absolute inset-0 opacity-5 ${status.gradient}`} />

      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3>Migraine Risk</h3>
            <p className="text-muted-foreground">Next 24 hours</p>
          </div>
          <Icon className={`w-7 h-7 ${status.color}`} />
        </div>

        <div className="h-2" />

        <div className="text-center">
          <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-full ${status.gradient} text-white mb-3`}>
            <div className="w-2 h-2 bg-white rounded-full animate-pulse-slow" />
            <span>{status.label}</span>
          </div>

          {(predictionMeta?.detailedExplanation?.summary ?? predictionMeta?.explanation) && (
            <p className="text-muted-foreground mt-4">
              {predictionMeta?.detailedExplanation?.summary ?? predictionMeta?.explanation}
            </p>
          )}

          {predictionMeta?.detailedExplanation?.recommendations && predictionMeta.detailedExplanation.recommendations.length > 0 && (
            <div className="mt-4 text-left mx-6">
              <div className="text-sm font-medium">Recommendations</div>
              <ul className="list-disc list-inside text-sm text-muted-foreground mt-2">
                {predictionMeta.detailedExplanation.recommendations.slice(0, 5).map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Top drivers section */}
        {topDrivers.length > 0 && (
          <div className="mt-6 mx-1">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium">Top drivers</h4>
              <div className="text-xs text-muted-foreground">Why this prediction</div>
            </div>

            <div className="space-y-3">
              {topDrivers.map((d) => (
                <div key={d.label} className="p-3 rounded-lg border bg-card">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-semibold truncate">{humanLabel(d.label)}</div>
                        {d.trend && (
                          <div className="text-xs text-muted-foreground">· {d.trend.trend} ({d.trend.changePercent}%)</div>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {d.label === "sleep_hours"
                          ? `You're sleeping ${d.current.toFixed(1)} h (target ≥ ${d.threshold.toFixed(1)} h)`
                          : d.label === "screen_time_hours"
                            ? `Screen time ${d.current.toFixed(1)} h (target ${d.threshold.toFixed(1)} h)`
                            : `${d.current} vs ${d.threshold}`}
                      </div>
                    </div>

                    <div className="w-28">
                      <div className="text-right text-xs text-muted-foreground mb-1">{Math.round(d.score * 100)}%</div>
                      <div className="h-2 w-full rounded-full bg-muted">
                        <div className="h-2 rounded-full bg-primary" style={{ width: `${Math.round(d.score * 100)}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </Card>
  );
}
