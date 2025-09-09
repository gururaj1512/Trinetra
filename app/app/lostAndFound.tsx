import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
export default function LostAndFoundScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lost and Found</Text>
      {/* Lost and found content here */}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#FFA500' },
});
