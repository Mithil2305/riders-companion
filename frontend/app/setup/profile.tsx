import React from 'react';
import {
  KeyboardAvoidingView,
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AvatarPicker, BikeCard, type Bike } from '../../src/components/profile';
import { FormInput, PrimaryButton, ThemeToggleButton } from '../../src/components/common';
import { useTheme } from '../../src/hooks/useTheme';

interface UserProfile {
  name: string;
  bio: string;
  avatar: string;
}

interface BikeForm {
  brand: string;
  model: string;
  year: string;
  image: string;
}

const initialUser: UserProfile = {
  name: '',
  bio: '',
  avatar: '',
};

const initialBikes: Bike[] = [
  {
    id: '1',
    brand: 'Yamaha',
    model: 'R15',
    year: '2022',
    image: 'placeholder',
  },
];

const emptyBikeForm: BikeForm = {
  brand: '',
  model: '',
  year: '',
  image: '',
};

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function ProfileSetupScreen() {
  const { colors, metrics, typography } = useTheme();
  const router = useRouter();
  const [user, setUser] = React.useState<UserProfile>(initialUser);
  const [bikes, setBikes] = React.useState<Bike[]>(initialBikes);
  const [bikeForm, setBikeForm] = React.useState<BikeForm>(emptyBikeForm);
  const [submitting, setSubmitting] = React.useState(false);

  const [userErrors, setUserErrors] = React.useState<{ name?: string }>({});
  const [bikeErrors, setBikeErrors] = React.useState<{
    brand?: string;
    model?: string;
    year?: string;
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
          top: metrics.lg,
          right: metrics.lg,
          zIndex: 10,
        },
        scrollContent: {
          padding: metrics.lg,
          paddingBottom: metrics['3xl'],
        },
        container: {
          gap: metrics.lg,
        },
        titleRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: metrics.sm,
        },
        title: {
          color: colors.textPrimary,
          fontSize: typography.sizes['xl'],
          fontWeight: '700',
        },
        subtitle: {
          color: colors.textSecondary,
          fontSize: typography.sizes.base,
        },
        section: {
          gap: metrics.md,
          backgroundColor: colors.surface,
          padding: metrics.md,
          borderRadius: metrics.radius.xl,
          borderWidth: 1,
          borderColor: colors.borderDark,
        },
        sectionTitle: {
          color: colors.textPrimary,
          fontSize: typography.sizes.lg,
          fontWeight: '600',
        },
        bikeList: {
          gap: metrics.sm,
        },
        emptyState: {
          borderRadius: metrics.radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          borderStyle: 'dashed',
          minHeight: 108,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: metrics.md,
          gap: metrics.xs,
        },
        emptyTitle: {
          color: colors.textPrimary,
          fontSize: typography.sizes.base,
          fontWeight: '600',
        },
        emptyText: {
          color: colors.textSecondary,
          fontSize: typography.sizes.sm,
          textAlign: 'center',
        },
      }),
    [colors, metrics, typography],
  );

  const validateBike = () => {
    const nextErrors: { brand?: string; model?: string; year?: string } = {};

    if (bikeForm.brand.trim().length === 0) {
      nextErrors.brand = 'Brand is required';
    }
    if (bikeForm.model.trim().length === 0) {
      nextErrors.model = 'Model is required';
    }
    if (!/^\d{4}$/.test(bikeForm.year.trim())) {
      nextErrors.year = 'Year must be 4 digits';
    }

    setBikeErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const addBike = () => {
    if (!validateBike()) {
      return;
    }

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setBikes((previous) => [
      ...previous,
      {
        id: `${Date.now()}`,
        brand: bikeForm.brand.trim(),
        model: bikeForm.model.trim(),
        year: bikeForm.year.trim(),
        image: bikeForm.image,
      },
    ]);
    setBikeForm(emptyBikeForm);
    setBikeErrors({});
  };

  const completeSetup = () => {
    const nextErrors: { name?: string } = {};
    if (user.name.trim().length === 0) {
      nextErrors.name = 'Name is required';
    }

    setUserErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      console.log('Ready for Home');
      setSubmitting(false);
      router.replace('/(tabs)');
    }, 800);
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

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.duration(400)} style={styles.container}>
          <View style={styles.titleRow}>
            <Ionicons color={colors.primary} name="person-circle-outline" size={28} />
            <Text style={styles.title}>Complete Your Profile</Text>
          </View>
          <Text style={styles.subtitle}>Set up your rider identity and garage.</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Profile Info</Text>
            <AvatarPicker
              onChange={(uri) => setUser((previous) => ({ ...previous, avatar: uri }))}
              value={user.avatar}
            />
            <FormInput
              error={userErrors.name}
              label="Full Name"
              onChangeText={(name) => setUser((previous) => ({ ...previous, name }))}
              placeholder="Enter your full name"
              value={user.name}
            />
            <FormInput
              autoCapitalize="sentences"
              label="Bio"
              multiline
              numberOfLines={3}
              onChangeText={(bio) => setUser((previous) => ({ ...previous, bio }))}
              placeholder="Tell your ride story"
              value={user.bio}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Garage Setup</Text>
            <FormInput
              error={bikeErrors.brand}
              label="Bike Brand"
              onChangeText={(brand) => setBikeForm((previous) => ({ ...previous, brand }))}
              placeholder="Yamaha"
              value={bikeForm.brand}
            />
            <FormInput
              error={bikeErrors.model}
              label="Bike Model"
              onChangeText={(model) => setBikeForm((previous) => ({ ...previous, model }))}
              placeholder="R15"
              value={bikeForm.model}
            />
            <FormInput
              error={bikeErrors.year}
              keyboardType="number-pad"
              label="Year"
              onChangeText={(year) => setBikeForm((previous) => ({ ...previous, year }))}
              placeholder="2022"
              value={bikeForm.year}
            />
            <FormInput
              label="Bike Image URL (Mock)"
              onChangeText={(image) => setBikeForm((previous) => ({ ...previous, image }))}
              placeholder="Optional image URL"
              value={bikeForm.image}
            />
            <PrimaryButton onPress={addBike} title="Add Bike" />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>My Bikes</Text>
            {bikes.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No bikes yet</Text>
                <Text style={styles.emptyText}>Add your first bike to build your garage.</Text>
              </View>
            ) : (
              <View style={styles.bikeList}>
                {bikes.map((bike) => (
                  <BikeCard bike={bike} key={bike.id} />
                ))}
              </View>
            )}
          </View>

            <PrimaryButton loading={submitting} onPress={completeSetup} title="Complete Setup" />
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
