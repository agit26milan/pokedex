import { useCallback, useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, font, radius, spacing } from '@/theme/tokens';
import type { Direction } from '../logic/world';

const REPEAT_MS = 220;
const SPRINT_MS = 110;

interface DpadProps {
  onStep: (direction: Direction) => void;
  sprint: boolean;
  onToggleSprint: () => void;
}

/**
 * Grid movement is discrete, so a hold-to-repeat D-pad beats a fake analog stick: fewer
 * moving parts, keyboard/screen-reader friendly, and no drag-vs-tap ambiguity.
 */
export function Dpad({ onStep, sprint, onToggleSprint }: DpadProps) {
  return (
    <View style={styles.controls}>
      <View style={styles.pad}>
        <DirButton direction="up" style={styles.up} onStep={onStep} sprint={sprint} label="Walk up" />
        <DirButton direction="left" style={styles.left} onStep={onStep} sprint={sprint} label="Walk left" />
        <View style={styles.center} />
        <DirButton direction="right" style={styles.right} onStep={onStep} sprint={sprint} label="Walk right" />
        <DirButton direction="down" style={styles.down} onStep={onStep} sprint={sprint} label="Walk down" />
      </View>

      <View style={styles.side}>
        <Pressable
          onPress={onToggleSprint}
          style={[styles.sprint, sprint && styles.sprintOn]}
          accessibilityRole="switch"
          accessibilityState={{ checked: sprint }}
          accessibilityLabel="Sprint"
        >
          <Text style={[styles.sprintLabel, sprint && styles.sprintLabelOn]}>SPRINT ×2</Text>
        </Pressable>
        <Text style={styles.hint}>TAP A GLOWING TILE{'\n'}OR HOLD AN ARROW</Text>
      </View>
    </View>
  );
}

const GLYPH: Record<Direction, string> = { up: '▲', down: '▼', left: '◀', right: '▶' };

function DirButton({
  direction,
  style,
  onStep,
  sprint,
  label,
}: {
  direction: Direction;
  style: object;
  onStep: (direction: Direction) => void;
  sprint: boolean;
  label: string;
}) {
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  }, []);

  useEffect(() => stop, [stop]);

  const start = useCallback(() => {
    stop();
    onStep(direction);
    timer.current = setInterval(() => onStep(direction), sprint ? SPRINT_MS : REPEAT_MS);
  }, [direction, onStep, sprint, stop]);

  return (
    <Pressable
      onPressIn={start}
      onPressOut={stop}
      style={[styles.key, style]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={styles.keyGlyph}>{GLYPH[direction]}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  controls: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, paddingHorizontal: spacing.lg },
  pad: { width: 138, height: 138, alignItems: 'center', justifyContent: 'center' },
  key: {
    position: 'absolute',
    width: 46,
    height: 46,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  up: { top: 0 },
  down: { bottom: 0 },
  left: { left: 0 },
  right: { right: 0 },
  center: { width: 10, height: 10, borderRadius: 99, backgroundColor: `${colors.accent}44` },
  keyGlyph: { color: colors.text, fontSize: 14 },
  side: { flex: 1, gap: spacing.sm },
  sprint: {
    paddingVertical: 14,
    borderRadius: radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: `${colors.info}55`,
    backgroundColor: `${colors.info}14`,
  },
  sprintOn: { backgroundColor: `${colors.info}33`, borderColor: colors.info },
  sprintLabel: { color: colors.info, fontFamily: font.mono, fontSize: 11, fontWeight: '800', letterSpacing: 1.4 },
  sprintLabelOn: { color: colors.text },
  hint: { color: colors.textFaint, fontFamily: font.mono, fontSize: 9, lineHeight: 15, letterSpacing: 1 },
});
