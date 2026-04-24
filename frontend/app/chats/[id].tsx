import React from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChatHeader, ChatInput, MessageList, PersonalChatMenuSheet } from '../../src/components/chat';
import { useChat } from '../../src/hooks/useChat';
import { useTheme } from '../../src/hooks/useTheme';

export default function ChatRoomScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { id } = useLocalSearchParams();
  const roomId = typeof id === 'string' ? id : '1';
  const {
    meta,
    listData,
    draft,
    setDraft,
    sendMessage,
    sendImage,
    isLoading,
    isMenuVisible,
    openMenu,
    closeMenu,
    runMenuAction,
    isMuted,
    isBlocked,
  } = useChat(roomId);

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
      }),
    [colors],
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
        style={styles.container}
      >
        <ChatHeader
          avatarUri={meta.avatar}
          isOnline={meta.isOnline}
          onBack={() => router.back()}
          onPressMenu={openMenu}
          rideLabel={meta.rideTogetherLabel}
          showSpinner={isLoading}
          statusLabel={meta.isOnline ? 'Online' : 'Offline'}
          title={meta.name}
        />
        <MessageList messages={listData} />
        <ChatInput disabled={isBlocked} onChangeText={setDraft} onSend={sendMessage} onSendImage={sendImage} value={draft} />
      </KeyboardAvoidingView>

      <PersonalChatMenuSheet
        isBlocked={isBlocked}
        isMuted={isMuted}
        onClose={closeMenu}
        onSelectAction={runMenuAction}
        visible={isMenuVisible}
      />
    </SafeAreaView>
  );
}
