import React from 'react';
import {
  KeyboardTypeOptions,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

interface FormInputProps {
  label: string;
  required?: boolean;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  showPasswordToggle?: boolean;
  error?: string;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: TextInputProps['autoCapitalize'];
  multiline?: boolean;
  numberOfLines?: number;
}

const AnimatedView = Animated.createAnimatedComponent(View);

export function FormInput({
  label,
  required = false,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  showPasswordToggle = false,
  error,
  keyboardType,
  autoCapitalize = 'none',
  multiline = false,
  numberOfLines = 1,
}: FormInputProps) {
  const { colors, metrics, typography } = useTheme();
  const [focused, setFocused] = React.useState(false);
  const [masked, setMasked] = React.useState(secureTextEntry);
  const glow = useSharedValue(0);

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        container: {
          gap: metrics.xs,
        },
        label: {
          color: colors.textSecondary,
          fontSize: typography.sizes.sm,
          fontWeight: '500',
        },
        requiredMark: {
          color: colors.error,
          fontSize: typography.sizes.sm,
          fontWeight: '700',
        },
        inputWrap: {
          minHeight: 52,
          borderRadius: metrics.radius.lg,
          borderWidth: 1.2,
          borderColor: colors.border,
          backgroundColor: colors.card,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: metrics.md,
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 0 },
        },
        input: {
          flex: 1,
          color: colors.textPrimary,
          fontSize: typography.sizes.base,
          paddingVertical: metrics.md - 2,
        },
        multilineInput: {
          minHeight: 110,
          textAlignVertical: 'top',
        },
        toggleButton: {
          width: 36,
          height: 36,
          justifyContent: 'center',
          alignItems: 'center',
        },
        error: {
          color: colors.error,
          fontSize: typography.sizes.xs,
        },
      }),
    [colors, metrics, typography],
  );

  React.useEffect(() => {
    glow.value = withTiming(focused ? 1 : 0, { duration: 180 });
  }, [focused, glow]);

  const animatedStyle = useAnimatedStyle(() => ({
    borderColor:
      error != null && error.length > 0
        ? colors.error
        : focused
          ? colors.primary
          : colors.border,
    shadowOpacity: glow.value * 0.22,
    shadowRadius: 12,
  }));

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={styles.requiredMark}> *</Text> : null}
      </Text>
      <AnimatedView style={[styles.inputWrap, animatedStyle]}>
        <TextInput
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={numberOfLines}
          onBlur={() => setFocused(false)}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          secureTextEntry={masked}
          selectionColor={colors.primary}
          style={[styles.input, multiline && styles.multilineInput]}
          value={value}
        />
        {showPasswordToggle ? (
          <Pressable
            hitSlop={10}
            onPress={() => setMasked((previous) => !previous)}
            style={styles.toggleButton}
          >
            <Ionicons
              color={colors.textSecondary}
              name={masked ? 'eye-outline' : 'eye-off-outline'}
              size={20}
            />
          </Pressable>
        ) : null}
      </AnimatedView>
      {error != null && error.length > 0 ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}
