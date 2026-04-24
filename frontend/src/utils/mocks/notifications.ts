import { AppNotification } from '../../types/notifications';

export const mockNotifications: AppNotification[] = [
  {
    id: '1',
    type: 'ALERT',
    title: 'Out of Zone!',
    message: 'You left the safe route',
    time: '2m ago',
    read: false,
  },
  {
    id: '2',
    type: 'SOCIAL',
    title: 'Alex liked your ride',
    message: 'Your mountain ride got a new like',
    time: '12m ago',
    read: false,
  },
  {
    id: '3',
    type: 'SYSTEM',
    title: 'Maintenance reminder',
    message: 'Time to check tire pressure this week',
    time: '1h ago',
    read: true,
  },
];
