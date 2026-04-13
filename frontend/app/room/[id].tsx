import React from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChatHeader, ChatInput, MessageList } from '../../src/components/chat';
import { useChatConversation } from '../../src/hooks/useChatConversation';
import { useTheme } from '../../src/hooks/useTheme';

export default function RoomScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { id } = useLocalSearchParams();
  const roomId = typeof id === 'string' ? id : '1';
  const { chatName, messages, draft, setDraft, sendMessage, showTyping } = useChatConversation(roomId);

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
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
        style={styles.container}
      >
        <ChatHeader onBack={() => router.back()} rightMode="chat" title={chatName} />
        <MessageList messages={messages} showTyping={showTyping} />
        <ChatInput onChangeText={setDraft} onSend={sendMessage} value={draft} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
