import { AlertTriangle, CheckCircle2, AlertCircle, Moon, Smartphone, Coffee, ChevronDown, ChevronUp } from "lucide-react"; // ADDED: Moon, Smartphone, Coffee, ChevronDown, ChevronUp for recommendations
import { Card } from "./ui/card";
import { Checkbox } from "./ui/checkbox"; // ADDED: For interactive recommendations
import { Badge } from "./ui/badge"; // ADDED: For priority indicators
import { useState } from "react"; // ADDED: For managing checkbox and expand state

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
  trends?: Trend[];
} | null;

interface RiskMeterProps {
  riskLevel: number;
  predictionMeta?: PredictionMeta;
}

// ADDED: New interface for enhanced recommendations
interface EnhancedRecommendation {
  id: string;
  icon: React.ReactNode;
  text: string;
  priority: "high" | "medium";
  linkedDriver: string;
  expandedTips: string[];
}

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
  score: number;
  rawScore: number;
  trend?: Trend;
};

function computeTopDrivers(features: Feature[] = [], trends: Trend[] = []): Driver[] {
  if (!features || features.length === 0) return [];

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

    const t = trends.find(tr => tr.feature === label);
    let weight = 1;
    if (t) {
      if ((t.trend === "decreasing" && f.direction === "left") || (t.trend === "increasing" && f.direction === "right")) {
        weight = 1.2;
      } else if ((t.trend === "increasing" && f.direction === "left") || (t.trend === "decreasing" && f.direction === "right")) {
        weight = 0.9;
      }
      const absChange = Math.abs(t.changePercent || 0);
      if (absChange > 20) weight *= 1.1;
    }

    const rawScore = base * weight;
    drivers.push({
      label,
      current: f.value,
      threshold: f.threshold,
      direction: f.direction,
      score: rawScore,
      rawScore,
      trend: t,
    });
  }

  const maxRaw = Math.max(...drivers.map(d => d.rawScore), 0.000001);
  for (const d of drivers) {
    d.score = Math.min(1, d.rawScore / maxRaw);
  }

  drivers.sort((a, b) => b.score - a.score);
  return drivers.slice(0, 3);
}

// ADDED: Helper function to map recommendations to enhanced format with icons and metadata
function enrichRecommendations(
  recommendations: string[],
  topDrivers: Driver[]
): EnhancedRecommendation[] {
  return recommendations.map((rec, index) => {
    // Try to match recommendation with a driver
    let linkedDriver = "Overall health";
    let icon = <CheckCircle2 className="w-5 h-5" />;
    let priority: "high" | "medium" = "medium";
    let expandedTips: string[] = [];

    // Match keywords to determine icon and linked driver
    const lowerRec = rec.toLowerCase();

    if (lowerRec.includes("sleep")) {
      icon = <Moon className="w-5 h-5" />;
      linkedDriver = topDrivers.find(d => d.label === "sleep_hours")
        ? `Sleep (${topDrivers.find(d => d.label === "sleep_hours")?.trend?.trend || "stable"})`
        : "Sleep quality";
      priority = "high";
      expandedTips = [
        "Set a consistent bedtime alarm",
        "Create a relaxing bedtime routine",
        "Keep your bedroom cool and dark",
        "Avoid screens 30 minutes before bed"
      ];
    } else if (lowerRec.includes("screen") || lowerRec.includes("blue light")) {
      icon = <Smartphone className="w-5 h-5" />;
      linkedDriver = topDrivers.find(d => d.label === "screen_time_hours")
        ? `Screen time (${topDrivers.find(d => d.label === "screen_time_hours")?.trend?.trend || "stable"})`
        : "Screen time";
      priority = "high";
      expandedTips = [
        "Use blue light filter after 8 PM",
        "Set app time limits on your phone",
        "Replace scrolling with reading or meditation",
        "Keep devices out of the bedroom"
      ];
    } else if (lowerRec.includes("caffeine") || lowerRec.includes("coffee")) {
      icon = <Coffee className="w-5 h-5" />;
      linkedDriver = "Caffeine intake";
      priority = "medium";
      expandedTips = [
        "Switch to decaf after 2 PM",
        "Try herbal tea as an alternative",
        "Track your daily caffeine consumption",
        "Gradually reduce intake to avoid withdrawal"
      ];
    }

    return {
      id: `rec-${index}`,
      icon,
      text: rec,
      priority,
      linkedDriver,
      expandedTips,
    };
  });
}

export function RiskMeter({ riskLevel, predictionMeta }: RiskMeterProps) {
  // ADDED: State for managing completed recommendations and expanded items
  const [completedRecs, setCompletedRecs] = useState<Set<string>>(new Set());
  const [expandedRecId, setExpandedRecId] = useState<string | null>(null);

  const getRiskStatus = () => {
    if (riskLevel < 30) return { label: "Low Chance", color: "text-success", gradient: "gradient-risk-low", icon: CheckCircle2 };
    if (riskLevel < 70) return { label: "Moderate Chance", color: "text-warning", gradient: "gradient-risk-moderate", icon: AlertCircle };
    return { label: "High Chance", color: "text-destructive", gradient: "gradient-risk-high", icon: AlertTriangle };
  };

  const status = getRiskStatus();
  const Icon = status.icon;

  const trendsSource = predictionMeta?.detailedExplanation?.trends ?? predictionMeta?.trends ?? [];
  const featuresSource = predictionMeta?.features ?? [];

  const topDrivers = computeTopDrivers(featuresSource, trendsSource);

  const humanLabel = (label: string) => HUMAN_LABELS[label] ?? label.replace(/_/g, " ");

  // ADDED: Toggle functions for interactivity
  const toggleComplete = (id: string) => {
    const newCompleted = new Set(completedRecs);
    if (newCompleted.has(id)) {
      newCompleted.delete(id);
    } else {
      newCompleted.add(id);
    }
    setCompletedRecs(newCompleted);
  };

  const toggleExpand = (id: string) => {
    setExpandedRecId(expandedRecId === id ? null : id);
  };

  // ADDED: Helper for priority badge colors
  const getPriorityColor = (priority: "high" | "medium") => {
    return priority === "high"
      ? "bg-purple-100 text-purple-700 border-purple-200"
      : "bg-blue-100 text-blue-700 border-blue-200";
  };

  // ADDED: Enrich recommendations if they exist
  const rawRecommendations = predictionMeta?.detailedExplanation?.recommendations ?? [];
  const enhancedRecommendations = rawRecommendations.length > 0
    ? enrichRecommendations(rawRecommendations, topDrivers)
    : [];

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
                      </div>
                      {d.trend && (
                        <div className="text-xs text-muted-foreground mt-1 font-medium">{d.trend.trend}</div>
                      )}
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

        {/* ENHANCED: Recommendations section with new design */}
        {enhancedRecommendations.length > 0 && (
          <div className="mt-6">
            {/* CHANGED: Removed nested Card, enhanced background with gradient */}
            <div className="p-4 bg-linear-to-br from-purple-50 to-purple-100/50 border border-purple-200 rounded-xl shadow-sm">
              {/* CHANGED: Added "This week's focus" badge and better layout */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm font-medium">Recommendations</div>
                  <div className="text-xs text-muted-foreground">Suggested next steps</div>
                </div>
                <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                  This week's focus
                </span>
              </div>

              {/* CHANGED: From simple list to interactive card-based layout */}
              <div className="space-y-3">
                {enhancedRecommendations.map((rec) => {
                  const isCompleted = completedRecs.has(rec.id);
                  const isExpanded = expandedRecId === rec.id;

                  return (
                    <div
                      key={rec.id}
                      className={`bg-white rounded-xl p-4 border transition-all ${
                        isCompleted
                          ? "border-purple-200 bg-purple-50/30" // ADDED: Completed state styling
                          : "border-gray-200 hover:border-purple-300 hover:shadow-md" // ADDED: Hover effects
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* ADDED: Interactive checkbox */}
                        <Checkbox
                          checked={isCompleted}
                          onCheckedChange={() => toggleComplete(rec.id)}
                          className="mt-1"
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-3">
                            {/* ADDED: Icon for each recommendation */}
                            <div className={`p-2 rounded-lg ${
                              isCompleted ? "bg-purple-100 text-purple-400" : "bg-purple-100 text-purple-600"
                            }`}>
                              {rec.icon}
                            </div>

                            <div className="flex-1">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                {/* CHANGED: Added line-through for completed items */}
                                <p className={`text-sm ${isCompleted ? "line-through text-gray-400" : "text-gray-700"}`}>
                                  {rec.text}
                                </p>
                                {/* ADDED: Priority badge */}
                                <Badge
                                  variant="outline"
                                  className={`text-xs shrink-0 ${getPriorityColor(rec.priority)}`}
                                >
                                  {rec.priority === "high" ? "High" : "Medium"}
                                </Badge>
                              </div>

                              <div className="flex items-center justify-between">
                                {/* ADDED: Link to driver data */}
                                <span className="text-xs text-purple-600">
                                  Based on {rec.linkedDriver}
                                </span>

                                {/* ADDED: Expandable tips button */}
                                <button
                                  onClick={() => toggleExpand(rec.id)}
                                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-purple-600 transition-colors"
                                >
                                  {isExpanded ? (
                                    <>
                                      Less <ChevronUp className="w-3 h-3" />
                                    </>
                                  ) : (
                                    <>
                                      More tips <ChevronDown className="w-3 h-3" />
                                    </>
                                  )}
                                </button>
                              </div>

                              {/* ADDED: Expandable tips section */}
                              {isExpanded && (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                  <p className="text-xs text-gray-600 mb-2">Tips to help you succeed:</p>
                                  <ul className="text-xs text-gray-600 space-y-1 ml-4">
                                    {rec.expandedTips.map((tip, i) => (
                                      <li key={i} className="list-disc">{tip}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ADDED: Progress tracker */}
              {enhancedRecommendations.length > 0 && (
                <div className="mt-4 text-center">
                  <p className="text-xs text-gray-600">
                    {completedRecs.size === enhancedRecommendations.length
                      ? "🎉 All recommendations completed!"
                      : `Complete ${enhancedRecommendations.length - completedRecs.size} more to improve your wellness score`
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
