import { useState, useEffect, useCallback } from "react";
import { Activity, BarChart3, History, Settings, Brain, Home } from "lucide-react";
import { Analytics } from '@vercel/analytics/react';
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
import MigraineLogDialog from "./components/MigraineLogDialog";

const sleep = async (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const dates = [
  // '2025-10-30',
  // '2025-10-19',
  // '2025-10-20',
  // '2025-10-12',
  // '2025-10-14',
  '2025-11-02',
  '2025-11-03',
  '2025-11-04',
  '2025-11-05',
  '2025-11-06',
].map((t) => new Date(t).getTime());

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

  // Function to send browser notification
  const sendNotification = useCallback(async (score: number) => {
    if (!notificationsEnabled) return;
    if (!("Notification" in window) || !('permissions' in navigator)) return;

    const notifStatus = await navigator.permissions.query({ name: 'notifications' as PermissionName });

    if (notifStatus.state !== 'granted') {
      const status = await Notification.requestPermission();
      if (status !== 'granted') return;
    }

    const notification = new Notification("Migraine chance is high", {
      body: `Your have a high chance of migraine. Consider taking preventive measures.`,
      icon: "/favicon.ico", // You may want to add a custom icon
      badge: "/favicon.ico",
      tag: `${score}-risk-alert`, // Prevents duplicate notifications
      requireInteraction: false,
    });

    // Auto-close notification after 5 seconds
    setTimeout(() => {
      notification.close();
    }, 5000);
  }, [notificationsEnabled]);

  // Wait for collectors to initialize (parses mock CSV into the 'general' store),
  // then load latest mock/general data and run prediction.
  useEffect(() => {
    let mounted = true;
    async function initAndPredict() {
      // Ensure the collectors (including mock CSV parsing) have finished.
      await initListeners();

      const data = await Promise.all(dates.map((t) => storage.readData<GeneralData>(t, 'general')));
      if (!mounted) return;

      let i = 0;
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const item = data[i]!;
        const result = await predictMigraneRisk(item);
        const score = Math.round(result.score * 100);

        if (score >= 70) {
          sendNotification(score);
        }

        setRiskScorePercent(score);
        setPredictionMeta(result.meta);
        i++;

        if (i >= data.length) i = 0
        await sleep(10000);
      }
    }
    initAndPredict();
    return () => { mounted = false; };
  }, [sendNotification]);

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
      <Analytics />
    </PermissionsProvider>
  );
}

export default App;
