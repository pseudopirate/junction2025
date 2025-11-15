import { Card } from "./ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { TrendingUp, Moon, Smartphone, Calendar, Activity, Cloud } from "lucide-react";
import { Badge } from "./ui/badge";

const triggerData = [
  { name: "Poor Sleep", value: 35, color: "#7c3aed" },
  { name: "High Screen Time", value: 25, color: "#3b82f6" },
  { name: "Stress (Calendar)", value: 20, color: "#06b6d4" },
  { name: "Low HRV", value: 15, color: "#8b5cf6" },
  { name: "Weather Changes", value: 5, color: "#6366f1" },
];

const recentTriggers = [
  { icon: Moon, label: "Sleep Quality", value: "4.2h deep sleep", trend: "down", impact: "high" },
  { icon: Smartphone, label: "Screen Time", value: "8.5h today", trend: "up", impact: "moderate" },
  { icon: Activity, label: "Heart Rate Variability", value: "42 ms", trend: "down", impact: "moderate" },
  { icon: Calendar, label: "Calendar Density", value: "12 meetings", trend: "up", impact: "high" },
  { icon: Cloud, label: "Barometric Pressure", value: "Dropping", trend: "down", impact: "low" },
];

export function TriggerInsights() {
  return (
    <div className="space-y-6">
      {/* Trigger Breakdown Chart */}
      <Card className="p-5">
        <div className="mb-4">
          <h4>Trigger Breakdown</h4>
          <p className="text-muted-foreground">Contributing factors</p>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={triggerData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={85}
                paddingAngle={2}
                dataKey="value"
              >
                {triggerData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontSize: '14px'
                }}
                formatter={(value: number) => [`${value}%`, 'Impact']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend - Mobile Optimized */}
        <div className="mt-4 space-y-2">
          {triggerData.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span>{item.name}</span>
              </div>
              <span className="text-muted-foreground">{item.value}%</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Real-time Signals */}
      <Card className="p-5">
        <div className="mb-4">
          <h4>Real-time Signals</h4>
          <p className="text-muted-foreground">Current biometric data</p>
        </div>

        <div className="space-y-3">
          {recentTriggers.map((trigger, index) => {
            const Icon = trigger.icon;
            const impactColors = {
              high: "bg-destructive/10 text-destructive border-destructive/20",
              moderate: "bg-warning/10 text-warning border-warning/20",
              low: "bg-success/10 text-success border-success/20"
            };

            return (
              <div
                key={index}
                className="flex items-center gap-3 p-4 rounded-lg border bg-card active:bg-muted/50 transition-colors"
              >
                <div className="p-2.5 rounded-lg bg-primary/10 shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="truncate">{trigger.label}</span>
                    <Badge
                      variant="outline"
                      className={`${impactColors[trigger.impact as keyof typeof impactColors]} shrink-0`}
                    >
                      {trigger.impact}
                    </Badge>
                  </div>
                  <div className="text-muted-foreground">{trigger.value}</div>
                </div>

                <TrendingUp
                  className={`w-5 h-5 shrink-0 ${
                    trigger.trend === "up" ? "text-destructive rotate-0" : "text-success rotate-180"
                  }`}
                />
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
