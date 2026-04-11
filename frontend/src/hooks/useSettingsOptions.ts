import React from 'react';
import { SettingsActionItem, SettingsToggle } from '../types/settings';

interface UseSettingsOptionsResult {
  locationVisibility: SettingsToggle;
  accountItems: SettingsActionItem[];
  privacyItems: SettingsActionItem[];
  securityItems: SettingsActionItem[];
  actionItems: SettingsActionItem[];
  toggleLocationVisibility: () => void;
}

const accountItems: SettingsActionItem[] = [
  {
    id: 'editProfile',
    title: 'Edit Profile',
    subtitle: 'Manage your account details',
    icon: 'person-outline',
  },
  {
    id: 'notificationPrefs',
    title: 'Notifications',
    subtitle: 'Configure alerts',
    icon: 'notifications-outline',
  },
];

const privacyItems: SettingsActionItem[] = [
  {
    id: 'locationVisibility',
    title: 'Location Visibility',
    subtitle: 'Control who can view your live location',
    icon: 'location-outline',
  },
];

const securityItems: SettingsActionItem[] = [
  {
    id: 'changePassword',
    title: 'Change Password',
    subtitle: 'Update your account password',
    icon: 'lock-closed-outline',
  },
];

const actionItems: SettingsActionItem[] = [
  {
    id: 'logout',
    title: 'Logout',
    subtitle: 'Sign out from this device',
    icon: 'log-out-outline',
    danger: true,
  },
  {
    id: 'deleteAccount',
    title: 'Delete Account',
    subtitle: 'This action cannot be undone',
    icon: 'trash-outline',
    danger: true,
  },
];

export function useSettingsOptions(): UseSettingsOptionsResult {
  const [locationVisibility, setLocationVisibility] = React.useState<SettingsToggle>({
    id: 'locationVisibility',
    title: 'Location Visibility',
    subtitle: 'Allow followers to see your live route',
    value: true,
  });

  const toggleLocationVisibility = React.useCallback(() => {
    setLocationVisibility((prev) => ({
      ...prev,
      value: !prev.value,
    }));
  }, []);

  return {
    locationVisibility,
    accountItems,
    privacyItems,
    securityItems,
    actionItems,
    toggleLocationVisibility,
  };
}
