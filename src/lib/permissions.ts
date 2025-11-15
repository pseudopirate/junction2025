/**
 * Permission Management System
 * Handles requesting, storing, and checking permissions for the PWA
 */

export type PermissionType =
  | 'notifications'
  | 'geolocation'
  | 'motion' // For activity tracking
  | 'camera' // For logging symptoms
  | 'calendar' // For schedule/stress patterns
  | 'screenTime'; // For digital behavior

export interface Permission {
  type: PermissionType;
  status: 'granted' | 'denied' | 'prompt' | 'not-requested';
  lastRequested?: Date;
  isRequired: boolean; // Core functionality vs optional
}

export interface PermissionConfig {
  type: PermissionType;
  title: string;
  description: string;
  benefit: string; // What the user gets from granting this
  isRequired: boolean;
  icon: string; // Lucide icon name
}

export const PERMISSION_CONFIGS: Record<PermissionType, PermissionConfig> = {
  notifications: {
    type: 'notifications',
    title: 'Proactive Alerts',
    description: 'Get timely warnings before migraine episodes',
    benefit: 'Stay ahead of migraines with predictive notifications',
    isRequired: true,
    icon: 'Bell',
  },
  geolocation: {
    type: 'geolocation',
    title: 'Geolocation',
    description: 'Track location changes and fast movement',
    benefit: 'Identify location and climate and fast movement triggers',
    isRequired: true,
    icon: 'MapPin',
  },
  motion: {
    type: 'motion',
    title: 'Activity Tracking',
    description: 'Monitor movement patterns and activity levels',
    benefit: 'Detect how exercise and rest impact your migraines',
    isRequired: false,
    icon: 'Activity',
  },
  camera: {
    type: 'camera',
    title: 'Visual Logging',
    description: 'Capture symptoms and triggers visually',
    benefit: 'Quick photo logs for doctor visits and tracking',
    isRequired: false,
    icon: 'Camera',
  },
  calendar: {
    type: 'calendar',
    title: 'Schedule Analysis',
    description: 'Analyze stress patterns from your calendar',
    benefit: 'Understand how busy schedules trigger episodes',
    isRequired: false,
    icon: 'Calendar',
  },
  screenTime: {
    type: 'screenTime',
    title: 'Screen Time',
    description: 'Monitor digital device usage patterns',
    benefit: 'Track how screen exposure affects migraines',
    isRequired: false,
    icon: 'Smartphone',
  },
};

// Local Storage Keys
const PERMISSIONS_KEY = 'migraine_predict_permissions';
const ONBOARDING_KEY = 'migraine_predict_onboarding_complete';

/**
 * Load permissions from local storage
 */
export function loadPermissions(): Record<PermissionType, Permission> {
  if (typeof window === 'undefined') {
    return getDefaultPermissions();
  }

  try {
    const stored = localStorage.getItem(PERMISSIONS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Convert date strings back to Date objects
      Object.keys(parsed).forEach((key) => {
        if (parsed[key].lastRequested) {
          parsed[key].lastRequested = new Date(parsed[key].lastRequested);
        }
      });
      return parsed;
    }
  } catch (error) {
    console.error('Failed to load permissions:', error);
  }

  return getDefaultPermissions();
}

/**
 * Save permissions to local storage
 */
export function savePermissions(permissions: Record<PermissionType, Permission>): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(permissions));
  } catch (error) {
    console.error('Failed to save permissions:', error);
  }
}

/**
 * Get default permission states
 */
function getDefaultPermissions(): Record<PermissionType, Permission> {
  const permissions: Record<string, Permission> = {};

  Object.entries(PERMISSION_CONFIGS).forEach(([key, config]) => {
    permissions[key] = {
      type: config.type,
      status: 'not-requested',
      isRequired: config.isRequired,
    };
  });

  return permissions as Record<PermissionType, Permission>;
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<'granted' | 'denied' | 'prompt'> {
  if (!('Notification' in window)) {
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission as 'granted' | 'denied';
  } catch (error) {
    console.error('Failed to request notification permission:', error);
    return 'denied';
  }
}

/**
 * Request location permission
 */
export async function requestLocationPermission(): Promise<'granted' | 'denied' | 'prompt'> {
  if (!('geolocation' in navigator)) {
    return 'denied';
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      () => resolve('granted'),
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          resolve('denied');
        } else {
          resolve('prompt');
        }
      },
      { timeout: 5000 }
    );
  });
}

/**
 * Request motion/activity permission (iOS 13+)
 */
export async function requestMotionPermission(): Promise<'granted' | 'denied' | 'prompt'> {
  // Check if DeviceMotionEvent.requestPermission exists (iOS 13+)
  if (
    typeof DeviceMotionEvent !== 'undefined' &&
    typeof (DeviceMotionEvent as any).requestPermission === 'function'
  ) {
    try {
      const permission = await (DeviceMotionEvent as any).requestPermission();
      return permission === 'granted' ? 'granted' : 'denied';
    } catch (error) {
      return 'denied';
    }
  }

  // For other devices, assume granted if DeviceMotionEvent exists
  return typeof DeviceMotionEvent !== 'undefined' ? 'granted' : 'denied';
}

/**
 * Check if onboarding is complete
 */
export function isOnboardingComplete(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(ONBOARDING_KEY) === 'true';
}

/**
 * Mark onboarding as complete
 */
export function completeOnboarding(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ONBOARDING_KEY, 'true');
}

/**
 * Reset onboarding (for testing)
 */
export function resetOnboarding(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ONBOARDING_KEY);
  localStorage.removeItem(PERMISSIONS_KEY);
}

/**
 * Get permission status display info
 */
export function getPermissionStatusInfo(status: Permission['status']) {
  switch (status) {
    case 'granted':
      return { label: 'Enabled', color: 'success', icon: 'CheckCircle2' };
    case 'denied':
      return { label: 'Blocked', color: 'destructive', icon: 'XCircle' };
    case 'prompt':
      return { label: 'Available', color: 'warning', icon: 'AlertCircle' };
    case 'not-requested':
      return { label: 'Not Set', color: 'muted', icon: 'Circle' };
  }
}
