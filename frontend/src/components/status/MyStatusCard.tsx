import React from 'react';
import { StatusEntry } from '../../types/status';
import { StatusItem } from './StatusItem';

interface MyStatusCardProps {
  item: StatusEntry;
  onPress: () => void;
  onPressAdd: () => void;
  onLongPress?: () => void;
}

export function MyStatusCard({ item, onPress, onPressAdd, onLongPress }: MyStatusCardProps) {
  return (
    <StatusItem
      avatar={item.avatar}
      name={item.name}
      onLongPress={onLongPress}
      onPress={onPress}
      onPressAdd={onPressAdd}
      ringType={item.ringType}
      showAddBadge
      time={item.time}
    />
  );
}
