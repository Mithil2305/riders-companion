import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Checkbox, FormInput, PrimaryButton, ThemeToggleButton } from '../../src/components/common';
import { useTheme } from '../../src/hooks/useTheme';

export default function SignupScreen() {
  const { colors, metrics, typography } = useTheme();
  const router = useRouter();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [agree, setAgree] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [errors, setErrors] = React.useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
    terms?: string;
  }>({});

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        keyboardContainer: {
          flex: 1,
          backgroundColor: colors.background,
        },
        topRightToggle: {
          position: 'absolute',
          right: metrics.lg,
          top: metrics.lg,
          zIndex: 10,
        },
        scrollContent: {
          flexGrow: 1,
          padding: metrics.lg,
          justifyContent: 'center',
        },
        container: {
          gap: metrics.lg,
        },
        toggleRow: {
          borderRadius: metrics.radius.full,
          padding: metrics.xs,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.borderDark,
          flexDirection: 'row',
          gap: metrics.xs,
        },
        togglePill: {
          minHeight: 48,
          borderRadius: metrics.radius.full,
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
        },
        activeToggle: {
          backgroundColor: colors.primary,
        },
        toggleText: {
          color: colors.textSecondary,
          fontSize: typography.sizes.base,
          fontWeight: '600',
        },
        toggleTextActive: {
          color: colors.textInverse,
        },
        title: {
          color: colors.textPrimary,
          fontSize: typography.sizes['3xl'],
          fontWeight: '700',
        },
        subtitle: {
          color: colors.textSecondary,
          fontSize: typography.sizes.base,
        },
        formWrap: {
          gap: metrics.md,
          backgroundColor: colors.surface,
          borderRadius: metrics.radius.xl,
          borderWidth: 1,
          borderColor: colors.borderDark,
          padding: metrics.md,
        },
        errorText: {
          color: colors.error,
          fontSize: typography.sizes.xs,
        },
      }),
    [colors, metrics, typography],
  );

  const submit = () => {
    const nextErrors: {
      email?: string;
      password?: string;
      confirmPassword?: string;
      terms?: string;
    } = {};

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = 'Enter a valid email';
    }
    if (password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters';
    }
    if (confirmPassword !== password) {
      nextErrors.confirmPassword = 'Passwords do not match';
    }
    if (!agree) {
      nextErrors.terms = 'You must agree to continue';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.replace('/setup/profile');
    }, 900);
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.keyboardContainer}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}
      >
        <View style={styles.topRightToggle}>
          <ThemeToggleButton />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Animated.View entering={FadeInRight.duration(340)} style={styles.container}>
          <View style={styles.toggleRow}>
            <TouchableOpacity
              onPress={() => router.replace('/auth/login')}
              style={styles.togglePill}
            >
              <Text style={styles.toggleText}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.togglePill, styles.activeToggle]}>
              <Text style={[styles.toggleText, styles.toggleTextActive]}>Signup</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join riders and start your first setup.</Text>

          <View style={styles.formWrap}>
            <FormInput
              error={errors.email}
              keyboardType="email-address"
              label="Email"
              onChangeText={setEmail}
              placeholder="name@example.com"
              value={email}
            />
            <FormInput
              error={errors.password}
              label="Password"
              onChangeText={setPassword}
              placeholder="Create your password"
              secureTextEntry
              showPasswordToggle
              value={password}
            />
            <FormInput
              error={errors.confirmPassword}
              label="Confirm Password"
              onChangeText={setConfirmPassword}
              placeholder="Confirm your password"
              secureTextEntry
              showPasswordToggle
              value={confirmPassword}
            />

            <Checkbox
              checked={agree}
              label="Agree to Terms & Conditions"
              onToggle={() => setAgree((previous) => !previous)}
            />
            {errors.terms != null ? <Text style={styles.errorText}>{errors.terms}</Text> : null}

            <PrimaryButton loading={loading} onPress={submit} title="Create Account" />
          </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
