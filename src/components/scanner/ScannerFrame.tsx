import React, { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { colors, motion, radii } from '../../theme/tokens';

export type ScanFrameState = 'searching' | 'detected' | 'processing';

interface ScannerFrameProps {
  state: ScanFrameState;
  width: number;
  height: number;
}

const CORNER_LENGTH = 32;
const CORNER_THICKNESS = 4;

export function ScannerFrame({ state, width, height }: ScannerFrameProps) {
  // See Button.tsx for why these use useState's initializer instead of
  // useRef — same "created once, mutated imperatively" Animated.Value idiom.
  const [pulse] = useState(() => new Animated.Value(0));
  const [sweep] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (state !== 'searching') return undefined;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: motion.scannerPulse,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: motion.scannerPulse,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [state, pulse]);

  useEffect(() => {
    if (state !== 'processing') {
      sweep.setValue(0);
      return undefined;
    }
    const loop = Animated.loop(
      Animated.timing(sweep, {
        toValue: 1,
        duration: motion.slow * 2.5,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [state, sweep]);

  const frameColor = state === 'detected' ? colors.accent : colors.accentGlow;
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] });
  const sweepTranslateY = sweep.interpolate({ inputRange: [0, 1], outputRange: [0, height] });

  return (
    <View style={[styles.container, { width, height }]} pointerEvents="none">
      <Animated.View style={[styles.corner, styles.topLeft, { borderColor: frameColor, opacity: state === 'detected' ? 1 : opacity }]} />
      <Animated.View style={[styles.corner, styles.topRight, { borderColor: frameColor, opacity: state === 'detected' ? 1 : opacity }]} />
      <Animated.View style={[styles.corner, styles.bottomLeft, { borderColor: frameColor, opacity: state === 'detected' ? 1 : opacity }]} />
      <Animated.View style={[styles.corner, styles.bottomRight, { borderColor: frameColor, opacity: state === 'detected' ? 1 : opacity }]} />

      {state === 'processing' && (
        <Animated.View style={[styles.sweepLine, { transform: [{ translateY: sweepTranslateY }] }]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radii.lg,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: CORNER_LENGTH,
    height: CORNER_LENGTH,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderLeftWidth: CORNER_THICKNESS,
    borderTopWidth: CORNER_THICKNESS,
    borderTopLeftRadius: radii.md,
  },
  topRight: {
    top: 0,
    right: 0,
    borderRightWidth: CORNER_THICKNESS,
    borderTopWidth: CORNER_THICKNESS,
    borderTopRightRadius: radii.md,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderLeftWidth: CORNER_THICKNESS,
    borderBottomWidth: CORNER_THICKNESS,
    borderBottomLeftRadius: radii.md,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderRightWidth: CORNER_THICKNESS,
    borderBottomWidth: CORNER_THICKNESS,
    borderBottomRightRadius: radii.md,
  },
  sweepLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.accent,
    shadowColor: colors.accent,
    shadowOpacity: 0.9,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
});
