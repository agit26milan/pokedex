import { StyleSheet, TextInput, View } from 'react-native';

import { colors, font, radius, spacing } from '@/theme/tokens';

interface SearchBarProps {
  value: string;
  onChangeText: (value: string) => void;
}

export function SearchBar({ value, onChangeText }: SearchBarProps) {
  return (
    <View style={styles.wrapper}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Search name or dex number…"
        placeholderTextColor={colors.textFaint}
        style={styles.input}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        clearButtonMode="while-editing"
        accessibilityLabel="Search Pokémon"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  input: { color: colors.text, fontSize: 13, fontFamily: font.mono },
});
