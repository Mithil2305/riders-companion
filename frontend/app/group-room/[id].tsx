import React from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../src/hooks/useTheme';
import { useGroupChatScreen, INVITE_FRIENDS } from '../../src/hooks/useGroupChatScreen';
import {
  GroupChatHeader,
  GroupChatInputBar,
  GroupChatList,
  GroupChatMenuSheet,
  InviteFriendsModal,
  LiveLocationBanner,
  LiveMapSection,
} from '../../src/components/chat/group';

export default function GroupChatScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const {
    menuVisible,
    inviteVisible,
    locationEnabled,
    isAdmin,
    draft,
    messages,
    setDraft,
    setLocationEnabled,
    openMenu,
    closeMenu,
    closeInvite,
    inviteFromMenu,
    sendMessage,
  } = useGroupChatScreen();

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.chatSearchBg,
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
        <GroupChatHeader
          onBack={() => router.back()}
          onOpenMenu={openMenu}
          subtitle="Chennai → Ooty"
          title="Chennai Riders"
        />

        <LiveLocationBanner enabled={locationEnabled} onToggle={setLocationEnabled} />

        {locationEnabled ? <LiveMapSection /> : null}

        <GroupChatList data={messages} />

        <GroupChatInputBar onChange={setDraft} onSend={sendMessage} value={draft} />
      </KeyboardAvoidingView>

      <GroupChatMenuSheet
        isAdmin={isAdmin}
        onClose={closeMenu}
        onInvite={inviteFromMenu}
        visible={menuVisible}
      />

      <InviteFriendsModal friends={INVITE_FRIENDS} onClose={closeInvite} visible={inviteVisible} />
    </SafeAreaView>
  );
}
