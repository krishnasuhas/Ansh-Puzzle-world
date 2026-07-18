import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, { FadeIn, ZoomIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Confetti from "@/src/components/Confetti";
import PuzzleBoard, { PuzzleBoardHandle } from "@/src/components/PuzzleBoard";
import { saveScore } from "@/src/api";
import { ANSH_PHOTOS, getPhotoSource } from "@/src/photos";
import { colors, font, fontSize, radius, shadow, spacing } from "@/src/theme";

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const TIMED_BASELINE: Record<number, number> = { 2: 90, 3: 180, 4: 300 };

export default function Game() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const params = useLocalSearchParams<{
    grid: string;
    mode: string;
    photoId: string;
    photoUri: string;
  }>();
  const n = params.grid === "4" ? 4 : params.grid === "2" ? 2 : 3;
  const mode = params.mode === "timed" ? "timed" : "relaxed";
  const [photoId, setPhotoId] = useState(params.photoId || "ansh_1");
  const [photoUri, setPhotoUri] = useState(params.photoUri || "");
  const source = getPhotoSource(photoId, photoUri);

  const boardSize = Math.min(width - spacing.xl * 2, 420);

  const boardRef = useRef<PuzzleBoardHandle>(null);
  const [moves, setMoves] = useState(0);
  const [seconds, setSeconds] = useState(
    mode === "timed" ? TIMED_BASELINE[n] : 0,
  );
  const [status, setStatus] = useState<"playing" | "won" | "lost">("playing");
  const savedRef = useRef(false);

  // Timer
  useEffect(() => {
    if (status !== "playing") return;
    const id = setInterval(() => {
      setSeconds((prev) => {
        if (mode === "timed") {
          if (prev <= 1) {
            clearInterval(id);
            setStatus("lost");
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Error,
              ).catch(() => {});
            }
            return 0;
          }
          return prev - 1;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [status, mode]);

  const onSolved = useCallback(() => {
    setStatus("won");
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
    }
  }, []);

  // Save score once on win
  useEffect(() => {
    if (status === "won" && !savedRef.current) {
      savedRef.current = true;
      const elapsed =
        mode === "timed" ? TIMED_BASELINE[n] - seconds : seconds;
      saveScore({
        grid: n,
        mode,
        photo_id: photoId,
        moves,
        time_seconds: elapsed,
      });
    }
  }, [status]);

  const restart = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    savedRef.current = false;
    setMoves(0);
    setSeconds(mode === "timed" ? TIMED_BASELINE[n] : 0);
    setStatus("playing");
    boardRef.current?.shuffle();
  };

  const playNext = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    const currentIndex = ANSH_PHOTOS.findIndex((p) => p.id === photoId);
    const next = ANSH_PHOTOS[(currentIndex + 1) % ANSH_PHOTOS.length];
    setPhotoId(next.id);
    setPhotoUri("");
    savedRef.current = false;
    setMoves(0);
    setSeconds(mode === "timed" ? TIMED_BASELINE[n] : 0);
    setStatus("playing");
    boardRef.current?.shuffle();
  };

  const finishedTime =
    mode === "timed" ? TIMED_BASELINE[n] - seconds : seconds;
  const lowTime = mode === "timed" && seconds <= 15;

  return (
    <View style={styles.fill}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable
          testID="game-back-button"
          onPress={() => router.back()}
          style={styles.iconBtn}
          hitSlop={10}
        >
          <Ionicons name="chevron-back" size={24} color={colors.onSurface} />
        </Pressable>

        <View style={styles.stat}>
          <Ionicons name="footsteps-outline" size={16} color={colors.brandPrimary} />
          <Text testID="moves-counter" style={styles.statText}>
            {moves}
          </Text>
        </View>

        <View style={[styles.stat, lowTime && styles.statAlert]}>
          <Ionicons
            name="time-outline"
            size={16}
            color={lowTime ? colors.onError : colors.brandPrimary}
          />
          <Text
            testID="timer-display"
            style={[styles.statText, lowTime && { color: colors.onError }]}
          >
            {formatTime(seconds)}
          </Text>
        </View>
      </View>

      {/* Board */}
      <View style={styles.boardWrap}>
        <View style={styles.previewRow}>
          <Image source={source} style={styles.preview} contentFit="cover" />
          <View style={{ flex: 1 }}>
            <Text style={styles.modeLabel}>
              {n}×{n} · {mode === "timed" ? "Timed" : "Relaxed"}
            </Text>
            <Text style={styles.previewHint}>
              Tap a tile next to the empty space to slide it.
            </Text>
          </View>
        </View>

        <PuzzleBoard
          ref={boardRef}
          n={n}
          boardSize={boardSize}
          source={source}
          active={status === "playing"}
          onMove={() => setMoves((m) => m + 1)}
          onSolved={onSolved}
        />
      </View>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <Pressable testID="shuffle-button" onPress={restart} style={styles.shuffleBtn}>
          <Ionicons name="shuffle" size={20} color={colors.onBrandTertiary} />
          <Text style={styles.shuffleText}>Shuffle & Restart</Text>
        </Pressable>
      </View>

      {/* Win overlay */}
      {status === "won" ? (
        <Animated.View
          entering={FadeIn.duration(300)}
          style={styles.overlay}
          testID="win-overlay"
        >
          <Confetti count={90} />
          <Animated.View entering={ZoomIn.duration(400)} style={styles.resultCard}>
            <View style={styles.resultImgWrap}>
              <Image source={source} style={styles.resultImg} contentFit="cover" />
            </View>
            <Text style={styles.resultTitle}>Puzzle Solved!</Text>
            <Text style={styles.resultSub}>Yay! You put baby Ansh back together 💙</Text>
            <View style={styles.statsRow}>
              <StatChip icon="footsteps" label="Moves" value={String(moves)} />
              <StatChip icon="time" label="Time" value={formatTime(finishedTime)} />
            </View>
            <Pressable testID="play-next-button" onPress={playNext} style={styles.primaryBtn}>
              <Ionicons name="arrow-forward" size={20} color={colors.onBrandPrimary} />
              <Text style={styles.primaryText}>Play Next</Text>
            </Pressable>
            <Pressable
              testID="main-menu-button"
              onPress={() => router.replace("/")}
              style={styles.secondaryBtn}
            >
              <Text style={styles.secondaryText}>Main Menu</Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      ) : null}

      {/* Lost overlay */}
      {status === "lost" ? (
        <Animated.View
          entering={FadeIn.duration(300)}
          style={styles.overlay}
          testID="lose-overlay"
        >
          <Animated.View entering={ZoomIn.duration(400)} style={styles.resultCard}>
            <View style={[styles.resultImgWrap, { backgroundColor: colors.error }]}>
              <Ionicons name="hourglass-outline" size={44} color={colors.onError} />
            </View>
            <Text style={styles.resultTitle}>Time's Up!</Text>
            <Text style={styles.resultSub}>So close! Give it another go.</Text>
            <View style={styles.statsRow}>
              <StatChip icon="footsteps" label="Moves" value={String(moves)} />
            </View>
            <Pressable testID="try-again-button" onPress={restart} style={styles.primaryBtn}>
              <Ionicons name="refresh" size={20} color={colors.onBrandPrimary} />
              <Text style={styles.primaryText}>Try Again</Text>
            </Pressable>
            <Pressable
              testID="lose-menu-button"
              onPress={() => router.replace("/")}
              style={styles.secondaryBtn}
            >
              <Text style={styles.secondaryText}>Main Menu</Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      ) : null}
    </View>
  );
}

function StatChip({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.statChip}>
      <Ionicons name={icon} size={18} color={colors.brandPrimary} />
      <Text style={styles.statChipValue}>{value}</Text>
      <Text style={styles.statChipLabel}>{label}</Text>
    </View>
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
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.surfaceTertiary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    minWidth: 70,
    justifyContent: "center",
  },
  statAlert: { backgroundColor: colors.error },
  statText: {
    fontFamily: font.display,
    fontSize: fontSize.lg,
    color: colors.onSurface,
    fontWeight: "600",
  },
  boardWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    gap: spacing.xl,
  },
  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    alignSelf: "stretch",
  },
  preview: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceTertiary,
  },
  modeLabel: {
    fontFamily: font.display,
    fontSize: fontSize.lg,
    color: colors.onSurface,
  },
  previewHint: {
    fontFamily: font.text,
    fontSize: fontSize.base,
    color: colors.onSurface,
    opacity: 0.6,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  shuffleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.brandTertiary,
    paddingVertical: spacing.md + 2,
    borderRadius: radius.pill,
  },
  shuffleText: {
    fontFamily: font.text,
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.onBrandTertiary,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(26,47,56,0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  resultCard: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.sm,
    ...shadow.soft,
  },
  resultImgWrap: {
    width: 88,
    height: 88,
    borderRadius: radius.lg,
    overflow: "hidden",
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  resultImg: { width: "100%", height: "100%" },
  resultTitle: {
    fontFamily: font.display,
    fontSize: fontSize["3xl"],
    color: colors.onSurface,
  },
  resultSub: {
    fontFamily: font.text,
    fontSize: fontSize.lg,
    color: colors.onSurface,
    opacity: 0.7,
    textAlign: "center",
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginVertical: spacing.md,
  },
  statChip: {
    alignItems: "center",
    gap: 2,
    backgroundColor: colors.surfaceTertiary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    minWidth: 96,
  },
  statChipValue: {
    fontFamily: font.display,
    fontSize: fontSize["2xl"],
    color: colors.onSurface,
  },
  statChipLabel: {
    fontFamily: font.text,
    fontSize: fontSize.sm,
    color: colors.onSurface,
    opacity: 0.6,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    alignSelf: "stretch",
    backgroundColor: colors.brandPrimary,
    paddingVertical: spacing.lg,
    borderRadius: radius.pill,
    ...shadow.card,
  },
  primaryText: {
    fontFamily: font.display,
    fontSize: fontSize.xl,
    color: colors.onBrandPrimary,
    fontWeight: "600",
  },
  secondaryBtn: {
    alignSelf: "stretch",
    alignItems: "center",
    paddingVertical: spacing.md,
  },
  secondaryText: {
    fontFamily: font.text,
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.onSurface,
    opacity: 0.7,
  },
});
