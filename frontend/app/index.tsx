import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ANSH_PHOTOS } from "@/src/photos";
import { colors, font, fontSize, radius, shadow, spacing } from "@/src/theme";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function FloatingPhoto({
  index,
  photoIndex,
}: {
  index: number;
  photoIndex: number;
}) {
  const y = useSharedValue(0);
  useEffect(() => {
    y.value = withDelay(
      index * 220,
      withRepeat(
        withSequence(
          withTiming(-8, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
          withTiming(8, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      ),
    );
  }, []);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }, { rotate: `${(index % 2 ? 1 : -1) * 3}deg` }],
  }));
  return (
    <Animated.View style={[styles.heroPhotoWrap, style]}>
      <Image
        source={ANSH_PHOTOS[photoIndex].source}
        style={styles.heroPhoto}
        contentFit="cover"
        cachePolicy="memory-disk"
      />
    </Animated.View>
  );
}

export default function Welcome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scale = useSharedValue(1);

  const btnStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const onPlay = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    router.push("/setup");
  };

  return (
    <LinearGradient
      colors={["#E2EDF2", "#FDFBF7", "#F7EFD6"]}
      style={styles.fill}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
    >
      <View style={[styles.container, { paddingTop: insets.top + spacing.xl }]}>
        <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
          <View style={styles.badge}>
            <Ionicons name="heart" size={14} color={colors.error} />
            <Text style={styles.badgeText}>A gift for baby Ansh</Text>
          </View>
          <Text style={styles.title}>Ansh's{"\n"}Puzzle World</Text>
          <Text style={styles.subtitle}>
            Slide the tiles and bring baby Ansh's photo back together!
          </Text>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(200).duration(700)}
          style={styles.heroGrid}
        >
          <View style={styles.heroRow}>
            <FloatingPhoto index={0} photoIndex={0} />
            <FloatingPhoto index={1} photoIndex={1} />
          </View>
          <View style={styles.heroRow}>
            <FloatingPhoto index={2} photoIndex={2} />
            <FloatingPhoto index={3} photoIndex={3} />
          </View>
        </Animated.View>

        <View style={{ flex: 1 }} />

        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
          <AnimatedPressable
            testID="play-now-button"
            onPressIn={() => (scale.value = withTiming(0.96, { duration: 90 }))}
            onPressOut={() => (scale.value = withTiming(1, { duration: 120 }))}
            onPress={onPlay}
            style={[styles.playButton, btnStyle]}
          >
            <Ionicons name="play" size={22} color={colors.onBrandPrimary} />
            <Text style={styles.playText}>Play Now</Text>
          </AnimatedPressable>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  container: { flex: 1, paddingHorizontal: spacing.xl },
  header: { alignItems: "center", gap: spacing.sm },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
    ...shadow.card,
  },
  badgeText: {
    fontFamily: font.text,
    fontSize: fontSize.sm,
    color: colors.onSurface,
    fontWeight: "700",
  },
  title: {
    fontFamily: font.display,
    fontSize: fontSize["4xl"],
    lineHeight: 44,
    color: colors.onBrandPrimary,
    textAlign: "center",
    marginTop: spacing.sm,
  },
  subtitle: {
    fontFamily: font.text,
    fontSize: fontSize.lg,
    color: colors.onSurface,
    textAlign: "center",
    opacity: 0.75,
    paddingHorizontal: spacing.md,
    marginTop: spacing.xs,
  },
  heroGrid: {
    marginTop: spacing["2xl"],
    gap: spacing.md,
    alignItems: "center",
  },
  heroRow: { flexDirection: "row", gap: spacing.md },
  heroPhotoWrap: {
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceSecondary,
    padding: 6,
    ...shadow.soft,
  },
  heroPhoto: {
    width: 128,
    height: 128,
    borderRadius: radius.md,
  },
  footer: { paddingTop: spacing.lg },
  playButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.brandPrimary,
    paddingVertical: spacing.lg + 2,
    borderRadius: radius.pill,
    ...shadow.soft,
  },
  playText: {
    fontFamily: font.display,
    fontSize: fontSize.xl,
    color: colors.onBrandPrimary,
    fontWeight: "600",
  },
});
