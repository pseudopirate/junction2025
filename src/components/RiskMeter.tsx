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
} | null;

interface RiskMeterProps {
  riskLevel: number; // 0-100
  predictionMeta?: PredictionMeta;
}

export function RiskMeter({ riskLevel, predictionMeta }: RiskMeterProps) {
  const getRiskStatus = () => {
    if (riskLevel < 30) return { label: "Low Risk", color: "text-success", gradient: "gradient-risk-low", icon: CheckCircle2 };
    if (riskLevel < 70) return { label: "Moderate Risk", color: "text-warning", gradient: "gradient-risk-moderate", icon: AlertCircle };
    return { label: "High Risk", color: "text-destructive", gradient: "gradient-risk-high", icon: AlertTriangle };
  };

  const status = getRiskStatus();
  const Icon = status.icon;

  // Calculate circle progress - Adjusted for mobile
  const circumference = 2 * Math.PI * 70;
  const progress = circumference - (riskLevel / 100) * circumference;

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

        {/* Circular Progress - Mobile Optimized */}
        <div className="flex items-center justify-center my-6">
          <div className="relative w-56 h-56">
            <svg className="transform -rotate-90 w-56 h-56">
              {/* Background circle */}
              <circle
                cx="112"
                cy="112"
                r="70"
                stroke="currentColor"
                strokeWidth="14"
                fill="none"
                className="text-muted"
              />
              {/* Progress circle */}
              <circle
                cx="112"
                cy="112"
                r="70"
                stroke="currentColor"
                strokeWidth="14"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={progress}
                strokeLinecap="round"
                className={`${status.color} transition-all duration-1000 ease-out`}
              />
            </svg>

            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className={`text-6xl mb-2 ${status.color}`}>{riskLevel}%</div>
              <div className="text-muted-foreground">Risk Level</div>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="text-center">
          <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-full ${status.gradient} text-white mb-3`}>
            <div className="w-2 h-2 bg-white rounded-full animate-pulse-slow" />
            <span>{status.label}</span>
          </div>

          {/* Only show summary and recommendations to the user */}
          { (predictionMeta?.detailedExplanation?.summary ?? predictionMeta?.explanation) && (
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
      </div>
    </Card>
  );
}
