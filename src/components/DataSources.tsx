import { Card } from "./ui/card";
import { Switch } from "./ui/switch";
import { Badge } from "./ui/badge";
import { Watch, Moon, Smartphone, Calendar, Cloud, Activity } from "lucide-react";

const dataSources = [
  {
    icon: Watch,
    name: "Apple Watch",
    description: "HRV, heart rate, activity",
    connected: true,
    lastSync: "2 min ago"
  },
  {
    icon: Moon,
    name: "Sleep Tracking",
    description: "Sleep quality, duration, phases",
    connected: true,
    lastSync: "5 min ago"
  },
  {
    icon: Smartphone,
    name: "Screen Time",
    description: "Usage patterns, blue light exposure",
    connected: true,
    lastSync: "1 min ago"
  },
  {
    icon: Calendar,
    name: "Calendar Events",
    description: "Meeting density, stress indicators",
    connected: true,
    lastSync: "Just now"
  },
  {
    icon: Cloud,
    name: "Weather Data",
    description: "Barometric pressure, temperature",
    connected: true,
    lastSync: "3 min ago"
  },
  {
    icon: Activity,
    name: "Activity Monitor",
    description: "Steps, exercise, movement",
    connected: false,
    lastSync: "Not connected"
  },
];

export function DataSources() {
  return (
    <Card className="p-5">
      <div className="mb-4">
        <h4>Data Sources</h4>
        <p className="text-muted-foreground">Connected signals</p>
      </div>

      <div className="space-y-3">
        {dataSources.map((source, index) => {
          const Icon = source.icon;

          return (
            <div
              key={index}
              className="flex items-center justify-between p-4 rounded-lg border bg-card"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`p-2.5 rounded-lg shrink-0 ${source.connected ? 'bg-primary/10' : 'bg-muted'}`}>
                  <Icon className={`w-5 h-5 ${source.connected ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="truncate">{source.name}</span>
                    {source.connected && (
                      <Badge variant="outline" className="bg-success/10 text-success border-success/20 shrink-0">
                        On
                      </Badge>
                    )}
                  </div>
                  <div className="text-muted-foreground truncate">{source.description}</div>
                  <div className="text-muted-foreground mt-1">
                    {source.lastSync}
                  </div>
                </div>
              </div>

              <Switch checked={source.connected} className="shrink-0 ml-3" />
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-4 rounded-lg bg-muted/50 border">
        <div className="flex items-start gap-3">
          <Activity className="w-5 h-5 text-primary mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="mb-1">ML Model Status</div>
            <div className="text-muted-foreground">
              Trained on 45 days • 87% accuracy
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
