import { useEffect, useState } from "react";
import { Activity, BarChart3, History, Settings, Brain, Home } from "lucide-react";
import { RiskMeter } from "./components/RiskMeter";
import { PredictionTimeline } from "./components/PredictionTimeline";
import { TriggerInsights } from "./components/TriggerInsights";
import { DataSources } from "./components/DataSources";
import { HistoryView } from "./components/HistoryView";
import { QuickActions } from "./components/QuickActions";
import { MobileOptimized } from "./components/MobileOptimized";
import { Button } from "./components/ui/button";
import { ensurePermissions, initListeners } from "./internal/collectors";

function App() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState("home");
  useEffect(() => {
    (async () => {
      await ensurePermissions();
      await initListeners();
    })()
  }, []);

  return (
    <MobileOptimized>
      <div className="min-h-screen bg-background pb-20">
        {/* Mobile Header */}
        <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl gradient-primary">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg">MigrainePredict</h2>
                </div>
              </div>

              <Button variant="ghost" size="icon" className="rounded-full">
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content - Mobile Optimized */}
        <main className="px-4 py-6">
          {/* Home View */}
          {activeTab === "home" && (
            <div className="space-y-6">
              <RiskMeter
                riskLevel={35}
                nextPrediction="Peak risk expected around 9am tomorrow"
              />

              <PredictionTimeline />

              <QuickActions
                notificationsEnabled={notificationsEnabled}
                onToggleNotifications={() => setNotificationsEnabled(!notificationsEnabled)}
              />
            </div>
          )}

          {/* Insights View */}
          {activeTab === "insights" && (
            <div className="space-y-6">
              <TriggerInsights />
            </div>
          )}

          {/* Sources View */}
          {activeTab === "sources" && (
            <div className="space-y-6">
              <DataSources />
            </div>
          )}

          {/* History View */}
          {activeTab === "history" && (
            <div className="space-y-6">
              <HistoryView />
            </div>
          )}
        </main>

        {/* Bottom Navigation - Mobile */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-around px-2 py-2">
            <button
              onClick={() => setActiveTab("home")}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${
                activeTab === "home"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <Home className="w-5 h-5" />
              <span className="text-xs">Home</span>
            </button>

            <button
              onClick={() => setActiveTab("insights")}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${
                activeTab === "insights"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              <span className="text-xs">Insights</span>
            </button>

            <button
              onClick={() => setActiveTab("sources")}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${
                activeTab === "sources"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <Activity className="w-5 h-5" />
              <span className="text-xs">Sources</span>
            </button>

            <button
              onClick={() => setActiveTab("history")}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${
                activeTab === "history"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <History className="w-5 h-5" />
              <span className="text-xs">History</span>
            </button>
          </div>
        </nav>
      </div>
    </MobileOptimized>
  );
}

export default App;
