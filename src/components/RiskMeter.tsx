import { AlertTriangle, CheckCircle2, AlertCircle } from "lucide-react";
import { Card } from "./ui/card";
import MigraineLogDialog from "./MigraineLogDialog";

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
        {/* Log Migraine widget placed at the top inside the card (in-flow) */}
        <div className="mb-4">
          <MigraineLogDialog>
            <div className="p-4 rounded-2xl gradient-primary text-white shadow-lg w-full flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-semibold">Log Migraine</span>
                <span className="text-sm text-white/90">Quickly record an attack</span>
              </div>

              {/* Animated attention icon: uses app's slow pulse animation */}
              <div className="ml-4 flex items-center">
                <div className="relative w-10 h-10 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-white/10 animate-pulse-slow" />
                  <div className="relative z-10 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    {/* simple plus icon (white) */}
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5 text-white" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v14M5 12h14" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </MigraineLogDialog>
        </div>

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
