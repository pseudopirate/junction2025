import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";

const history = [
  {
    date: "Nov 14, 2025",
    predicted: 78,
    actual: true,
    accuracy: "Correct",
    notes: "Predicted at 9am, migraine at 2pm"
  },
  {
    date: "Nov 11, 2025",
    predicted: 42,
    actual: false,
    accuracy: "Correct",
    notes: "Low risk maintained throughout day"
  },
  {
    date: "Nov 8, 2025",
    predicted: 65,
    actual: true,
    accuracy: "Correct",
    notes: "Predicted at 6am, migraine at 11am"
  },
  {
    date: "Nov 5, 2025",
    predicted: 82,
    actual: false,
    accuracy: "False Positive",
    notes: "High risk but no migraine occurred"
  },
  {
    date: "Nov 2, 2025",
    predicted: 55,
    actual: true,
    accuracy: "Correct",
    notes: "Moderate risk, mild migraine at 5pm"
  },
  {
    date: "Oct 30, 2025",
    predicted: 28,
    actual: false,
    accuracy: "Correct",
    notes: "Low risk day, no symptoms"
  },
  {
    date: "Oct 27, 2025",
    predicted: 71,
    actual: true,
    accuracy: "Correct",
    notes: "Predicted at 7am, severe migraine at 1pm"
  },
];

export function HistoryView() {
  return (
    <Card className="p-5">
      <div className="mb-4">
        <h4>Prediction History</h4>
        <p className="text-muted-foreground">Past predictions vs actual</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6 p-4 rounded-lg bg-muted/50">
        <div>
          <div className="text-muted-foreground mb-1">Accuracy</div>
          <div className="text-success">87%</div>
        </div>
        <div>
          <div className="text-muted-foreground mb-1">Predicted</div>
          <div>4/5</div>
        </div>
        <div>
          <div className="text-muted-foreground mb-1">False+</div>
          <div className="text-warning">1</div>
        </div>
      </div>

      {/* History List */}
      <div className="space-y-3">
        {history.map((item, index) => {
          const getAccuracyIcon = () => {
            if (item.accuracy === "Correct" && item.actual) {
              return { icon: CheckCircle2, color: "text-success", bgColor: "bg-success/10" };
            }
            if (item.accuracy === "Correct" && !item.actual) {
              return { icon: CheckCircle2, color: "text-success", bgColor: "bg-success/10" };
            }
            if (item.accuracy === "False Positive") {
              return { icon: AlertCircle, color: "text-warning", bgColor: "bg-warning/10" };
            }
            return { icon: XCircle, color: "text-destructive", bgColor: "bg-destructive/10" };
          };

          const accuracyConfig = getAccuracyIcon();
          const Icon = accuracyConfig.icon;

          return (
            <div
              key={index}
              className="flex items-start gap-3 p-4 rounded-lg border bg-card active:bg-muted/50 transition-colors"
            >
              <div className={`p-2 rounded-lg ${accuracyConfig.bgColor} mt-0.5 shrink-0`}>
                <Icon className={`w-5 h-5 ${accuracyConfig.color}`} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span>{item.date}</span>
                  <Badge
                    variant="outline"
                    className={`shrink-0 ${
                      item.accuracy === "Correct"
                        ? "bg-success/10 text-success border-success/20"
                        : "bg-warning/10 text-warning border-warning/20"
                    }`}
                  >
                    {item.accuracy}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-2">
                  <div>
                    <div className="text-muted-foreground">Predicted</div>
                    <div className={`${
                      item.predicted < 30 ? "text-success" :
                      item.predicted < 70 ? "text-warning" :
                      "text-destructive"
                    }`}>
                      {item.predicted}%
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Migraine</div>
                    <div>{item.actual ? "Yes" : "No"}</div>
                  </div>
                </div>

                <p className="text-muted-foreground">{item.notes}</p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
