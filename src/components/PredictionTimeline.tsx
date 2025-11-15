import { useMemo } from "react";
import { Card } from "./ui/card";
import {
  XAxis,
  YAxis,
  Tooltip,
  Area,
  AreaChart,
  ResponsiveContainer,
} from "recharts";
import { data as mockCsv } from "../internal/collectors/mock.data";

/**
 * PredictionTimeline
 *
 * - Uses the CSV mock data to render the last 30 days.
 * - Latest day is shown on the left (data is reversed).
 * - Chart takes the full width of the row and is horizontally scrollable so days don't shrink.
 * - Legend is placed below the chart so it's always visible without horizontal scrolling.
 */

function parseCsv(csv: string) {
  const trimmed = (csv || "").trim();
  if (!trimmed) return [];
  const lines = trimmed.split(/\r?\n/).filter(Boolean);
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cols = line.split(",");
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = (cols[i] ?? "").trim();
    });
    return obj;
  });
}

function formatDateLabel(dateStr: string) {
  // Parse without timezone drift
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

export function PredictionTimeline() {
  const parsed = useMemo(() => parseCsv(mockCsv), []);

  // Build and prepare chart data: last 30 days, latest first (leftmost)
  const chartData = useMemo(() => {
    const mapped = parsed
      .map((r) => {
        const date = r.date;
        const migraine_next_day = Number(r.migraine_next_day ?? 0);
        const stress_level = Number(r.stress_level ?? 0);

        const migraine_pct = Number.isFinite(migraine_next_day)
          ? Math.round(migraine_next_day * 100)
          : 0;
        const stress_pct = Number.isFinite(stress_level)
          ? Math.round((stress_level / 5) * 100)
          : 0;

        return {
          date,
          label: formatDateLabel(date),
          migraine_pct,
          stress_pct,
        };
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Last 30 days, reversed so the most recent is first (left)
    return mapped.slice(-30).reverse();
  }, [parsed]);

  // small stats
  const peakMigraine = useMemo(() => {
    if (!chartData.length) return { pct: 0, date: "" };
    let max = -Infinity;
    let date = "";
    for (const p of chartData) {
      if (p.migraine_pct > max) {
        max = p.migraine_pct;
        date = p.date;
      }
    }
    return { pct: max === -Infinity ? 0 : max, date };
  }, [chartData]);

  const avgStress = useMemo(() => {
    if (!chartData.length) return 0;
    const sum = chartData.reduce((s, p) => s + p.stress_pct, 0);
    return Math.round(sum / chartData.length);
  }, [chartData]);

  // keep each day reasonably wide so they don't shrink
  const DAY_WIDTH_PX = 72;
  const minChartWidth = Math.max(30, chartData.length) * DAY_WIDTH_PX;

  return (
    <Card className="p-5">
      <div className="mb-4">
        <h4>30-Day Timeline</h4>
        <p className="text-muted-foreground">
          Latest day on the left — horizontal scroll to see older days
        </p>
      </div>

      {/* Chart full-row width; horizontally scrollable so day columns don't shrink */}
      <div className="w-full">
        <div className="h-56 w-full overflow-x-auto">
          <div style={{ minWidth: `${minChartWidth}px`, height: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                // Change 'left: 0' to a negative value like 'left: -20'
                margin={{ top: 8, right: 12, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="migraineGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="stressGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <XAxis
                  dataKey="label"
                  stroke="#94a3b8"
                  style={{ fontSize: "11px" }}
                  interval={0}
                />
                <YAxis
                  stroke="#94a3b8"
                  style={{ fontSize: "11px" }}
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    padding: "8px 12px",
                    fontSize: "14px",
                  }}
                  formatter={(value: number, name: string) => {
                    const label = name === "migraine_pct" ? "Migraine %" : "Stress %";
                    return [`${value}%`, label];
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="migraine_pct"
                  name="Migraine"
                  stroke="#ef4444"
                  strokeWidth={2}
                  fill="url(#migraineGradient)"
                  activeDot={{ r: 3 }}
                />
                <Area
                  type="monotone"
                  dataKey="stress_pct"
                  name="Stress (scaled)"
                  stroke="#7c3aed"
                  strokeWidth={2}
                  fill="url(#stressGradient)"
                  activeDot={{ r: 3 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Legend under the chart so it's always visible */}
        <div className="mt-2 flex flex-wrap gap-4 items-center justify-center">
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 bg-[#ef4444] rounded" />
            <span className="text-sm">Migraine</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 bg-[#7c3aed] rounded" />
            <span className="text-sm">Stress (scaled)</span>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-2 pt-4 border-t">
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div className="text-muted-foreground">Peak Migraine Risk</div>
          <div className="flex items-baseline gap-1">
            <span className="text-destructive">{peakMigraine.pct}%</span>
            <span className="text-muted-foreground">
              {peakMigraine.date ? `on ${formatDateLabel(peakMigraine.date)}` : ""}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div className="text-muted-foreground">Average Stress</div>
          <div className="flex items-baseline gap-1">
            <span className="text-success">{avgStress}%</span>
            <span className="text-muted-foreground">last 30 days</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
