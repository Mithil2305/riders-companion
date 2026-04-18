import React from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { useComments } from '../../hooks/useComments';
import { CommentItem } from './CommentItem';

type CommentsSheetProps = {
  visible: boolean;
  postId: string;
  onClose: () => void;
  currentUsername?: string;
  currentUserAvatarUrl?: string;
};

export function CommentsSheet({
  visible,
  postId,
  onClose,
  currentUsername,
  currentUserAvatarUrl,
}: CommentsSheetProps) {
  const insets = useSafeAreaInsets();
  const { colors, metrics, typography } = useTheme();
  const {
    comments,
    draft,
    setDraft,
    isLoading,
    isSubmitting,
    addComment,
    likeComment,
  } = useComments(postId, { currentUsername, currentUserAvatarUrl });

  const [mounted, setMounted] = React.useState(visible);
  const translateY = React.useRef(new Animated.Value(520)).current;
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
        toValue: 520,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setMounted(false);
      }
    });
  }, [backdropOpacity, translateY, visible]);

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
          minHeight: metrics.screenHeight * 0.78,
          maxHeight: metrics.screenHeight * 0.9,
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
        list: {
          flex: 1,
        },
        listContent: {
          paddingBottom: 96,
        },
        composerWrap: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: colors.surface,
          paddingHorizontal: metrics.md,
          paddingTop: metrics.sm,
        },
        composerRow: {
          flexDirection: 'row',
          alignItems: 'center',
        },
        composerAvatar: {
          width: 40,
          height: 40,
          borderRadius: metrics.radius.full,
          marginRight: metrics.sm,
          backgroundColor: colors.chatComposerBg,
        },
        input: {
          flex: 1,
          height: 48,
          borderRadius: 24,
          backgroundColor: colors.chatComposerBg,
          borderColor: colors.border,
          borderWidth: 1,
          color: colors.textPrimary,
          paddingHorizontal: metrics.md,
          fontSize: typography.sizes['base'],
        },
        sendButton: {
          width: 44,
          height: 44,
          borderRadius: metrics.radius.full,
          marginLeft: metrics.sm,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.chatComposerBg,
        },
        loading: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        },
        emptyText: {
          textAlign: 'center',
          color: colors.textSecondary,
          fontSize: typography.sizes.base,
          marginTop: metrics.xl,
        },
      }),
    [colors, metrics, typography],
  );

  const canSend = draft.trim().length > 0 && !isSubmitting;

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
            <Text style={styles.title}>Comments</Text>
            <Pressable onPress={onClose}>
              <Ionicons color={colors.textPrimary} name="close" size={metrics.icon.md + 2} />
            </Pressable>
          </View>

          {isLoading ? (
            <View style={styles.loading}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : (
            <FlatList
              contentContainerStyle={styles.listContent}
              data={comments}
              initialNumToRender={10}
              keyExtractor={(item) => item.id}
              maxToRenderPerBatch={10}
              removeClippedSubviews
              renderItem={({ item }) => (
                <CommentItem
                  key={item.id}
                  comment={item}
                  onLike={likeComment}
                  onReply={() => {
                    setDraft(`@${item?.author?.username || 'Unknown-User'} `);
                  }}
                />
              )}
              style={styles.list}
              windowSize={8}
              ListEmptyComponent={<Text style={styles.emptyText}>No comments yet.</Text>}
            />
          )}

          <View style={[styles.composerWrap, { paddingBottom: Math.max(insets.bottom, metrics.sm) }]}>
            <View style={styles.composerRow}>
              <View >
                  <Image
                    source={{ uri: "https://i.pravatar.cc/150?img=11" }}
                    style={styles.composerAvatar} 
                  />
              </View>
              <TextInput
                onChangeText={setDraft}
                placeholder="Add a comment..."
                placeholderTextColor={colors.textSecondary}
                style={styles.input}
                value={draft}
              />
              <Pressable disabled={!canSend} onPress={() => void addComment()} style={styles.sendButton}>
                <Ionicons
                  color={canSend ? colors.primary : colors.textTertiary}
                  name="paper-plane"
                  size={metrics.icon.md}
                />
              </Pressable>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
