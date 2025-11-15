import { useState } from "react";
import { Brain, Bell, CheckCircle2, ChevronRight, Sparkles, Shield, Zap, Activity } from 'lucide-react';
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { usePermissions } from "../hooks/usePermissions";
import { PERMISSION_CONFIGS, PermissionType, completeOnboarding } from "../lib/permissions";

interface OnboardingProps {
  onComplete: () => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState<'welcome' | 'permissions' | 'ready'>('welcome');
  const { permissions, requestPermission } = usePermissions();
  const [isRequesting, setIsRequesting] = useState(false);

  const handleEnableAllPermissions = async () => {
    setIsRequesting(true);
    try {
      // Request the single required permission (notifications)
      const requiredPermissions = Object.values(PERMISSION_CONFIGS).filter(p => p.isRequired);
      for (const config of requiredPermissions) {
        await requestPermission(config.type as PermissionType);
      }
    } finally {
      setIsRequesting(false);
    }
  };

  const handleContinue = () => {
    if (step === 'welcome') {
      setStep('permissions');
    } else if (step === 'permissions') {
      setStep('ready');
    } else {
      completeOnboarding();
      onComplete();
    }
  };

  // const allRequiredGranted = Object.values(permissions).every(perm => !perm.isRequired || perm.status === 'granted');

  // Welcome Step
  if (step === 'welcome') {
    return (
      <div className="fixed inset-0 bg-background z-50 flex flex-col overflow-y-auto">
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
          <div className="w-full max-w-md space-y-8">
            {/* Logo */}
            <div className="flex justify-center">
              <div className="p-6 rounded-3xl gradient-primary">
                <Brain className="w-16 h-16 text-white" />
              </div>
            </div>

            {/* Welcome Text */}
            <div className="text-center space-y-4">
              <h1 className="text-3xl font-bold text-balance">Welcome to MigrainePredict</h1>
              <p className="text-muted-foreground text-lg">
                Take control of your migraines with AI-powered predictions
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4 pt-4">
              <div className="flex items-start gap-4 p-4 rounded-xl bg-primary/5">
                <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="font-medium mb-1">Predictive Alerts</div>
                  <div className="text-muted-foreground text-sm">
                    Get warnings 24 hours before potential episodes
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl bg-primary/5">
                <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                  <Activity className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="font-medium mb-1">Automatic Tracking</div>
                  <div className="text-muted-foreground text-sm">
                    Works in the background with minimal input
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl bg-primary/5">
                <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="font-medium mb-1">Privacy First</div>
                  <div className="text-muted-foreground text-sm">
                    All data stays on your device, 100% private
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Continue Button */}
        <div className="p-6 border-t bg-background/95 backdrop-blur">
          <Button
            size="lg"
            className="w-full h-14 text-base"
            onClick={handleContinue}
          >
            Get Started
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  // Permissions Step - Completely redesigned for streamlined single-button UX
  if (step === 'permissions') {
    const notifPermission = permissions['notifications'];
    const isNotifGranted = notifPermission?.status === 'granted';

    return (
      <div className="fixed inset-0 bg-background z-50 flex flex-col">
        {/* Header */}
        <div className="px-6 pt-8 pb-6 border-b">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl gradient-primary">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold">Enable Notifications</h2>
          </div>
          <p className="text-muted-foreground">
            Stay alerted to migraine predictions
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 px-6 py-6 min-h-0">
          {/* Scrollable area with momentum scrolling on iOS and reserved bottom space so footer doesn't overlap */}
          <div
            className="h-full overflow-y-auto space-y-6 pr-2"
            style={{ WebkitOverflowScrolling: 'touch' as any, paddingBottom: 'calc(env(safe-area-inset-bottom) + 92px)' }}
          >
            {/* Single Permission Card */}
            <Card className="p-6 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/2">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg shrink-0 ${
                    isNotifGranted ? 'bg-green-500/10' : 'bg-primary/10'
                  }`}>
                    {isNotifGranted ? (
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    ) : (
                      <Bell className="w-6 h-6 text-primary" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">Proactive Alerts</h3>
                    <p className="text-muted-foreground mt-1">
                      Get notified 24 hours before potential migraine episodes so you can prepare
                    </p>
                  </div>
                </div>

                {isNotifGranted && (
                  <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 dark:bg-green-950/20 px-3 py-2 rounded-lg">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="font-medium">Enabled</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Info Box */}
            <div className="p-4 rounded-lg bg-muted/50 border space-y-2">
              <p className="text-sm font-medium text-foreground">Why this matters:</p>
              <p className="text-muted-foreground text-sm">
                Notifications are essential to deliver timely migraine predictions. You can manage more detailed settings later.
              </p>
            </div>
          </div>
        </div>

        {/* Button (fixed at bottom) */}
        <div className="absolute left-0 right-0 bottom-0 p-6 border-t bg-background/95 backdrop-blur space-y-3">
          <div className="max-w-md mx-auto">
            <Button
              size="lg"
              className="w-full h-14 text-base font-medium"
              onClick={async () => {
                await handleEnableAllPermissions();
                handleContinue();
              }}
              disabled={isRequesting || isNotifGranted}
              aria-busy={isRequesting}
            >
              {isRequesting && (
                <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin mr-2" />
              )}
              {isNotifGranted ? 'Notifications Enabled' : 'Enable Notifications'}
            </Button>

            {!isNotifGranted && (
              <div className="mt-3">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full h-12"
                  onClick={handleContinue}
                  disabled={isRequesting}
                >
                  Maybe Later
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Ready Step
  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-center px-6 overflow-y-auto">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="flex justify-center">
          <div className="p-8 rounded-3xl bg-green-500/10">
            <CheckCircle2 className="w-20 h-20 text-green-600" />
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-balance">You're All Set!</h2>
          <p className="text-muted-foreground text-lg">
            MigrainePredict is learning your patterns. Check back in 24 hours for your first prediction.
          </p>
        </div>

        <div className="pt-4">
          <Button
            size="lg"
            className="w-full h-14 text-base"
            onClick={handleContinue}
          >
            Start Tracking
          </Button>
        </div>
      </div>
    </div>
  );
}
