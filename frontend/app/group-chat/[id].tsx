import React from "react";
import { KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../src/hooks/useTheme";
import {
  useGroupChatScreen,
  INVITE_FRIENDS,
} from "../../src/hooks/useGroupChatScreen";
import {
  GroupChatHeader,
  GroupChatInputBar,
  GroupChatList,
  GroupChatClosedState,
  GroupChatMenuSheet,
  InviteFriendsModal,
  LiveLocationBanner,
  LiveMapSection,
} from "../../src/components/chat/group";

export default function GroupChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useTheme();
  const roomId = typeof params.id === "string" ? params.id : "1";
  const roomStatus =
    typeof params.status === "string" ? params.status : undefined;
  const {
    menuVisible,
    inviteVisible,
    locationEnabled,
    isRideEnded,
    isAdmin,
    draft,
    messages,
    setDraft,
    setLocationEnabled,
    openMenu,
    closeMenu,
    closeInvite,
    inviteFromMenu,
    endRide,
    sendMessage,
  } = useGroupChatScreen(roomId, roomStatus);

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
    <SafeAreaView edges={["top", "left", "right"]} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
        style={styles.container}
      >
        <GroupChatHeader
          onBack={() => router.back()}
          onOpenMenu={openMenu}
          rideStatus={isRideEnded ? "ended" : "active"}
          subtitle="Chennai → Ooty"
          title="Chennai Riders"
        />

        {!isRideEnded ? (
          <LiveLocationBanner
            enabled={locationEnabled}
            onToggle={setLocationEnabled}
          />
        ) : null}

        {!isRideEnded && locationEnabled ? <LiveMapSection /> : null}

        <GroupChatList data={messages} />

        {isRideEnded ? (
          <GroupChatClosedState />
        ) : (
          <GroupChatInputBar
            onChange={setDraft}
            onSend={sendMessage}
            value={draft}
          />
        )}
      </KeyboardAvoidingView>

      <GroupChatMenuSheet
        isAdmin={isAdmin}
        isRideEnded={isRideEnded}
        onClose={closeMenu}
        onEndRide={endRide}
        onInvite={inviteFromMenu}
        visible={menuVisible}
      />

      <InviteFriendsModal
        friends={INVITE_FRIENDS}
        onClose={closeInvite}
        visible={inviteVisible}
      />
    </SafeAreaView>
  );
}
