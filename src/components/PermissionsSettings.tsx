import {
  Bell,
  MapPin,
  Activity,
  Camera,
  Calendar,
  Smartphone,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Info,
  Settings as SettingsIcon
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { usePermissions } from "../hooks/usePermissions";
import { PERMISSION_CONFIGS, PermissionType, getPermissionStatusInfo } from "../lib/permissions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { DevTools } from "./DevTools";
import { useState } from "react";

const iconMap: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
  Bell,
  MapPin,
  Activity,
  Camera,
  Calendar,
  Smartphone,
};

const statusIconMap: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
  CheckCircle2,
  XCircle,
  AlertCircle,
};

export function PermissionsSettings() {
  const { permissions, requestPermission } = usePermissions();
  const [selectedPermission, setSelectedPermission] = useState<PermissionType | null>(null);

  const handlePermissionClick = (type: PermissionType) => {
    const perm = permissions[type];

    // If already granted, just show info
    if (perm.status === 'granted') {
      setSelectedPermission(type);
      return;
    }

    // If denied, show info on how to enable in system settings
    if (perm.status === 'denied') {
      setSelectedPermission(type);
      return;
    }

    // Otherwise, request permission
    requestPermission(type);
  };

  const requiredPermissions = Object.values(PERMISSION_CONFIGS).filter(p => p.isRequired);
  const optionalPermissions = Object.values(PERMISSION_CONFIGS).filter(p => !p.isRequired);

  const selectedConfig = selectedPermission ? PERMISSION_CONFIGS[selectedPermission] : null;
  const selectedPerm = selectedPermission ? permissions[selectedPermission] : null;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <SettingsIcon className="w-5 h-5 text-primary" />
          <h3>Permissions</h3>
        </div>
        <p className="text-muted-foreground">
          Manage data access for better predictions
        </p>
      </div>

      {/* Dev Tools */}
      <DevTools />

      {/* Required Permissions */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h4 className="text-sm">Required</h4>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
            Essential
          </Badge>
        </div>

        {requiredPermissions.map((config) => {
          const Icon = iconMap[config.icon];
          const perm = permissions[config.type];
          const statusInfo = getPermissionStatusInfo(perm.status);
          const StatusIcon = statusIconMap[statusInfo.icon];

          return (
            <Card
              key={config.type}
              className="p-4 active:scale-98 transition-transform cursor-pointer"
              onClick={() => handlePermissionClick(config.type)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`p-2.5 rounded-lg shrink-0 ${
                    perm.status === 'granted' ? 'bg-success/10' :
                    perm.status === 'denied' ? 'bg-destructive/10' :
                    'bg-primary/10'
                  }`}>
                    <Icon className={`w-5 h-5 ${
                      perm.status === 'granted' ? 'text-success' :
                      perm.status === 'denied' ? 'text-destructive' :
                      'text-primary'
                    }`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-medium mb-1">{config.title}</div>
                    <p className="text-muted-foreground text-sm truncate">
                      {config.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <Badge
                    variant="outline"
                    className={`${
                      perm.status === 'granted' ? 'bg-success/10 text-success border-success/20' :
                      perm.status === 'denied' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                      'bg-warning/10 text-warning border-warning/20'
                    }`}
                  >
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {statusInfo.label}
                  </Badge>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Optional Permissions */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h4 className="text-sm">Optional</h4>
          <Badge variant="outline" className="bg-muted text-muted-foreground">
            Enhance Accuracy
          </Badge>
        </div>

        {optionalPermissions.map((config) => {
          const Icon = iconMap[config.icon];
          const perm = permissions[config.type];
          const statusInfo = getPermissionStatusInfo(perm.status);
          const StatusIcon = statusIconMap[statusInfo.icon];

          return (
            <Card
              key={config.type}
              className="p-4 active:scale-98 transition-transform cursor-pointer"
              onClick={() => handlePermissionClick(config.type)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`p-2.5 rounded-lg shrink-0 ${
                    perm.status === 'granted' ? 'bg-success/10' : 'bg-muted'
                  }`}>
                    <Icon className={`w-5 h-5 ${
                      perm.status === 'granted' ? 'text-success' : 'text-muted-foreground'
                    }`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-medium mb-1">{config.title}</div>
                    <p className="text-muted-foreground text-sm truncate">
                      {config.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <Badge
                    variant="outline"
                    className={`${
                      perm.status === 'granted' ? 'bg-success/10 text-success border-success/20' :
                      perm.status === 'denied' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                      'bg-muted text-muted-foreground'
                    }`}
                  >
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {statusInfo.label}
                  </Badge>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Info Card */}
      <Card className="p-4 bg-primary/5 border-primary/20">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-primary mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="font-medium mb-1">Privacy First</div>
            <p className="text-muted-foreground text-sm">
              All data is processed locally on your device. No information is sent to external servers.
            </p>
          </div>
        </div>
      </Card>

      {/* Permission Detail Dialog */}
      <Dialog open={selectedPermission !== null} onOpenChange={() => setSelectedPermission(null)}>
        <DialogContent className="max-w-md mx-4">
          {selectedConfig && selectedPerm && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-3 rounded-xl ${
                    selectedPerm.status === 'granted' ? 'bg-success/10' :
                    selectedPerm.status === 'denied' ? 'bg-destructive/10' :
                    'bg-primary/10'
                  }`}>
                    {(() => {
                      const Icon = iconMap[selectedConfig.icon];
                      return <Icon className={`w-6 h-6 ${
                        selectedPerm.status === 'granted' ? 'text-success' :
                        selectedPerm.status === 'denied' ? 'text-destructive' :
                        'text-primary'
                      }`} />;
                    })()}
                  </div>
                  <DialogTitle>{selectedConfig.title}</DialogTitle>
                </div>
                <DialogDescription className="text-left space-y-4">
                  <div>
                    <div className="text-foreground font-medium mb-2">What it does</div>
                    <p>{selectedConfig.description}</p>
                  </div>

                  <div>
                    <div className="text-foreground font-medium mb-2">Benefits</div>
                    <p>{selectedConfig.benefit}</p>
                  </div>

                  {selectedPerm.status === 'denied' && (
                    <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-warning mt-0.5 shrink-0" />
                        <div className="text-warning text-sm">
                          <div className="font-medium mb-1">Permission Blocked</div>
                          <p className="text-warning/80">
                            To enable this, please go to your device Settings → Safari → AuraSense and allow access.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedPerm.status === 'granted' && (
                    <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                      <div className="flex items-center gap-2 text-success">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-sm font-medium">Active & Working</span>
                      </div>
                    </div>
                  )}
                </DialogDescription>
              </DialogHeader>

              <div className="flex gap-3 mt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setSelectedPermission(null)}
                >
                  Close
                </Button>

                {selectedPerm.status !== 'granted' && (
                  <Button
                    className="flex-1"
                    onClick={() => {
                      requestPermission(selectedPermission);
                      setSelectedPermission(null);
                    }}
                  >
                    {selectedPerm.status === 'denied' ? 'Try Again' : 'Enable'}
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
