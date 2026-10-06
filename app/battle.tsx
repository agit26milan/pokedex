import { StyleSheet, Text, View } from 'react-native';

import { colors, font } from '@/theme/tokens';

export default function BattleScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>BATTLE ENGINE MOUNTS HERE</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.inkDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { color: colors.textDim, fontFamily: font.mono, fontSize: 12, letterSpacing: 2 },
});
