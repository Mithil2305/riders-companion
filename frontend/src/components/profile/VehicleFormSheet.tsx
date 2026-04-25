import * as ImagePicker from 'expo-image-picker';
import React from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FormInput, PrimaryButton } from '../common';
import { useTheme } from '../../hooks/useTheme';
import { GarageVehicleType } from '../../types/profile';

type VehicleFormValue = {
  vehicleType: GarageVehicleType;
  brand: string;
  model: string;
  year: string;
  imageUri: string;
};

type VehicleFormErrors = {
  brand?: string;
  model?: string;
  year?: string;
};

interface VehicleFormSheetProps {
  visible: boolean;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (value: {
    vehicleType: GarageVehicleType;
    brand: string;
    model: string;
    year: number;
    imageUri?: string;
  }) => Promise<void> | void;
}

const INITIAL_FORM: VehicleFormValue = {
  vehicleType: 'bike',
  brand: '',
  model: '',
  year: '',
  imageUri: '',
};

export function VehicleFormSheet({
  visible,
  submitting = false,
  onClose,
  onSubmit,
}: VehicleFormSheetProps) {
  const { colors, metrics, typography } = useTheme();
  const [form, setForm] = React.useState<VehicleFormValue>(INITIAL_FORM);
  const [errors, setErrors] = React.useState<VehicleFormErrors>({});

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          flex: 1,
          backgroundColor: colors.overlay,
          justifyContent: 'flex-end',
        },
        sheet: {
          backgroundColor: colors.background,
          borderTopLeftRadius: metrics.radius.xl,
          borderTopRightRadius: metrics.radius.xl,
          maxHeight: metrics.screenHeight * 0.9,
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: metrics.md,
          paddingVertical: metrics.md,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        title: {
          color: colors.textPrimary,
          fontSize: typography.sizes.lg,
          fontWeight: '700',
        },
        body: {
          padding: metrics.md,
          gap: metrics.md,
          paddingBottom: metrics['2xl'],
        },
        typeRow: {
          flexDirection: 'row',
          gap: metrics.sm,
        },
        typeButton: {
          flex: 1,
          borderRadius: metrics.radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          paddingVertical: metrics.sm,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.surface,
        },
        typeButtonActive: {
          borderColor: colors.primary,
          backgroundColor: colors.card,
        },
        typeLabel: {
          color: colors.textSecondary,
          fontSize: typography.sizes.sm,
          fontWeight: '600',
        },
        typeLabelActive: {
          color: colors.primary,
        },
        imagePicker: {
          borderRadius: metrics.radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          borderStyle: 'dashed',
          minHeight: 132,
          backgroundColor: colors.surface,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
          gap: metrics.xs,
        },
        image: {
          width: '100%',
          height: 180,
        },
        pickerText: {
          color: colors.textSecondary,
          fontSize: typography.sizes.sm,
          fontWeight: '500',
        },
        helper: {
          color: colors.textTertiary,
          fontSize: typography.sizes.xs,
        },
      }),
    [colors, metrics, typography],
  );

  React.useEffect(() => {
    if (visible) {
      return;
    }

    setForm(INITIAL_FORM);
    setErrors({});
  }, [visible]);

  const pickImage = React.useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.75,
      allowsEditing: true,
      aspect: [4, 3],
    });

    if (!result.canceled && result.assets.length > 0) {
      setForm((prev) => ({ ...prev, imageUri: result.assets[0].uri }));
    }
  }, []);

  const validate = React.useCallback(() => {
    const nextErrors: VehicleFormErrors = {};

    if (form.brand.trim().length === 0) {
      nextErrors.brand = 'Brand is required';
    }

    if (form.model.trim().length === 0) {
      nextErrors.model = 'Model is required';
    }

    if (!/^\d{4}$/.test(form.year.trim())) {
      nextErrors.year = 'Year must be 4 digits';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [form.brand, form.model, form.year]);

  const handleSubmit = React.useCallback(async () => {
    if (!validate()) {
      return;
    }

    await onSubmit({
      vehicleType: form.vehicleType,
      brand: form.brand.trim(),
      model: form.model.trim(),
      year: Number(form.year.trim()),
      imageUri: form.imageUri || undefined,
    });
  }, [form, onSubmit, validate]);

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Add to garage</Text>
            <Pressable onPress={onClose}>
              <Ionicons color={colors.textPrimary} name="close" size={metrics.icon.lg} />
            </Pressable>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled">
            <View style={styles.body}>
              <View style={styles.typeRow}>
                {(['bike', 'car'] as GarageVehicleType[]).map((type) => {
                  const active = form.vehicleType === type;
                  return (
                    <Pressable
                      key={type}
                      onPress={() => setForm((prev) => ({ ...prev, vehicleType: type }))}
                      style={[styles.typeButton, active && styles.typeButtonActive]}
                    >
                      <Text style={[styles.typeLabel, active && styles.typeLabelActive]}>
                        {type === 'bike' ? 'Bike' : 'Car'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <FormInput
                error={errors.brand}
                label={form.vehicleType === 'bike' ? 'Bike Brand' : 'Car Brand'}
                onChangeText={(brand) => setForm((prev) => ({ ...prev, brand }))}
                placeholder={form.vehicleType === 'bike' ? 'Yamaha' : 'Honda'}
                value={form.brand}
              />
              <FormInput
                error={errors.model}
                label={form.vehicleType === 'bike' ? 'Bike Model' : 'Car Model'}
                onChangeText={(model) => setForm((prev) => ({ ...prev, model }))}
                placeholder={form.vehicleType === 'bike' ? 'R15' : 'City'}
                value={form.model}
              />
              <FormInput
                error={errors.year}
                keyboardType="number-pad"
                label="Year"
                onChangeText={(year) => setForm((prev) => ({ ...prev, year }))}
                placeholder="2022"
                value={form.year}
              />

              <Pressable onPress={pickImage} style={styles.imagePicker}>
                {form.imageUri.length > 0 ? (
                  <Image source={{ uri: form.imageUri }} style={styles.image} />
                ) : (
                  <>
                    <Ionicons
                      color={colors.textSecondary}
                      name="cloud-upload-outline"
                      size={metrics.icon.lg + 4}
                    />
                    <Text style={styles.pickerText}>Upload vehicle image</Text>
                    <Text style={styles.helper}>JPG/PNG from your library</Text>
                  </>
                )}
              </Pressable>

              <PrimaryButton
                loading={submitting}
                onPress={handleSubmit}
                title={`Add ${form.vehicleType === 'bike' ? 'Bike' : 'Car'}`}
              />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
