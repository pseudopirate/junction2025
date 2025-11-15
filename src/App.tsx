import { useState, useEffect } from "react";
import { Activity, BarChart3, History, Settings, Brain, Home } from "lucide-react";
import { RiskMeter, PredictionMeta } from "./components/RiskMeter";
import { PredictionTimeline } from "./components/PredictionTimeline";
import { TriggerInsights } from "./components/TriggerInsights";
import { DataSources } from "./components/DataSources";
import { HistoryView } from "./components/HistoryView";
import { QuickActions } from "./components/QuickActions";
import { MobileOptimized } from "./components/MobileOptimized";
import { Onboarding } from "./components/Onboarding";
import { PermissionsSettings } from "./components/PermissionsSettings";
import { PermissionsProvider } from "./hooks/usePermissions";
import { isOnboardingComplete } from "./lib/permissions";
import { Button } from "./components/ui/button";
import { predictMigraneRisk } from "./internal/decision";
import { storage, type GeneralData } from "./internal/storage";
import { initListeners } from "./internal/collectors";


function AppContent() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState("home");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Prediction state

  const [riskScorePercent, setRiskScorePercent] = useState<number | null>(null);
  const [predictionMeta, setPredictionMeta] = useState<PredictionMeta>(null);



  useEffect(() => {
    // Check if onboarding is complete
    const onboardingDone = isOnboardingComplete();
    setShowOnboarding(!onboardingDone);
    setIsLoading(false);
  }, []);

  // Wait for collectors to initialize (parses mock CSV into the 'general' store),
  // then load latest mock/general data and run prediction.
  useEffect(() => {
    let mounted = true;
    async function initAndPredict() {
      try {
        // Ensure the collectors (including mock CSV parsing) have finished.
        await initListeners();

        const data = await storage.readAllData<GeneralData>('general');
        if (!data || data.length === 0) return;
        // Use the latest entry (last in array) as the sample for prediction.
        const latest = data[data.length - 1];
        const result = await predictMigraneRisk(latest);
        if (!mounted) return;
        const rawScore = result.score ?? 0;
        const scorePercent = Math.round(rawScore * 100);
        setRiskScorePercent(scorePercent);
        setPredictionMeta(result.meta ?? null);
      } catch (e) {
        console.error('Failed to initialize collectors or run prediction', e);
      }
    }
    initAndPredict();
    return () => { mounted = false; };
  }, []);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="p-6 rounded-3xl gradient-primary animate-pulse">
          <Brain className="w-16 h-16 text-white" />
        </div>
      </div>
    );
  }

  // Show onboarding if not complete
  if (showOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Mobile Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl gradient-primary">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg">AuraSense</h2>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => {}}
              aria-disabled="true"
              tabIndex={-1}
            >
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
              riskLevel={riskScorePercent ?? 35}
              predictionMeta={predictionMeta as PredictionMeta}
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

        {/* Settings View */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            <PermissionsSettings />
          </div>
        )}
      </main>

      {/* Bottom Navigation - Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
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
  );
}

function App() {
  return (
    <PermissionsProvider>
      <MobileOptimized>
        <AppContent />
      </MobileOptimized>
    </PermissionsProvider>
  );
}

export default App;
