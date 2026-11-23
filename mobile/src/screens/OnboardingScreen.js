import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { api } from '../api';
import { useChild } from '../context/ChildContext';
import { AVATARS } from '../config';
import { useTheme } from '../theme/ThemeContext';
import { Avatar, Card, ErrorState, PrimaryButton, Screen, ThemedText } from '../components/ui';

export function OnboardingScreen() {
  const { colors } = useTheme();
  const { saveChild } = useChild();
  const [name, setName] = useState('');
  const [age, setAge] = useState('7');
  const [avatarKey, setAvatarKey] = useState('bintang');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function submit() {
    const cleanName = name.trim();
    const parsedAge = Number(age);
    if (cleanName.length < 1 || cleanName.length > 30 || !Number.isInteger(parsedAge) || parsedAge < 3 || parsedAge > 15) {
      setError(new Error('Isi nama panggilan 1–30 huruf dan usia 3–15 tahun ya.'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const child = await api.createChild({ name: cleanName, age: parsedAge, avatar_key: avatarKey });
      await saveChild(child);
    } catch (requestError) {
      setError(requestError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.hero}>
        <Avatar avatarKey={avatarKey} size={96} />
        <ThemedText variant="title" style={styles.center}>Hai, teman belajar!</ThemedText>
        <ThemedText style={styles.center}>Siapa nama panggilanmu?</ThemedText>
      </View>
      <Card style={styles.form}>
        <ThemedText variant="subtitle">Kenalan dulu, yuk</ThemedText>
        <ThemedText>Nama panggilan</ThemedText>
        <TextInput
          accessibilityLabel="Nama panggilan"
          value={name}
          onChangeText={setName}
          maxLength={30}
          placeholder="Tulis nama panggilan"
          placeholderTextColor={colors.textSecondary}
          style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bg }]}
        />
        <ThemedText>Usia</ThemedText>
        <TextInput
          accessibilityLabel="Usia"
          value={age}
          onChangeText={setAge}
          keyboardType="number-pad"
          maxLength={2}
          style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bg }]}
        />
        <ThemedText>Pilih teman kecilmu</ThemedText>
        <View style={styles.avatars}>
          {AVATARS.map((key) => (
            <Pressable key={key} accessibilityRole="button" accessibilityLabel={`Avatar ${key}`} onPress={() => setAvatarKey(key)}>
              <View style={[styles.avatarOption, avatarKey === key && { borderColor: colors.accent }]}>
                <Avatar avatarKey={key} size={48} />
              </View>
            </Pressable>
          ))}
        </View>
        {error ? <ErrorState error={error} onRetry={() => setError(null)} /> : null}
        <PrimaryButton title={busy ? 'Sebentar ya...' : 'Ayo mulai'} onPress={submit} disabled={busy} />
        <ThemedText variant="caption" style={[styles.center, { color: colors.textSecondary }]}>
          Data yang disimpan hanya nama panggilan, usia, dan latihan.
        </ThemedText>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'center', paddingTop: 32 },
  hero: { alignItems: 'center', gap: 8, marginBottom: 8 },
  center: { textAlign: 'center' },
  form: { gap: 12 },
  input: { borderWidth: 1, borderRadius: 16, minHeight: 52, paddingHorizontal: 14, fontSize: 18 },
  avatars: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 },
  avatarOption: { borderWidth: 3, borderColor: 'transparent', borderRadius: 18, padding: 3 },
});
