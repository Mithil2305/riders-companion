import * as ImagePicker from 'expo-image-picker';
import React from 'react';
import {
  Image,
  ImageStyle,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface AvatarPickerProps {
  value: string;
  onChange: (uri: string) => void;
}

const avatarImageStyle: ImageStyle = {
  width: '100%',
  height: '100%',
};

export function AvatarPicker({ value, onChange }: AvatarPickerProps) {
  const { colors, metrics, typography } = useTheme();
  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        container: {
          alignItems: 'center',
          gap: metrics.sm,
        },
        avatarWrap: {
          width: 132,
          height: 132,
          borderRadius: metrics.radius.full,
          borderWidth: 1.6,
          borderStyle: 'dashed',
          borderColor: colors.border,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.surface,
          overflow: 'hidden',
        },
        avatarPlaceholder: {
          color: colors.textSecondary,
          fontSize: typography.sizes.sm,
          fontWeight: '500',
        },
        helperText: {
          color: colors.textTertiary,
          fontSize: typography.sizes.xs,
        },
      }),
    [colors, metrics, typography],
  );
  const handlePick = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled && result.assets.length > 0) {
      onChange(result.assets[0].uri);
    }
  };

  return (
    <Pressable onPress={handlePick} style={styles.container}>
      <View style={styles.avatarWrap}>
        {value.length > 0 ? (
          <Image source={{ uri: value }} style={avatarImageStyle} />
        ) : (
          <Text style={styles.avatarPlaceholder}>Add Photo</Text>
        )}
      </View>
      <Text style={styles.helperText}>Tap to upload profile photo (mock)</Text>
    </Pressable>
  );
}
