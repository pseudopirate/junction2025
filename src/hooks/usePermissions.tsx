import { createContext, useContext, useState, useEffect, ReactNode, FC } from 'react';
import {
  Permission,
  PermissionType,
  loadPermissions,
  savePermissions,
  requestNotificationPermission,
  requestLocationPermission,
  requestMotionPermission,
} from '../lib/permissions';

interface PermissionsContextType {
  permissions: Record<PermissionType, Permission>;
  requestPermission: (type: PermissionType | null) => Promise<boolean>;
  updatePermission: (type: PermissionType, status: Permission['status']) => void;
  hasRequiredPermissions: boolean;
  isLoading: boolean;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

/**
 * Provider component for permissions.
 * This file is a .tsx so the Provider can return JSX without parser errors.
 */
export const PermissionsProvider: FC<{ children?: ReactNode }> = ({ children }) => {
  const [permissions, setPermissions] = useState<Record<PermissionType, Permission>>(() =>
    loadPermissions()
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load permissions on mount
  useEffect(() => {
    const loaded = loadPermissions();
    setPermissions(loaded);
    setIsLoading(false);
  }, []);

  // Save permissions whenever they change (after initial load)
  useEffect(() => {
    if (!isLoading) {
      savePermissions(permissions);
    }
  }, [permissions, isLoading]);

  // Check if all required permissions are granted
  const hasRequiredPermissions = Object.values(permissions).every(
    (perm) => !perm.isRequired || perm.status === 'granted'
  );

  const updatePermission = (type: PermissionType, status: Permission['status']) => {
    setPermissions((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        status,
        lastRequested: new Date(),
      },
    }));
  };

  const requestPermission = async (type: PermissionType | null): Promise<boolean> => {
    if (type === null) {
      // Called with no selection — nothing to request.
      return false;
    }

    let result: 'granted' | 'denied' | 'prompt' = 'denied';

    try {
      switch (type) {
        case 'notifications':
          result = await requestNotificationPermission();
          break;
        case 'location':
          result = await requestLocationPermission();
          break;
        case 'motion':
          result = await requestMotionPermission();
          break;
        case 'camera':
        case 'calendar':
        case 'screenTime':
          // These may require native integrations; default to 'granted' for now
          result = 'granted';
          break;
        default:
          result = 'denied';
      }

      updatePermission(type, result);
      return result === 'granted';
    } catch (error) {
      // Keep the error logging simple and informative
      // eslint-disable-next-line no-console
      console.error(`Failed to request ${type} permission:`, error);
      updatePermission(type, 'denied');
      return false;
    }
  };

  return (
    <PermissionsContext.Provider
      value={{
        permissions,
        requestPermission,
        updatePermission,
        hasRequiredPermissions,
        isLoading,
      }}
    >
      {children}
    </PermissionsContext.Provider>
  );
};

export function usePermissions(): PermissionsContextType {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
}