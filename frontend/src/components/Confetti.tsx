import React, { useEffect } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

const CONFETTI_COLORS = [
  "#96B8C5",
  "#FCEB9C",
  "#A5D6A7",
  "#90CAF9",
  "#EF9A9A",
  "#AEC6CF",
  "#FFD54F",
];

type PieceProps = {
  x: number;
  delay: number;
  color: string;
  size: number;
  screenH: number;
  duration: number;
};

function Piece({ x, delay, color, size, screenH, duration }: PieceProps) {
  const progress = useSharedValue(0);
  const spin = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration, easing: Easing.linear }),
        -1,
        false,
      ),
    );
    spin.value = withRepeat(
      withTiming(1, { duration: duration * 0.6, easing: Easing.linear }),
      -1,
      false,
    );
  }, []);

  const style = useAnimatedStyle(() => {
    const translateY = -60 + progress.value * (screenH + 120);
    const drift = Math.sin(progress.value * Math.PI * 4) * 24;
    const rotate = `${spin.value * 360}deg`;
    const opacity = progress.value > 0.9 ? (1 - progress.value) * 10 : 1;
    return {
      transform: [
        { translateX: x + drift },
        { translateY },
        { rotate },
      ],
      opacity,
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: "absolute",
          top: 0,
          left: 0,
          width: size,
          height: size * 1.4,
          borderRadius: 3,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

export default function Confetti({ count = 80 }: { count?: number }) {
  const { width, height } = useWindowDimensions();
  const pieces = React.useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        key: i,
        x: Math.random() * width,
        delay: Math.random() * 1200,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        size: 8 + Math.random() * 8,
        duration: 2600 + Math.random() * 1800,
      })),
    [count, width],
  );

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((p) => (
        <Piece
          key={p.key}
          x={p.x}
          delay={p.delay}
          color={p.color}
          size={p.size}
          screenH={height}
          duration={p.duration}
        />
      ))}
    </View>
  );
}
