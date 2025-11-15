import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { RotateCcw } from "lucide-react";
import { resetOnboarding } from "../lib/permissions";

/**
 * Developer tools for testing
 * Only show in development mode
 */
export function DevTools() {
  // const isDev = import.meta.env.DEV;
  const isDev = process.env.NODE_ENV === 'development';

  if (!isDev) return null;

  const handleReset = () => {
    if (confirm("Reset onboarding and permissions? This will reload the page.")) {
      resetOnboarding();
      window.location.reload();
    }
  };

  return (
    <Card className="p-4 bg-warning/10 border-warning/20">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="font-medium mb-1 text-warning">Dev Tools</div>
          <p className="text-muted-foreground text-sm">
            Reset onboarding flow for testing
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleReset}
          className="shrink-0"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset
        </Button>
      </div>
    </Card>
  );
}
