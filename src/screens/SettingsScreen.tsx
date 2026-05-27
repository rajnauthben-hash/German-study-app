import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { getSettings, saveSettings } from '../services/settingsService';
import { resetAllData } from '../services/storageService';
import { checkApiHealth } from '../services/apiClient';
import { UserSettings } from '../types';
import AppHeader from '../components/AppHeader';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const [settings, setSettings] = useState<UserSettings>({
    userName: 'Student',
    germanLevel: 'A2',
    dailyGoalMinutes: 15,
    preferredPracticeMode: 'flashcards',
    apiBaseUrl: 'http://localhost:3000',
    theme: 'light',
  });
  const [apiStatus, setApiStatus] = useState<'unknown' | 'ok' | 'error'>('unknown');
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    const s = await getSettings();
    setSettings(s);
  };

  const handleSave = async () => {
    setSaving(true);
    await saveSettings(settings);
    setSaving(false);
    Alert.alert('Saved', 'Settings saved successfully.');
  };

  const handleCheckApi = async () => {
    setApiStatus('unknown');
    const ok = await checkApiHealth(settings.apiBaseUrl);
    setApiStatus(ok ? 'ok' : 'error');
  };

  const handleResetData = () => {
    Alert.alert(
      'Reset All Data',
      'This will delete all study sets, progress, and history. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await resetAllData();
            Alert.alert('Done', 'All data has been reset.');
          },
        },
      ]
    );
  };

  const levels: UserSettings['germanLevel'][] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  return (
    <SafeAreaView style={styles.safe}>
      <AppHeader title="Settings" showBack />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Profile */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile</Text>
          <Text style={styles.label}>Your Name</Text>
          <TextInput
            style={styles.input}
            value={settings.userName}
            onChangeText={v => setSettings(s => ({ ...s, userName: v }))}
            placeholder="Your name"
          />
          <Text style={styles.label}>German Level</Text>
          <View style={styles.levelRow}>
            {levels.map(level => (
              <TouchableOpacity
                key={level}
                style={[styles.levelChip, settings.germanLevel === level && styles.levelChipActive]}
                onPress={() => setSettings(s => ({ ...s, germanLevel: level }))}
              >
                <Text style={[styles.levelChipText, settings.germanLevel === level && styles.levelChipTextActive]}>{level}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* API */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Backend API</Text>
          <Text style={styles.label}>Server URL</Text>
          <TextInput
            style={styles.input}
            value={settings.apiBaseUrl}
            onChangeText={v => setSettings(s => ({ ...s, apiBaseUrl: v }))}
            placeholder="http://localhost:3000"
            autoCapitalize="none"
            keyboardType="url"
          />
          <View style={styles.apiStatusRow}>
            <TouchableOpacity style={styles.checkBtn} onPress={handleCheckApi}>
              <Text style={styles.checkBtnText}>Check Connection</Text>
            </TouchableOpacity>
            {apiStatus === 'ok' && <Text style={styles.statusOk}>Connected</Text>}
            {apiStatus === 'error' && <Text style={styles.statusErr}>Not reachable</Text>}
          </View>
          <Text style={styles.hint}>
            Run the web backend with: cd web && node server.js{'\n'}
            Add GROQ_API_KEY to web/.env for AI generation.
          </Text>
        </View>

        {/* Daily Goal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Goal</Text>
          <Text style={styles.label}>Minutes per day: {settings.dailyGoalMinutes}</Text>
          <View style={styles.goalRow}>
            {[5, 10, 15, 20, 30].map(mins => (
              <TouchableOpacity
                key={mins}
                style={[styles.goalChip, settings.dailyGoalMinutes === mins && styles.goalChipActive]}
                onPress={() => setSettings(s => ({ ...s, dailyGoalMinutes: mins }))}
              >
                <Text style={[styles.goalChipText, settings.dailyGoalMinutes === mins && styles.goalChipTextActive]}>{mins}m</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Save */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Settings'}</Text>
        </TouchableOpacity>

        {/* Danger Zone */}
        <View style={[styles.section, styles.dangerSection]}>
          <Text style={[styles.sectionTitle, { color: Colors.error }]}>Developer</Text>
          <TouchableOpacity style={styles.dangerBtn} onPress={handleResetData}>
            <Text style={styles.dangerBtnText}>Reset All Data</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1, paddingHorizontal: Spacing.lg },
  section: { backgroundColor: Colors.card, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.md, ...Shadows.small },
  sectionTitle: { fontSize: Typography.fontSizeMD, fontWeight: Typography.fontWeightBold, color: Colors.text, marginBottom: Spacing.md },
  label: { fontSize: Typography.fontSizeSM, fontWeight: Typography.fontWeightSemiBold, color: Colors.textSecondary, marginBottom: Spacing.sm },
  input: { backgroundColor: Colors.background, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, fontSize: Typography.fontSizeMD, color: Colors.text, marginBottom: Spacing.md },
  levelRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  levelChip: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, borderWidth: 1.5, borderColor: Colors.border },
  levelChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  levelChipText: { fontSize: Typography.fontSizeSM, fontWeight: Typography.fontWeightSemiBold, color: Colors.textSecondary },
  levelChipTextActive: { color: '#fff' },
  apiStatusRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.sm },
  checkBtn: { backgroundColor: Colors.primaryLight, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
  checkBtnText: { color: Colors.primary, fontWeight: Typography.fontWeightSemiBold, fontSize: Typography.fontSizeSM },
  statusOk: { fontSize: Typography.fontSizeSM, color: Colors.success, fontWeight: Typography.fontWeightSemiBold },
  statusErr: { fontSize: Typography.fontSizeSM, color: Colors.error, fontWeight: Typography.fontWeightSemiBold },
  hint: { fontSize: Typography.fontSizeXS, color: Colors.textLight, lineHeight: 18 },
  goalRow: { flexDirection: 'row', gap: Spacing.sm },
  goalChip: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, borderWidth: 1.5, borderColor: Colors.border },
  goalChipActive: { backgroundColor: Colors.success, borderColor: Colors.success },
  goalChipText: { fontSize: Typography.fontSizeSM, fontWeight: Typography.fontWeightSemiBold, color: Colors.textSecondary },
  goalChipTextActive: { color: '#fff' },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.full, padding: Spacing.lg, alignItems: 'center', marginBottom: Spacing.lg, ...Shadows.medium },
  saveBtnText: { color: '#fff', fontSize: Typography.fontSizeLG, fontWeight: Typography.fontWeightBold },
  dangerSection: { borderWidth: 1.5, borderColor: Colors.errorLight },
  dangerBtn: { backgroundColor: Colors.errorLight, borderRadius: BorderRadius.md, padding: Spacing.md, alignItems: 'center' },
  dangerBtnText: { color: Colors.error, fontWeight: Typography.fontWeightBold, fontSize: Typography.fontSizeMD },
});
