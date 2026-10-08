import { useEffect, useMemo, useState } from 'react';
import { AppState, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  Easing,
  ReduceMotion,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

const SLOW_MS = 3600;
const FAST_MS = 2200;

type Spec = {
  key: string;
  count: number;
  tone: string;
  opacity: number;
  bottom: number;
  height: number;
  width: number;
  min: number;
  max: number;
};

const SPECS: Spec[] = [
  { key: 'far', count: 12, tone: '#2C5A46', opacity: 0.5, bottom: 0.4, height: 0.31, width: 0.013, min: 0.033, max: 0.061 },
  { key: 'mid', count: 12, tone: '#3C7F52', opacity: 0.72, bottom: 0.24, height: 0.4, width: 0.016, min: 0.049, max: 0.086 },
  { key: 'near', count: 10, tone: '#57A468', opacity: 0.92, bottom: 0.07, height: 0.48, width: 0.02, min: 0.061, max: 0.107 },
  { key: 'fg', count: 7, tone: '#6FC57C', opacity: 1, bottom: -0.09, height: 0.55, width: 0.026, min: 0.09, max: 0.139 },
];

type Blade = { left: number; height: number; base: number };
type Band = Spec & { blades: Blade[]; groups: Blade[][]; box: { bottom: number; height: number; width: number } };

const buildBands = (width: number, height: number): Band[] =>
  SPECS.map((spec) => {
    const blades = Array.from({ length: spec.count }, (_, index) => ({
      left: (100 * (index + 0.5)) / spec.count,
      height: Math.round((spec.min + (((index * 7) % 100) / 100) * (spec.max - spec.min)) * height),
      base: ((index % 3) - 1) * 2.5,
    }));
    const half = Math.ceil(blades.length / 2);

    return {
      ...spec,
      blades,
      groups: [blades.slice(0, half), blades.slice(half)],
      box: {
        bottom: Math.round(spec.bottom * height),
        height: Math.round(spec.height * height),
        width: Math.max(2, Math.round(spec.width * width)),
      },
    };
  });

const SWAY = [2.4, 3.2, 3.8, 4.6] as const;

const useSway = (clock: SharedValue<number>, amp: number) =>
  useAnimatedStyle(() => ({
    transform: [
      { rotate: `${interpolate(clock.value, [0, 1], [-amp, amp * 0.75])}deg` },
      { translateY: interpolate(clock.value, [0, 1], [0, -2]) },
    ],
  }));

export function GrassField() {
  const [box, setBox] = useState({ width: 0, height: 0 });

  const slow = useSharedValue(0);
  const fast = useSharedValue(0);

  const far = useSway(slow, SWAY[0]);
  const mid = useSway(slow, SWAY[1]);
  const near = useSway(fast, SWAY[2]);
  const fg = useSway(fast, SWAY[3]);
  const styles = [far, mid, near, fg];

  useEffect(() => {
    const spin = (clock: SharedValue<number>, duration: number) => {
      clock.value = withRepeat(
        withTiming(1, { duration, easing: Easing.inOut(Easing.sin), reduceMotion: ReduceMotion.System }),
        -1,
        true,
      );
    };

    const start = () => {
      spin(slow, SLOW_MS);
      spin(fast, FAST_MS);
    };

    start();

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        start();
        return;
      }
      cancelAnimation(slow);
      cancelAnimation(fast);
    });

    return () => {
      sub.remove();
      cancelAnimation(slow);
      cancelAnimation(fast);
    };
  }, [fast, slow]);

  const bands = useMemo(() => buildBands(box.width, box.height), [box.height, box.width]);

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setBox((current) => (current.width === width && current.height === height ? current : { width, height }));
  };

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} onLayout={onLayout} testID="grass-field">
      <View style={styles0.sky} />
      <View style={styles0.glowTop} />
      <View style={styles0.horizon} />

      {bands.map((band, index) => (
        <Animated.View
          key={band.key}
          style={[
            styles0.band,
            { bottom: band.box.bottom, height: band.box.height, opacity: band.opacity },
            styles[index],
          ]}
        >
          {band.groups.map((group, groupIndex) => (
            <View
              key={groupIndex}
              style={[styles0.half, { transform: [{ rotate: `${groupIndex === 0 ? -1.2 : 1.4}deg` }] }]}
            >
              {group.map((blade, bladeIndex) => (
                <View
                  key={bladeIndex}
                  testID="grass-blade"
                  style={[
                    styles0.blade,
                    {
                      left: `${blade.left}%`,
                      width: band.box.width,
                      height: blade.height,
                      backgroundColor: band.tone,
                      transform: [{ rotate: `${blade.base}deg` }],
                    },
                  ]}
                />
              ))}
            </View>
          ))}
        </Animated.View>
      ))}
    </View>
  );
}

const styles0 = StyleSheet.create({
  sky: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#070B16' },
  glowTop: {
    position: 'absolute',
    top: -90,
    left: -60,
    right: -60,
    height: 220,
    borderRadius: 999,
    backgroundColor: 'rgba(27,42,107,0.33)',
  },
  horizon: {
    position: 'absolute',
    left: -80,
    right: -80,
    bottom: '30%',
    height: 190,
    borderRadius: 999,
    backgroundColor: 'rgba(22,63,47,0.42)',
  },
  band: { position: 'absolute', left: '-5%', right: '-5%', transformOrigin: '50% 100%' },
  half: { flex: 1, transformOrigin: '50% 100%' },
  blade: {
    position: 'absolute',
    bottom: 0,
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
    transformOrigin: '50% 100%',
  },
});

export const GRASS_BLADE_COUNT = SPECS.reduce((total, spec) => total + spec.count, 0);
