import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';

export interface SettingsToggle {
  id: 'locationVisibility';
  title: string;
  subtitle: string;
  value: boolean;
}

export interface SettingsActionItem {
  id: string;
  title: string;
  subtitle: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  danger?: boolean;
}
