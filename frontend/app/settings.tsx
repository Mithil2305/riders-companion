import React from 'react';
import { useRouter } from 'expo-router';
import { SettingsDrawer } from '../src/components/settings';

export default function SettingsScreen() {
  const router = useRouter();

  return (
    <SettingsDrawer
      onClose={() => router.back()}
      onHelpPress={() => {}}
      onNotificationsPress={() => router.push('/notifications')}
      onPrivacyPress={() => {}}
      onProfilePress={() => router.push('/setup/profile')}
      onSignOutPress={() => {}}
    />
  );
}
