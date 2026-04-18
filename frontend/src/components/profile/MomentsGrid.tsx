import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useTheme } from "../../hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";

interface MomentsGridProps {
  images: string[];
}

export function MomentsGrid({ images }: MomentsGridProps) {
  const { colors, metrics, typography } = useTheme();
  const [loadedState, setLoadedState] = React.useState<Record<string, boolean>>(
    {},
  );

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "space-between",
          marginTop: metrics.sm,
          rowGap: metrics.sm,
        },
        tile: {
          width: "31.8%",
          aspectRatio: 1,
          overflow: "hidden",
          backgroundColor: colors.surface,
        },
        image: {
          width: "100%",
          height: "100%",
        },
        placeholder: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: colors.surface,
        },
        addCard: {
          minHeight: 56,
          marginTop: metrics.lg,
          borderRadius: 14,
          borderWidth: 2,
          borderStyle: "dashed",
          borderColor: colors.border,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: metrics.sm,
        },
        addText: {
          color: colors.textSecondary,
          fontSize: typography.sizes.sm,
          fontWeight: "500",
        },
      }),
    [colors, metrics, typography],
  );

  return (
    <>
      <View style={styles.wrap}>
        {images.map((uri, index) => {
          const key = `${uri}-${index}`;

          return (
            <View key={key} style={styles.tile}>
              <Image
                onLoadEnd={() =>
                  setLoadedState((prev) => ({ ...prev, [key]: true }))
                }
                source={{ uri }}
                style={styles.image}
              />
              {!loadedState[key] && (
                <Animated.View
                  entering={FadeIn.duration(180)}
                  style={styles.placeholder}
                />
              )}
            </View>
          );
        })}
      </View>
      <Pressable style={styles.addCard}>
        <Ionicons
          color={colors.textSecondary}
          name="images-outline"
          size={30}
        />
        <Text style={styles.addText}>Add Moments</Text>
      </Pressable>
    </>
  );
}
