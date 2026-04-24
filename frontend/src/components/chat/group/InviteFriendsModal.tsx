import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../hooks/useTheme';
import { withAlpha } from '../../../utils/color';

interface InviteFriendsModalProps {
  visible: boolean;
  friends: string[];
  onClose: () => void;
}

export function InviteFriendsModal({ visible, friends, onClose }: InviteFriendsModalProps) {
  const { colors, metrics, typography } = useTheme();

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          flex: 1,
          backgroundColor: withAlpha(colors.shadow, 0.34),
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: metrics.lg,
        },
        card: {
          width: '100%',
          borderRadius: 22,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          padding: metrics.md,
          shadowColor: colors.shadow,
          shadowOpacity: 0.16,
          shadowOffset: { width: 0, height: 6 },
          shadowRadius: 12,
          elevation: 8,
        },
        title: {
          color: colors.textPrimary,
          fontSize: typography.sizes.xl,
          fontWeight: '700',
          marginBottom: metrics.sm,
        },
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: metrics.sm,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        rowText: {
          color: colors.textPrimary,
          fontSize: typography.sizes.base,
          fontWeight: '500',
        },
        closeBtn: {
          marginTop: metrics.md,
          alignSelf: 'flex-end',
          borderRadius: 20,
          paddingHorizontal: metrics.md,
          paddingVertical: metrics.sm,
          backgroundColor: colors.primary,
        },
        closeText: {
          color: colors.textInverse,
          fontWeight: '600',
          fontSize: typography.sizes.base,
        },
      }),
    [colors, metrics, typography],
  );

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <Pressable onPress={onClose} style={styles.overlay}>
        <Pressable onPress={() => {}} style={styles.card}>
          <Text style={styles.title}>Invite Friends</Text>
          {friends.map((friend) => (
            <View key={friend} style={styles.row}>
              <Text style={styles.rowText}>{friend}</Text>
              <Ionicons color={colors.primary} name="share-social" size={20} />
            </View>
          ))}
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>Close</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
