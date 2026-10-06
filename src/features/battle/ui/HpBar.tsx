import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, font } from '@/theme/tokens';

interface HpBarProps {
  hp: number;
  maxHp: number;
  showNumbers?: boolean;
}

export const HpBar = memo(function HpBar({ hp, maxHp, showNumbers = false }: HpBarProps) {
  const ratio = maxHp > 0 ? Math.max(0, Math.min(1, hp / maxHp)) : 0;
  const color = ratio > 0.5 ? colors.accent : ratio > 0.2 ? colors.warn : colors.danger;

  return (
    <View style={styles.wrapper}>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${ratio * 100}%`, backgroundColor: color }]} />
      </View>
      {showNumbers ? (
        <Text style={styles.numbers}>
          {Math.max(0, hp)} / {maxHp}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: { gap: 4 },
  track: { height: 7, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.10)', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 99 },
  numbers: { color: colors.textDim, fontFamily: font.mono, fontSize: 9.5, textAlign: 'right' },
});
