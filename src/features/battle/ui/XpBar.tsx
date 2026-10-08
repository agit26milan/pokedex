import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, font } from '@/theme/tokens';

interface XpBarProps {
  xp: number;
  maxXp: number;
  showNumbers?: boolean;
}

export const XpBar = memo(function XpBar({ xp, maxXp, showNumbers = false }: XpBarProps) {
  const ratio = maxXp > 0 ? Math.max(0, Math.min(1, xp / maxXp)) : 0;
  const color = colors.accentDeep
  return (
    <View style={styles.wrapper}>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${ratio * 100}%`, backgroundColor: color }]} />
      </View>
      {showNumbers ? (
        <Text style={styles.numbers}>
          {Math.max(0, xp)} / {maxXp}
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
