import { Card } from "./ui/card";
import { XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";

const data = [
  { time: "Now", risk: 35 },
  { time: "3h", risk: 42 },
  { time: "6h", risk: 58 },
  { time: "9h", risk: 72 },
  { time: "12h", risk: 68 },
  { time: "15h", risk: 55 },
  { time: "18h", risk: 48 },
  { time: "21h", risk: 38 },
  { time: "24h", risk: 30 },
];

export function PredictionTimeline() {
  return (
    <Card className="p-5">
      <div className="mb-4">
        <h4>24-Hour Forecast</h4>
        <p className="text-muted-foreground">Expected risk pattern</p>
      </div>

      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis
              dataKey="time"
              stroke="#94a3b8"
              style={{ fontSize: '11px' }}
            />
            <YAxis
              stroke="#94a3b8"
              style={{ fontSize: '11px' }}
              domain={[0, 100]}
              ticks={[0, 50, 100]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '14px'
              }}
              formatter={(value: number) => [`${value}%`, 'Risk']}
            />
            <Area
              type="monotone"
              dataKey="risk"
              stroke="#7c3aed"
              strokeWidth={2.5}
              fill="url(#riskGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 space-y-2 pt-4 border-t">
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div className="text-muted-foreground">Peak Risk</div>
          <div className="flex items-baseline gap-1">
            <span className="text-destructive">72%</span>
            <span className="text-muted-foreground">at 9h</span>
          </div>
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div className="text-muted-foreground">Safe Window</div>
          <div className="flex items-baseline gap-1">
            <span className="text-success">18-24h</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
