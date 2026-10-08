import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Sprite } from '@/shared/components/Sprite';
import { titleCase } from '@/shared/lib/format';
import { colors, font, spacing } from '@/theme/tokens';

export const EVOLUTION_DURATION = 1400;

interface EvolutionMomentProps {
  fromId: number;
  fromName: string;
  toId: number;
  toName: string;
  onDone: () => void;
}

export function EvolutionMoment({ fromId, fromName, toId, toName, onDone }: EvolutionMomentProps) {
  const progress = useSharedValue(0);
  const [settled, setSettled] = useState(false);

  const finish = useCallback(() => {
    setSettled(true);
    onDone();
  }, [onDone]);

  useEffect(() => {
    progress.value = withTiming(1, { duration: EVOLUTION_DURATION });
    const timer = setTimeout(finish, EVOLUTION_DURATION + 120);
    return () => clearTimeout(timer);
  }, [finish, progress]);

  const leaving = useAnimatedStyle(() => {
    const fade = Math.min(1, progress.value * 2);
    return { opacity: 1 - fade, transform: [{ scale: 1 - fade * 0.35 }] };
  });

  const arriving = useAnimatedStyle(() => {
    const grow = Math.max(0, (progress.value - 0.5) * 2);
    return { opacity: grow, transform: [{ scale: 0.7 + grow * 0.3 }] };
  });

  return (
    <View style={styles.wrap} accessibilityLabel={`${titleCase(fromName)} is evolving into ${titleCase(toName)}`}>
      <View style={styles.sprites}>
        <Animated.View style={[styles.slot, settled ? styles.hidden : leaving]}>
          <Sprite id={fromId} size={64} />
        </Animated.View>
        <Animated.View style={[styles.slot, styles.arrival, settled ? styles.visible : arriving]}>
          <Sprite id={toId} size={64} />
        </Animated.View>
      </View>
      <Text style={styles.line}>
        {settled
          ? `${titleCase(fromName)} became ${titleCase(toName)}!`
          : `${titleCase(fromName)} is evolving…`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md },
  sprites: { width: 96, height: 72, alignItems: 'center', justifyContent: 'center' },
  slot: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  arrival: { opacity: 0 },
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  line: { color: colors.accent, fontFamily: font.mono, fontSize: 11.5, letterSpacing: 0.6, textAlign: 'center' },
});
