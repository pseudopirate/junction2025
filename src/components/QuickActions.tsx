import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Bell, BellOff, Pill, FileText } from "lucide-react";
import { Badge } from "./ui/badge";

interface QuickActionsProps {
  notificationsEnabled: boolean;
  onToggleNotifications: () => void;
}

export function QuickActions({ notificationsEnabled, onToggleNotifications }: QuickActionsProps) {
  return (
    <Card className="p-5">
      <div className="mb-4">
        <h4>Quick Actions</h4>
      </div>

      <div className="space-y-3">
        {/* Notifications Toggle */}
        <Button
          variant="outline"
          className="w-full justify-start h-auto p-4 active:scale-98 transition-transform"
          onClick={onToggleNotifications}
        >
          <div className="flex items-center gap-3 flex-1">
            {notificationsEnabled ? (
              <Bell className="w-5 h-5 text-primary" />
            ) : (
              <BellOff className="w-5 h-5 text-muted-foreground" />
            )}
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2 mb-1">
                <span>Proactive Alerts</span>
                {notificationsEnabled && (
                  <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                    On
                  </Badge>
                )}
              </div>
              <div className="text-muted-foreground">
                {notificationsEnabled
                  ? "Enabled"
                  : "Tap to enable"
                }
              </div>
            </div>
          </div>
        </Button>

        {/* Log Medication */}
        <Button variant="outline" className="w-full justify-start h-auto p-4 active:scale-98 transition-transform">
          <div className="flex items-center gap-3 flex-1">
            <Pill className="w-5 h-5 text-primary" />
            <div className="flex-1 text-left">
              <div className="mb-1">Log Medication</div>
              <div className="text-muted-foreground">Track treatment</div>
            </div>
          </div>
        </Button>

        {/* Export Report */}
        <Button variant="outline" className="w-full justify-start h-auto p-4 active:scale-98 transition-transform">
          <div className="flex items-center gap-3 flex-1">
            <FileText className="w-5 h-5 text-primary" />
            <div className="flex-1 text-left">
              <div className="mb-1">Export Report</div>
              <div className="text-muted-foreground">Share with doctor</div>
            </div>
          </div>
        </Button>
      </div>
    </Card>
  );
}
