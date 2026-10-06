import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PartnerPicker } from '@/features/party/ui/PartnerPicker';
import { useStore } from '@/store';
import { colors, font, spacing } from '@/theme/tokens';

export default function PlayScreen() {
  const party = useStore((state) => state.party);
  const choosePartner = useStore((state) => state.choosePartner);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const onSelect = useCallback((id: number) => setSelectedId(id), []);
  const onConfirm = useCallback(() => {
    if (selectedId !== null) choosePartner(selectedId);
  }, [choosePartner, selectedId]);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {party.length === 0 ? (
        <PartnerPicker selectedId={selectedId} onSelect={onSelect} onConfirm={onConfirm} />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.eyebrow}>STEP 2 OF 2</Text>
          <Text style={styles.title}>The tall grass is waiting</Text>
          <Text style={styles.note}>World map lands here next.</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  placeholder: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.xl, gap: spacing.sm },
  eyebrow: { color: colors.accent, fontFamily: font.mono, fontSize: 10, letterSpacing: 2.4 },
  title: { color: colors.text, fontSize: 24, fontWeight: '800' },
  note: { color: colors.textDim, fontSize: 13 },
});
