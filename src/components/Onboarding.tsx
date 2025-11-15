import { useState } from "react";
import {
  Brain,
  Bell,
  MapPin,
  Activity,
  Camera,
  Calendar,
  Smartphone,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Shield,
  Zap
} from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { usePermissions } from "../hooks/usePermissions";
import { PERMISSION_CONFIGS, PermissionType, completeOnboarding } from "../lib/permissions";

interface OnboardingProps {
  onComplete: () => void;
}

const iconMap: Record<string, any> = {
  Bell,
  MapPin,
  Activity,
  Camera,
  Calendar,
  Smartphone,
};

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState<'welcome' | 'permissions' | 'ready'>('welcome');
  const { permissions, requestPermission } = usePermissions();

  const handlePermissionRequest = async (type: PermissionType) => {
    await requestPermission(type);
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

  const canContinue = step !== 'permissions' ||
    Object.values(permissions).every(perm => !perm.isRequired || perm.status === 'granted');

  // Welcome Step
  if (step === 'welcome') {
    return (
      <div className="fixed inset-0 bg-background z-50 flex flex-col">
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
              <h1 className="text-3xl">Welcome to MigrainePredict</h1>
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

  // Permissions Step
  if (step === 'permissions') {
    const requiredPermissions = Object.values(PERMISSION_CONFIGS).filter(p => p.isRequired);
    const optionalPermissions = Object.values(PERMISSION_CONFIGS).filter(p => !p.isRequired);

    return (
      <div className="fixed inset-0 bg-background z-50 flex flex-col">
        {/* Header */}
        <div className="px-6 pt-8 pb-6 border-b">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl gradient-primary">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl">Quick Setup</h2>
          </div>
          <p className="text-muted-foreground">
            Enable permissions to get personalized predictions
          </p>
        </div>

        {/* Permissions List */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Required Permissions */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-4">
              <h4 className="text-sm">Required</h4>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                Essential
              </Badge>
            </div>

            {requiredPermissions.map((config) => {
              const Icon = iconMap[config.icon];
              const perm = permissions[config.type];
              const isGranted = perm.status === 'granted';

              return (
                <Card key={config.type} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-lg shrink-0 ${
                      isGranted ? 'bg-success/10' : 'bg-primary/10'
                    }`}>
                      {isGranted ? (
                        <CheckCircle2 className="w-5 h-5 text-success" />
                      ) : (
                        <Icon className="w-5 h-5 text-primary" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-medium mb-1">{config.title}</div>
                      <p className="text-muted-foreground text-sm mb-3">
                        {config.benefit}
                      </p>

                      {!isGranted ? (
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() => handlePermissionRequest(config.type)}
                        >
                          Enable
                        </Button>
                      ) : (
                        <div className="flex items-center gap-2 text-success text-sm">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Enabled</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Optional Permissions */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-4">
              <h4 className="text-sm">Optional</h4>
              <Badge variant="outline" className="bg-muted text-muted-foreground">
                Enhance Accuracy
              </Badge>
            </div>

            {optionalPermissions.map((config) => {
              const Icon = iconMap[config.icon];
              const perm = permissions[config.type];
              const isGranted = perm.status === 'granted';

              return (
                <Card key={config.type} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-lg shrink-0 ${
                      isGranted ? 'bg-success/10' : 'bg-muted'
                    }`}>
                      {isGranted ? (
                        <CheckCircle2 className="w-5 h-5 text-success" />
                      ) : (
                        <Icon className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-medium mb-1">{config.title}</div>
                      <p className="text-muted-foreground text-sm mb-3">
                        {config.benefit}
                      </p>

                      {!isGranted ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          onClick={() => handlePermissionRequest(config.type)}
                        >
                          Enable
                        </Button>
                      ) : (
                        <div className="flex items-center gap-2 text-success text-sm">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Enabled</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="p-4 rounded-lg bg-muted/50 border">
            <p className="text-muted-foreground text-sm">
              💡 You can always change these permissions later in Settings
            </p>
          </div>
        </div>

        {/* Continue Button */}
        <div className="p-6 border-t bg-background/95 backdrop-blur">
          <Button
            size="lg"
            className="w-full h-14 text-base"
            onClick={handleContinue}
            disabled={!canContinue}
          >
            {canContinue ? 'Continue' : 'Enable Required Permissions'}
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  // Ready Step
  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="flex justify-center">
          <div className="p-8 rounded-3xl bg-success/10">
            <CheckCircle2 className="w-20 h-20 text-success" />
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl">You're All Set!</h2>
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
