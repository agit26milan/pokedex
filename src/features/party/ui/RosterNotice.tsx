import { StyleSheet, Text, View } from 'react-native';

import { font, radius, spacing } from '@/theme/tokens';

export type NoticeTone = 'good' | 'warn' | 'info';

interface RosterNoticeProps {
  text: string;
  tone?: NoticeTone;
  testID?: string;
}

export function RosterNotice({ text, tone = 'good', testID }: RosterNoticeProps) {
  return (
    <View
      testID={testID}
      accessibilityRole="alert"
      style={[styles.box, tone === 'warn' && styles.warnBox, tone === 'info' && styles.infoBox]}
    >
      <View style={[styles.dot, tone === 'warn' && styles.warnDot, tone === 'info' && styles.infoDot]} />
      <Text style={[styles.text, tone === 'warn' && styles.warnText, tone === 'info' && styles.infoText]}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: 'rgba(124,255,107,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(124,255,107,0.40)',
  },
  warnBox: { backgroundColor: 'rgba(255,176,32,0.12)', borderColor: 'rgba(255,176,32,0.45)' },
  infoBox: { backgroundColor: 'rgba(79,209,255,0.12)', borderColor: 'rgba(79,209,255,0.45)' },
  dot: { width: 6, height: 6, borderRadius: 99, backgroundColor: '#7CFF6B' },
  warnDot: { backgroundColor: '#FFB020' },
  infoDot: { backgroundColor: '#4FD1FF' },
  text: { flex: 1, color: '#CFFFC6', fontFamily: font.mono, fontSize: 9.5, letterSpacing: 0.5, lineHeight: 14 },
  warnText: { color: '#FFE0B0' },
  infoText: { color: '#C6ECFF' },
});
