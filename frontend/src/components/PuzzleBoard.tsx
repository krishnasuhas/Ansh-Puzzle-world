import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import type { ImageSourcePropType } from "react-native";

import { colors, radius } from "@/src/theme";

const GAP = 4;

export type PuzzleBoardHandle = {
  shuffle: () => void;
};

type Props = {
  n: number;
  boardSize: number;
  source: ImageSourcePropType;
  active: boolean;
  onMove: () => void;
  onSolved: () => void;
  showNumbers?: boolean;
};

function adjacent(a: number, b: number, n: number): boolean {
  const ar = Math.floor(a / n);
  const ac = a % n;
  const br = Math.floor(b / n);
  const bc = b % n;
  return (ar === br && Math.abs(ac - bc) === 1) ||
    (ac === bc && Math.abs(ar - br) === 1);
}

function isSolved(tiles: number[]): boolean {
  return tiles.every((v, i) => v === i);
}

// Solvable shuffle via a random walk of legal moves from the solved state.
function makeShuffled(n: number): number[] {
  const total = n * n;
  const tiles = Array.from({ length: total }, (_, i) => i);
  let empty = total - 1;

  const step = (count: number) => {
    for (let i = 0; i < count; i++) {
      const r = Math.floor(empty / n);
      const c = empty % n;
      const neighbors: number[] = [];
      if (r > 0) neighbors.push(empty - n);
      if (r < n - 1) neighbors.push(empty + n);
      if (c > 0) neighbors.push(empty - 1);
      if (c < n - 1) neighbors.push(empty + 1);
      const pick = neighbors[Math.floor(Math.random() * neighbors.length)];
      [tiles[empty], tiles[pick]] = [tiles[pick], tiles[empty]];
      empty = pick;
    }
  };

  step(total * total * 8);
  // Nudge off the solved state without recursion.
  let guard = 0;
  while (isSolved(tiles) && guard < 30) {
    step(n + 1);
    guard++;
  }
  return tiles;
}

type TileProps = {
  goal: number;
  pos: number;
  n: number;
  tileSize: number;
  source: ImageSourcePropType;
  onPress: () => void;
  showNumbers?: boolean;
};

function Tile({ goal, pos, n, tileSize, source, onPress, showNumbers }: TileProps) {
  const row = Math.floor(pos / n);
  const col = pos % n;
  const tx = useSharedValue(col * tileSize);
  const ty = useSharedValue(row * tileSize);

  useEffect(() => {
    tx.value = withTiming(col * tileSize, { duration: 150 });
    ty.value = withTiming(row * tileSize, { duration: 150 });
  }, [pos, tileSize]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }],
  }));

  const inner = tileSize - GAP;
  const imgSize = inner * n;
  const gr = Math.floor(goal / n);
  const gc = goal % n;

  return (
    <Animated.View
      style={[
        { position: "absolute", width: tileSize, height: tileSize },
        animStyle,
      ]}
    >
      <Pressable
        testID={`puzzle-tile-${goal}`}
        onPress={onPress}
        style={{ width: tileSize, height: tileSize, padding: GAP / 2 }}
      >
        <View style={styles.tileClip}>
          <Image
            source={source}
            style={{
              width: imgSize,
              height: imgSize,
              transform: [
                { translateX: -gc * inner },
                { translateY: -gr * inner },
              ],
            }}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        </View>
      </Pressable>
    </Animated.View>
  );
}

const PuzzleBoard = forwardRef<PuzzleBoardHandle, Props>(function PuzzleBoard(
  { n, boardSize, source, active, onMove, onSolved, showNumbers },
  ref,
) {
  const total = n * n;
  const tileSize = boardSize / n;
  const [tiles, setTiles] = useState<number[]>(() => makeShuffled(n));
  const solvedRef = useRef(false);

  const doShuffle = useCallback(() => {
    solvedRef.current = false;
    setTiles(makeShuffled(n));
  }, [n]);

  useImperativeHandle(ref, () => ({ shuffle: doShuffle }), [doShuffle]);

  const emptyPos = useMemo(() => tiles.indexOf(total - 1), [tiles, total]);

  const handlePress = useCallback(
    (pos: number) => {
      if (!active || solvedRef.current) return;
      const empty = tiles.indexOf(total - 1);
      if (!adjacent(pos, empty, n)) return;
      const next = tiles.slice();
      [next[pos], next[empty]] = [next[empty], next[pos]];
      setTiles(next);
      onMove();
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }
      if (isSolved(next)) {
        solvedRef.current = true;
        onSolved();
      }
    },
    [active, tiles, total, n, onMove, onSolved],
  );

  const solved = solvedRef.current;

  return (
    <View
      testID="puzzle-board"
      style={[
        styles.board,
        { width: boardSize, height: boardSize },
      ]}
    >
      {tiles.map((goal, pos) => {
        // hide the empty tile unless the puzzle is solved (then show full picture)
        if (goal === total - 1 && !solved) return null;
        return (
          <Tile
            key={goal}
            goal={goal}
            pos={pos}
            n={n}
            tileSize={tileSize}
            source={source}
            onPress={() => handlePress(pos)}
            showNumbers={showNumbers}
          />
        );
      })}
    </View>
  );
});

export default PuzzleBoard;

const styles = StyleSheet.create({
  board: {
    backgroundColor: colors.brandTertiary,
    borderRadius: radius.lg,
    overflow: "hidden",
    position: "relative",
  },
  tileClip: {
    flex: 1,
    overflow: "hidden",
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceTertiary,
  },
});
