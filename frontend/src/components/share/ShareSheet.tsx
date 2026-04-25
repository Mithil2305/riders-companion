import React from 'react';
import {
  ActivityIndicator,
  Animated,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { useShare } from '../../hooks/useShare';
import { ShareActionModel, ShareTargetType, ShareUser } from '../../types/interactions';
import { ShareUserItem } from './ShareUserItem';

type ShareSheetProps = {
  visible: boolean;
  postId: string | null;
  onClose: () => void;
  postUrl?: string;
  resourceType?: 'post' | 'clip';
  onShared?: () => void;
  users?: ShareUser[];
};

export function ShareSheet({
  visible,
  postId,
  onClose,
  postUrl,
  resourceType = 'post',
  onShared,
  users: usersProp,
}: ShareSheetProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, metrics, typography } = useTheme();
  const {
    query,
    setQuery,
    users,
    isLoading,
    isSharing,
    getShareUsers,
    shareToUser,
    shareToAction,
    copyLink,
  } = useShare(postId ?? '', postUrl);

  const [mounted, setMounted] = React.useState(visible);
  const translateY = React.useRef(new Animated.Value(540)).current;
  const backdropOpacity = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          speed: 22,
          bounciness: 4,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 540,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setMounted(false);
      }
    });
  }, [backdropOpacity, translateY, visible]);

  const actionItems = React.useMemo<(ShareActionModel & {
    icon: keyof typeof Ionicons.glyphMap;
    backgroundColor: string;
    iconColor: string;
  })[]>(
    () => [
      {
        id: 'story',
        label: `Add ${resourceType === 'clip' ? 'clip' : 'post'} to your story`,
        iconName: 'add',
        icon: 'add',
        backgroundColor: colors.primary,
        iconColor: colors.textInverse,
      },
      {
        id: 'message',
        label: 'Send as message',
        iconName: 'chatbubble-outline',
        icon: 'chatbubble-outline',
        backgroundColor: '#0EA5E9',
        iconColor: '#FFFFFF',
      },
      {
        id: 'link',
        label: 'Copy link',
        iconName: 'link-outline',
        icon: 'link-outline',
        backgroundColor: '#6B7280',
        iconColor: '#FFFFFF',
      },
      {
        id: 'facebook',
        label: 'Share to Facebook',
        iconName: 'logo-facebook',
        icon: 'logo-facebook',
        backgroundColor: '#1877F2',
        iconColor: '#FFFFFF',
      },
      {
        id: 'twitter',
        label: 'Share to X',
        iconName: 'logo-x',
        icon: 'logo-x',
        backgroundColor: '#000000',
        iconColor: '#FFFFFF',
      },
      {
        id: 'whatsapp',
        label: 'Share to WhatsApp',
        iconName: 'logo-whatsapp',
        icon: 'logo-whatsapp',
        backgroundColor: '#25D366',
        iconColor: '#FFFFFF',
      },
    ],
    [colors.primary, colors.textInverse, resourceType],
  );

  const displayUsers = usersProp ?? users;

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          flex: 1,
          justifyContent: 'flex-end',
        },
        backdrop: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: colors.overlay,
        },
        sheet: {
          backgroundColor: colors.surface,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          minHeight: metrics.screenHeight * 0.8,
          maxHeight: metrics.screenHeight * 0.92,
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: metrics.md,
          paddingVertical: metrics.md,
          
        },
        title: {
          color: colors.textPrimary,
          fontSize: typography.sizes['lg'],
          fontWeight: '700',
        },
        separator: {
          height: 1,
          backgroundColor: colors.border,
        },
        body: {
          paddingHorizontal: metrics.md,
          paddingTop: metrics.md,
          paddingBottom: metrics.lg,
        },
        searchWrap: {
          height: 42,
          borderRadius: 26,
          backgroundColor: colors.chatComposerBg,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: metrics.md,
          marginBottom: metrics.md,
          borderColor: colors.border,
          borderWidth: 1,
        },
        searchInput: {
          flex: 1,
          color: colors.textPrimary,
          fontSize: typography.sizes['base'],
          marginLeft: metrics.sm,
          
        },
        usersWrap: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          marginBottom: metrics.sm,
        },
        actionsWrap: {
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingTop: metrics.md,
          flexDirection: 'row',
          flexWrap: 'wrap',
        },
        actionItem: {
          width: '25%',
          alignItems: 'center',
          marginBottom: metrics.md,
          paddingHorizontal: metrics.xs,
        },
        actionCircle: {
          width: 44,
          height: 44,
          borderRadius: metrics.radius.full,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: metrics.sm,
        },
        actionText: {
          color: colors.textPrimary,
          textAlign: 'center',
          fontSize: typography.sizes['sm'],
          fontWeight: '500',
        },
        loading: {
          paddingVertical: metrics.lg,
        },
      }),
    [colors, metrics, typography],
  );

  const handleActionPress = React.useCallback(
    async (id: ShareTargetType) => {
      if (!postId) {
        return;
      }

      if (id === 'link') {
        await copyLink();
        onShared?.();
        return;
      }

      await shareToAction(id);
      onShared?.();
    },
    [copyLink, onShared, postId, shareToAction],
  );

  const handleShareToUser = React.useCallback(
    async (user: ShareUser) => {
      if (!postId) {
        Alert.alert('Unavailable', 'Select a valid post or clip to share.');
        return;
      }

      await shareToUser(user.id, user.username);
      onShared?.();
      onClose();
      router.push({
        pathname: '/chats',
        params: {
          riderId: user.id,
          name: user.name,
          avatar: user.avatarUrl,
          username: user.username,
        },
      });
    },
    [onClose, onShared, postId, router, shareToUser],
  );

  if (!mounted) {
    return null;
  }

  return (
    <Modal onRequestClose={onClose} transparent visible={mounted}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <Pressable onPress={onClose} style={StyleSheet.absoluteFillObject} />
        </Animated.View>

        <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
          <View style={styles.header}>
            <Text style={styles.title}>Share</Text>
            <Pressable onPress={onClose}>
              <Ionicons color={colors.textPrimary} name="close" size={metrics.icon.lg} />
            </Pressable>
          </View>

          <View style={styles.separator} />

          <ScrollView contentContainerStyle={[styles.body, { paddingBottom: Math.max(insets.bottom, metrics.md) }]}>
            <View style={styles.searchWrap}>
              <Ionicons color={colors.textSecondary} name="search" size={metrics.icon.md} />
              <TextInput
                onChangeText={(nextValue) => {
                  setQuery(nextValue);
                  void getShareUsers(nextValue);
                }}
                placeholder="Search"
                placeholderTextColor={colors.textSecondary}
                style={styles.searchInput}
                value={query}
              />
            </View>

            {isLoading && !usersProp ? (
              <View style={styles.loading}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : (
              <View style={styles.usersWrap}>
                {displayUsers.map((user) => (
                  <ShareUserItem key={user.id} onPress={() => void handleShareToUser(user)} user={user} />
                ))}
              </View>
            )}

            <View style={styles.actionsWrap}>
              {actionItems.map((item) => (
                <Pressable
                  disabled={isSharing}
                  key={item.id}
                  onPress={() => void handleActionPress(item.id)}
                  style={styles.actionItem}
                >
                  <View style={[styles.actionCircle, { backgroundColor: item.backgroundColor }]}>
                    <Ionicons
                      color={item.iconColor}
                      name={item.icon}
                      size={metrics.icon.lg}
                    />
                  </View>
                  <Text style={styles.actionText}>{item.label}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}
