import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ANSH_PHOTOS } from "@/src/photos";
import { colors, font, fontSize, radius, shadow, spacing } from "@/src/theme";

type Grid = 2 | 3 | 4;
type Mode = "relaxed" | "timed";

export default function Setup() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [photoId, setPhotoId] = useState<string>(ANSH_PHOTOS[0].id);
  const [galleryUri, setGalleryUri] = useState<string | null>(null);
  const [grid, setGrid] = useState<Grid>(3);
  const [mode, setMode] = useState<Mode>("relaxed");
  const [permBlocked, setPermBlocked] = useState(false);

  const tap = () => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync().catch(() => {});
    }
  };

  const pickFromGallery = async () => {
    tap();
    const current = await ImagePicker.getMediaLibraryPermissionsAsync();
    let status = current.status;
    let canAskAgain = current.canAskAgain;

    if (status !== "granted") {
      const req = await ImagePicker.requestMediaLibraryPermissionsAsync();
      status = req.status;
      canAskAgain = req.canAskAgain;
    }

    if (status !== "granted") {
      if (!canAskAgain) setPermBlocked(true);
      return;
    }

    setPermBlocked(false);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setGalleryUri(result.assets[0].uri);
      setPhotoId("gallery");
    }
  };

  const start = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    router.push({
      pathname: "/game",
      params: {
        grid: String(grid),
        mode,
        photoId,
        photoUri: photoId === "gallery" && galleryUri ? galleryUri : "",
      },
    });
  };

  return (
    <View style={styles.fill}>
      {/* Sticky header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable
          testID="setup-back-button"
          onPress={() => router.back()}
          style={styles.iconBtn}
          hitSlop={10}
        >
          <Ionicons name="chevron-back" size={24} color={colors.onSurface} />
        </Pressable>
        <Text style={styles.headerTitle}>New Puzzle</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: spacing.xl,
          paddingBottom: insets.bottom + 120,
          gap: spacing.xl,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Photo picker */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pick a Photo</Text>
          <Text style={styles.sectionHint}>
            Choose one of baby Ansh's photos, or add your own.
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: spacing.md, paddingVertical: spacing.sm }}
          >
            <Pressable
              testID="pick-gallery-button"
              onPress={pickFromGallery}
              style={[styles.photoCard, styles.galleryCard]}
            >
              {galleryUri ? (
                <Image source={{ uri: galleryUri }} style={styles.photoImg} contentFit="cover" />
              ) : (
                <View style={styles.galleryInner}>
                  <Ionicons name="images" size={28} color={colors.brandPrimary} />
                  <Text style={styles.galleryText}>Gallery</Text>
                </View>
              )}
              {photoId === "gallery" && galleryUri ? (
                <View style={styles.selectedRing} />
              ) : null}
            </Pressable>

            {ANSH_PHOTOS.map((p) => {
              const selected = photoId === p.id;
              return (
                <Pressable
                  key={p.id}
                  testID={`photo-${p.id}`}
                  onPress={() => {
                    tap();
                    setPhotoId(p.id);
                  }}
                  style={styles.photoCard}
                >
                  <Image source={p.source} style={styles.photoImg} contentFit="cover" />
                  {selected ? (
                    <>
                      <View style={styles.selectedRing} />
                      <View style={styles.checkBadge}>
                        <Ionicons name="checkmark" size={14} color={colors.onBrandPrimary} />
                      </View>
                    </>
                  ) : null}
                </Pressable>
              );
            })}
          </ScrollView>

          {permBlocked ? (
            <View style={styles.permBox}>
              <Text style={styles.permText}>
                Photo access is off. Enable it in Settings to use your own photo.
              </Text>
              <Pressable
                testID="open-settings-button"
                onPress={() => Linking.openSettings()}
                style={styles.permBtn}
              >
                <Text style={styles.permBtnText}>Open Settings</Text>
              </Pressable>
            </View>
          ) : null}
        </View>

        {/* Difficulty */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Difficulty</Text>
          <View style={styles.row}>
            <OptionCard
              compact
              testID="grid-2-option"
              selected={grid === 2}
              onPress={() => {
                tap();
                setGrid(2);
              }}
              icon="apps-outline"
              title="2 x 2"
              subtitle="Easy"
            />
            <OptionCard
              compact
              testID="grid-3-option"
              selected={grid === 3}
              onPress={() => {
                tap();
                setGrid(3);
              }}
              icon="grid-outline"
              title="3 x 3"
              subtitle="Medium"
            />
            <OptionCard
              compact
              testID="grid-4-option"
              selected={grid === 4}
              onPress={() => {
                tap();
                setGrid(4);
              }}
              icon="grid"
              title="4 x 4"
              subtitle="Hard"
            />
          </View>
        </View>

        {/* Mode */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mode</Text>
          <View style={styles.row}>
            <OptionCard
              testID="mode-relaxed-option"
              selected={mode === "relaxed"}
              onPress={() => {
                tap();
                setMode("relaxed");
              }}
              icon="happy-outline"
              title="Relaxed"
              subtitle="No timer, just fun"
            />
            <OptionCard
              testID="mode-timed-option"
              selected={mode === "timed"}
              onPress={() => {
                tap();
                setMode("timed");
              }}
              icon="timer-outline"
              title="Timed"
              subtitle="Beat the clock"
            />
          </View>
        </View>
      </ScrollView>

      {/* Sticky footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <Pressable testID="start-puzzle-button" onPress={start} style={styles.startBtn}>
          <Text style={styles.startText}>Start Puzzle</Text>
          <Ionicons name="arrow-forward" size={20} color={colors.onBrandPrimary} />
        </Pressable>
      </View>
    </View>
  );
}

function OptionCard({
  selected,
  onPress,
  icon,
  title,
  subtitle,
  testID,
  compact,
}: {
  selected: boolean;
  onPress: () => void;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  testID: string;
  compact?: boolean;
}) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={[
        styles.optionCard,
        compact && styles.optionCardCompact,
        selected && styles.optionCardSelected,
      ]}
    >
      <Ionicons
        name={icon}
        size={compact ? 24 : 28}
        color={selected ? colors.onBrandPrimary : colors.brandPrimary}
      />
      <Text style={[styles.optionTitle, selected && styles.optionTitleSelected]}>
        {title}
      </Text>
      <Text style={[styles.optionSub, selected && styles.optionSubSelected]}>
        {subtitle}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontFamily: font.display,
    fontSize: fontSize.xl,
    color: colors.onSurface,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
  },
  section: { gap: spacing.sm },
  sectionTitle: {
    fontFamily: font.display,
    fontSize: fontSize["2xl"],
    color: colors.onSurface,
  },
  sectionHint: {
    fontFamily: font.text,
    fontSize: fontSize.base,
    color: colors.onSurface,
    opacity: 0.6,
  },
  photoCard: {
    width: 96,
    height: 96,
    borderRadius: radius.lg,
    overflow: "hidden",
    backgroundColor: colors.surfaceSecondary,
    ...shadow.card,
  },
  photoImg: { width: "100%", height: "100%" },
  galleryCard: {
    borderWidth: 2,
    borderColor: colors.brandTertiary,
    borderStyle: "dashed",
    backgroundColor: colors.brandTertiary,
  },
  galleryInner: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.xs },
  galleryText: {
    fontFamily: font.text,
    fontSize: fontSize.sm,
    fontWeight: "700",
    color: colors.brandPrimary,
  },
  selectedRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.lg,
    borderWidth: 4,
    borderColor: colors.brandPrimary,
  },
  checkBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  row: { flexDirection: "row", gap: spacing.md },
  optionCard: {
    flex: 1,
    gap: spacing.xs,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "flex-start",
    ...shadow.card,
  },
  optionCardCompact: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: "center",
  },
  optionCardSelected: {
    backgroundColor: colors.brand,
    borderColor: colors.brandPrimary,
  },
  optionTitle: {
    fontFamily: font.display,
    fontSize: fontSize.xl,
    color: colors.onSurface,
    marginTop: spacing.xs,
  },
  optionTitleSelected: { color: colors.onBrandPrimary },
  optionSub: {
    fontFamily: font.text,
    fontSize: fontSize.base,
    color: colors.onSurface,
    opacity: 0.65,
  },
  optionSubSelected: { color: colors.onBrandPrimary, opacity: 0.85 },
  permBox: {
    backgroundColor: colors.brandTertiary,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  permText: { fontFamily: font.text, fontSize: fontSize.base, color: colors.onSurface },
  permBtn: {
    alignSelf: "flex-start",
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  permBtnText: { fontFamily: font.text, fontWeight: "700", color: colors.onBrandPrimary },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.brandPrimary,
    paddingVertical: spacing.lg,
    borderRadius: radius.pill,
    ...shadow.soft,
  },
  startText: {
    fontFamily: font.display,
    fontSize: fontSize.xl,
    color: colors.onBrandPrimary,
    fontWeight: "600",
  },
});
