import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Image,
  Modal,
  PanResponder,
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
import { CommentModel, InteractionContentType } from '../../types/interactions';
import { useAuth } from '../../contexts/AuthContext';
import { CommentItem } from './CommentItem';

type CommentsSheetProps = {
  visible: boolean;
  contentId: string | null;
  onClose: () => void;
  currentUsername?: string;
  currentUserAvatarUrl?: string;
  contentType?: InteractionContentType;
  onCommentsCountChange?: (count: number) => void;
};

export function CommentsSheet({
  visible,
  contentId,
  onClose,
  currentUsername,
  currentUserAvatarUrl,
  contentType = 'feed',
  onCommentsCountChange,
}: CommentsSheetProps) {
  const DEFAULT_AVATAR = 'https://i.pravatar.cc/150?img=11';
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { colors, metrics, typography } = useTheme();
  const resolvedUsername = (currentUsername ?? user?.username ?? '').trim();
  const resolvedAvatarUrl = (currentUserAvatarUrl ?? user?.profileImageUrl ?? '').trim();
  const {
    comments,
    draft,
    setDraft,
    isLoading,
    isSubmitting,
    addComment,
    likeComment,
    editComment,
    deleteComment,
  } = useComments(contentId ?? "", {
    currentUsername: resolvedUsername,
    currentUserAvatarUrl: resolvedAvatarUrl,
    contentType,
    enabled: visible,
  });

  const [mounted, setMounted] = React.useState(visible);
  const translateY = React.useRef(new Animated.Value(520)).current;
  const backdropOpacity = React.useRef(new Animated.Value(0)).current;

  // Resizable sheet height
  const MIN_SHEET_HEIGHT = metrics.screenHeight * 0.3;
  const MAX_SHEET_HEIGHT = metrics.screenHeight;
  const DEFAULT_SHEET_HEIGHT = metrics.screenHeight * 0.78;
  const sheetHeightAnim = React.useRef(new Animated.Value(DEFAULT_SHEET_HEIGHT)).current;
  const dragStartHeightRef = React.useRef(DEFAULT_SHEET_HEIGHT);
  const currentSheetHeightRef = React.useRef(DEFAULT_SHEET_HEIGHT);
  const [activeComment, setActiveComment] = React.useState<CommentModel | null>(null);
  const [isActionMenuVisible, setIsActionMenuVisible] = React.useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = React.useState(false);
  const [editDraft, setEditDraft] = React.useState('');
  const [composerAvatarUri, setComposerAvatarUri] = React.useState(
    resolvedAvatarUrl || DEFAULT_AVATAR,
  );

  React.useEffect(() => {
    setComposerAvatarUri(resolvedAvatarUrl || DEFAULT_AVATAR);
  }, [resolvedAvatarUrl]);

  React.useEffect(() => {
    if (!visible) {
      setActiveComment(null);
      setIsActionMenuVisible(false);
      setIsEditModalVisible(false);
      setEditDraft('');
    }
  }, [visible]);

  React.useEffect(() => {
    if (!visible || isLoading) {
      return;
    }

    onCommentsCountChange?.(comments.length);
  }, [comments.length, isLoading, onCommentsCountChange, visible]);

  React.useEffect(() => {
    if (visible) {
      currentSheetHeightRef.current = DEFAULT_SHEET_HEIGHT;
      sheetHeightAnim.setValue(DEFAULT_SHEET_HEIGHT);
    }
  }, [DEFAULT_SHEET_HEIGHT, sheetHeightAnim, visible]);

  const handleCommentLongPress = React.useCallback((comment: CommentModel) => {
    setActiveComment(comment);
    setEditDraft(comment.content);
    setIsActionMenuVisible(true);
  }, []);

  const closeActionStates = React.useCallback(() => {
    setIsActionMenuVisible(false);
    setIsEditModalVisible(false);
    setActiveComment(null);
    setEditDraft('');
  }, []);

  const handleDeleteSelected = React.useCallback(() => {
    if (!activeComment) {
      return;
    }

    Alert.alert('Delete Comment', 'Are you sure you want to delete this comment?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await deleteComment(activeComment.id);
              closeActionStates();
            } catch (error) {
              Alert.alert(
                'Delete failed',
                error instanceof Error ? error.message : 'Unable to delete comment.',
              );
            }
          })();
        },
      },
    ]);
  }, [activeComment, closeActionStates, deleteComment]);

  const handleSaveEdit = React.useCallback(() => {
    if (!activeComment || editDraft.trim().length === 0) {
      return;
    }

    void (async () => {
      try {
        await editComment(activeComment.id, editDraft.trim());
        closeActionStates();
      } catch (error) {
        Alert.alert(
          'Update failed',
          error instanceof Error ? error.message : 'Unable to update comment.',
        );
      }
    })();
  }, [activeComment, closeActionStates, editComment, editDraft]);

  const handleAddComment = React.useCallback(() => {
    void (async () => {
      try {
        await addComment();
      } catch (error) {
        Alert.alert(
          'Comment failed',
          error instanceof Error ? error.message : 'Unable to add comment.',
        );
      }
    })();
  }, [addComment]);

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 2;
      },
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (_, gestureState) => {
        dragStartHeightRef.current = currentSheetHeightRef.current;
      },
      onPanResponderMove: (_, gestureState) => {
        const newHeight = Math.max(
          MIN_SHEET_HEIGHT,
          Math.min(MAX_SHEET_HEIGHT, dragStartHeightRef.current - gestureState.dy),
        );
        currentSheetHeightRef.current = newHeight;
        sheetHeightAnim.setValue(newHeight);
      },
      onPanResponderRelease: (_, gestureState) => {
        const newHeight = Math.max(
          MIN_SHEET_HEIGHT,
          Math.min(MAX_SHEET_HEIGHT, dragStartHeightRef.current - gestureState.dy),
        );
        currentSheetHeightRef.current = newHeight;
        Animated.spring(sheetHeightAnim, {
          toValue: newHeight,
          damping: 20,
          stiffness: 200,
          mass: 0.6,
          useNativeDriver: false,
        }).start();
      },
      onPanResponderTerminate: () => {
        Animated.spring(sheetHeightAnim, {
          toValue: currentSheetHeightRef.current,
          damping: 20,
          stiffness: 200,
          mass: 0.6,
          useNativeDriver: false,
        }).start();
      },
    })
  ).current;

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
          overflow: 'hidden',
          maxHeight: metrics.screenHeight,
        },
        dragHandleContainer: {
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: metrics.md,
          minHeight: 44,
          backgroundColor: colors.surface,
        },
        dragHandle: {
          width: 48,
          height: 5,
          borderRadius: 3,
          backgroundColor: colors.border,
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: metrics.md,
          paddingBottom: metrics.sm,
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
        actionsOverlay: {
          flex: 1,
          backgroundColor: colors.overlay,
          justifyContent: 'flex-end',
        },
        actionSheet: {
          backgroundColor: colors.surface,
          borderTopLeftRadius: metrics.radius.xl,
          borderTopRightRadius: metrics.radius.xl,
          paddingBottom: Math.max(insets.bottom, metrics.md),
          overflow: 'hidden',
        },
        actionItem: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: metrics.sm,
          paddingHorizontal: metrics.lg,
          paddingVertical: metrics.md,
          borderBottomColor: colors.border,
          borderBottomWidth: 1,
        },
        actionItemLast: {
          borderBottomWidth: 0,
        },
        actionText: {
          color: colors.textPrimary,
          fontSize: typography.sizes.base,
          fontWeight: '600',
        },
        actionDeleteText: {
          color: '#ef4444',
        },
        editOverlay: {
          flex: 1,
          backgroundColor: colors.overlay,
          justifyContent: 'center',
          paddingHorizontal: metrics.md,
        },
        editCard: {
          backgroundColor: colors.surface,
          borderRadius: metrics.radius.lg,
          padding: metrics.md,
          gap: metrics.sm,
        },
        editTitle: {
          color: colors.textPrimary,
          fontSize: typography.sizes.lg,
          fontWeight: '700',
        },
        editInput: {
          minHeight: 108,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: metrics.radius.md,
          color: colors.textPrimary,
          fontSize: typography.sizes.base,
          paddingHorizontal: metrics.md,
          paddingVertical: metrics.sm,
          textAlignVertical: 'top',
        },
        editActions: {
          flexDirection: 'row',
          justifyContent: 'flex-end',
          gap: metrics.sm,
        },
        editActionBtn: {
          paddingHorizontal: metrics.md,
          paddingVertical: metrics.sm,
          borderRadius: metrics.radius.md,
        },
        editActionCancel: {
          backgroundColor: colors.chatComposerBg,
        },
        editActionSave: {
          backgroundColor: colors.primary,
        },
        editActionText: {
          color: colors.textPrimary,
          fontWeight: '600',
          fontSize: typography.sizes.sm,
        },
        editActionSaveText: {
          color: colors.surface,
        },
      }),
    [colors, insets.bottom, metrics, typography],
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

        <Animated.View style={{ transform: [{ translateY }] }}>
          <Animated.View style={[styles.sheet, { height: sheetHeightAnim }]}>
            {/* Drag Handle */}
            <View style={styles.dragHandleContainer} {...panResponder.panHandlers}>
              <View style={styles.dragHandle} />
            </View>

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
                renderItem={({ item }) => {
                  const normalize = (value?: string) => (value || '').trim().replace(/^@/, '').toLowerCase();
                  const isOwnerByName = normalize(resolvedUsername) === normalize(item.author.username);
                  const isOwnerById = Boolean(user?.id && item.author?.id && user.id === item.author.id);
                  const isOwner = isOwnerByName || isOwnerById;
                  const isSelected = activeComment?.id === item.id;
                  const isDimmed = Boolean(activeComment && !isSelected);

                  return (
                    <CommentItem
                      key={item.id}
                      comment={item}
                      isOwner={isOwner}
                      isSelected={isSelected}
                      isDimmed={isDimmed}
                      onLike={likeComment}
                      onReply={() => {
                        setDraft(`@${item?.author?.username || 'Unknown-User'} `);
                      }}
                      onLongPress={handleCommentLongPress}
                    />
                  );
                }}
                style={styles.list}
                windowSize={8}
                ListEmptyComponent={<Text style={styles.emptyText}>No comments yet.</Text>}
              />
            )}

            <View style={[styles.composerWrap, { paddingBottom: Math.max(insets.bottom, metrics.sm) }]}>
              <View style={styles.composerRow}>
                <Image
                  onError={() => setComposerAvatarUri(DEFAULT_AVATAR)}
                  source={{ uri: composerAvatarUri }}
                  style={styles.composerAvatar}
                />
                <TextInput
                  onChangeText={setDraft}
                  placeholder="Add a comment..."
                  placeholderTextColor={colors.textSecondary}
                  style={styles.input}
                  value={draft}
                />
                <Pressable disabled={!canSend} onPress={handleAddComment} style={styles.sendButton}>
                  <Ionicons
                    color={canSend ? colors.primary : colors.textTertiary}
                    name="paper-plane"
                    size={metrics.icon.md}
                  />
                </Pressable>
              </View>
            </View>
          </Animated.View>
        </Animated.View>

        <Modal animationType="fade" transparent visible={isActionMenuVisible}>
          <View style={styles.actionsOverlay}>
            <Pressable onPress={closeActionStates} style={StyleSheet.absoluteFillObject} />
            <View style={styles.actionSheet}>
              <Pressable
                onPress={() => {
                  setIsActionMenuVisible(false);
                  setIsEditModalVisible(true);
                }}
                style={styles.actionItem}
              >
                <Ionicons color={colors.textPrimary} name="create-outline" size={metrics.icon.md} />
                <Text style={styles.actionText}>Edit</Text>
              </Pressable>
              <Pressable onPress={handleDeleteSelected} style={[styles.actionItem, styles.actionItemLast]}>
                <Ionicons color="#ef4444" name="trash-outline" size={metrics.icon.md} />
                <Text style={[styles.actionText, styles.actionDeleteText]}>Delete</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        <Modal animationType="fade" transparent visible={isEditModalVisible}>
          <View style={styles.editOverlay}>
            <Pressable onPress={closeActionStates} style={StyleSheet.absoluteFillObject} />
            <View style={styles.editCard}>
              <Text style={styles.editTitle}>Edit Comment</Text>
              <TextInput
                autoFocus
                multiline
                onChangeText={setEditDraft}
                placeholder="Edit your comment..."
                placeholderTextColor={colors.textSecondary}
                style={styles.editInput}
                value={editDraft}
              />
              <View style={styles.editActions}>
                <Pressable onPress={closeActionStates} style={[styles.editActionBtn, styles.editActionCancel]}>
                  <Text style={styles.editActionText}>Cancel</Text>
                </Pressable>
                <Pressable
                  disabled={editDraft.trim().length === 0}
                  onPress={handleSaveEdit}
                  style={[styles.editActionBtn, styles.editActionSave]}
                >
                  <Text style={[styles.editActionText, styles.editActionSaveText]}>Save</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
}
