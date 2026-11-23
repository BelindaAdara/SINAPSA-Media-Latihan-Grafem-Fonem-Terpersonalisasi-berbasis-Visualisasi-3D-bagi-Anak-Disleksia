import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { api } from '../api';
import { AVATARS } from '../config';
import { useChild } from '../context/ChildContext';
import { useChildPreferences } from '../hooks/useChildPreferences';
import { useTheme } from '../theme/ThemeContext';
import { Avatar, Card, Chip, ErrorState, PrimaryButton, Screen, SectionTitle, ThemeToggle, ThemedText } from '../components/ui';

export function ProfileScreen() {
  const { child, refreshChild } = useChild();
  const { colors, preference, setPreference } = useTheme();
  const preferences = useChildPreferences();
  const [name, setName] = useState(child.name);
  const [age, setAge] = useState(String(child.age));
  const [weeklyTarget, setWeeklyTarget] = useState(child.weekly_target);
  const [avatarKey, setAvatarKey] = useState(child.avatar_key);
  const [settings, setSettings] = useState(preferences);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  function changeSetting(key, value) {
    setSettings((current) => ({ ...current, [key]: value }));
    setSaved(false);
  }

  async function save() {
    const parsedAge = Number(age);
    const cleanName = name.trim();
    if (!cleanName || cleanName.length > 30 || !Number.isInteger(parsedAge) || parsedAge < 3 || parsedAge > 15) {
      setError(new Error('Periksa nama panggilan dan usia (3–15 tahun).'));
      return;
    }
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      await Promise.all([
        api.updateChild(child.id, { name: cleanName, age: parsedAge, weekly_target: weeklyTarget, avatar_key: avatarKey }),
        api.updateSettings(child.id, {
          font_scale: settings.fontScale,
          letter_spacing: settings.letterSpacing,
          speech_rate: settings.speechRate,
          choice_count: settings.choiceCount,
          session_length: settings.sessionLength,
        }),
      ]);
      await refreshChild();
      setSaved(true);
    } catch (requestError) {
      setError(requestError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <ThemedText variant="title">Profil & Pengaturan</ThemedText>
      <Card style={styles.profile}>
        <Avatar avatarKey={avatarKey} size={80} />
        <TextInput value={name} onChangeText={setName} maxLength={30} accessibilityLabel="Nama panggilan"
          style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bg }]} />
        <TextInput value={age} onChangeText={setAge} maxLength={2} keyboardType="number-pad" accessibilityLabel="Usia"
          style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bg }]} />
        <ThemedText variant="caption">Pilih avatar</ThemedText>
        <View style={styles.avatars}>
          {AVATARS.map((key) => <Chip key={key} title={key} selected={avatarKey === key} onPress={() => setAvatarKey(key)} />)}
        </View>
        <SectionTitle>Target mingguan</SectionTitle>
        <View style={styles.options}>
          {[3, 5, 7, 10, 14].map((value) => <Chip key={value} title={`${value} sesi`} selected={weeklyTarget === value} onPress={() => setWeeklyTarget(value)} />)}
        </View>
      </Card>
      <Card style={styles.settings}>
        <SectionTitle>Personalisasi latihan</SectionTitle>
        <SettingRow label="Ukuran teks" values={[0.9, 1, 1.15, 1.3, 1.5]} selected={settings.fontScale} onSelect={(value) => changeSetting('fontScale', value)} format={(value) => value === 1 ? 'A' : value < 1 ? 'A−' : 'A+'} />
        <SettingRow label="Jarak huruf" values={[0, 0.08, 0.16, 0.24, 0.3]} selected={settings.letterSpacing} onSelect={(value) => changeSetting('letterSpacing', value)} format={(value) => value === 0 ? 'Rapat' : value >= 0.2 ? 'Lebar' : 'Sedang'} />
        <SettingRow label="Kecepatan suara" values={[0.5, 0.7, 0.9, 1.1]} selected={settings.speechRate} onSelect={(value) => changeSetting('speechRate', value)} format={(value) => `${value}×`} />
        <SettingRow label="Pilihan per soal" values={[2, 3, 4]} selected={settings.choiceCount} onSelect={(value) => changeSetting('choiceCount', value)} format={(value) => String(value)} />
        <SettingRow label="Panjang sesi" values={[5, 10, 15, 20]} selected={settings.sessionLength} onSelect={(value) => changeSetting('sessionLength', value)} format={(value) => `${value}`} />
        <ThemedText variant="caption" style={{ color: colors.textSecondary }}>Pengaturan memengaruhi ukuran teks, pilihan latihan, panjang sesi, dan suara.</ThemedText>
      </Card>
      <Card>
        <SectionTitle>Tampilan</SectionTitle>
        <ThemeToggle preference={preference} onChange={setPreference} />
      </Card>
      <Card style={styles.about}>
        <SectionTitle>Tentang SINAPSA</SectionTitle>
        <ThemedText>SINAPSA membantu anak berlatih mengenali bunyi dan bentuk huruf melalui sesi singkat yang adaptif.</ThemedText>
        <ThemedText variant="caption" style={{ color: colors.textSecondary }}>Suara menggunakan text-to-speech perangkat. Viewer huruf 3D dibuat prosedural dari data goresan; jika perangkat tidak mendukung WebGL, tampilan beralih ke 2D.</ThemedText>
      </Card>
      {error ? <ErrorState error={error} onRetry={save} /> : null}
      {saved ? <ThemedText style={styles.center}>Perubahan tersimpan.</ThemedText> : null}
      <PrimaryButton title={busy ? 'Menyimpan...' : 'Simpan profil'} onPress={save} disabled={busy} />
    </Screen>
  );
}

function SettingRow({ label, values, selected, onSelect, format }) {
  return (
    <View style={styles.settingRow}>
      <ThemedText>{label}</ThemedText>
      <View style={styles.options}>
        {values.map((value) => (
          <Chip key={value} title={format(value)} selected={selected === value} onPress={() => onSelect(value)} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  profile: { alignItems: 'center', gap: 12 },
  input: { width: '100%', minHeight: 50, borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, fontSize: 18 },
  avatars: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  settings: { gap: 16 },
  settingRow: { gap: 8 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  about: { gap: 10 },
  center: { textAlign: 'center' },
});
