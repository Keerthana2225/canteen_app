import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  TextInput, Animated, Alert, Platform, Modal,
  KeyboardAvoidingView, StatusBar, SafeAreaView, ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as IntentLauncher from 'expo-intent-launcher';

// ── Constants ─────────────────────────────────────────────────
const STORAGE_KEY = '@canteen_server_url';
const DEFAULT_PORT = '8000';
const API_URL      = 'http://172.19.165.219:8000'; // your PC's Wi-Fi IP

// Hardcoded credentials (no backend auth needed)
const USERS = {
  admin: { password: 'admin@123', role: 'admin' },
  user:  { password: 'user@123',  role: 'user'  },
};

const MEAL_TYPES = [
  { label: 'Breakfast', emoji: '🌅' },
  { label: 'Lunch',     emoji: '☀️' },
  { label: 'Dinner',    emoji: '🌙' },
];

const RATING_FIELDS = [
  { key: 'food_quality',   label: 'Food Quality',   emoji: '🍱' },
  { key: 'food_taste',     label: 'Food Taste',     emoji: '😋' },
  { key: 'cleanliness',    label: 'Cleanliness',    emoji: '✨' },
  { key: 'staff_behavior', label: 'Staff Behavior', emoji: '👨‍🍳' },
  { key: 'food_hygiene',   label: 'Food Hygiene',   emoji: '🧼' },
];

const MOOD = {
  0: { face: '😶', color: '#A0AEC0', label: '' },
  1: { face: '😢', color: '#E53E3E', label: 'Poor' },
  2: { face: '😕', color: '#ED8936', label: 'Fair' },
  3: { face: '😐', color: '#ECC94B', label: 'Good' },
  4: { face: '😊', color: '#48BB78', label: 'Great' },
  5: { face: '🤩', color: '#38A169', label: 'Excellent!' },
};

const OVERALL_FACE = ['🤔', '😢', '😕', '😐', '😊', '🤩'];

const INITIAL_RATINGS = {
  food_quality: 0, food_taste: 0,
  cleanliness: 0, staff_behavior: 0, food_hygiene: 0,
};

// ── Login Screen ──────────────────────────────────────────────
function LoginScreen({ onLogin, apiUrl, onSaveUrl }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [shakeAnim] = useState(new Animated.Value(0));
  const [showSettings, setShowSettings] = useState(false);
  const [ipInput, setIpInput] = useState('');

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6,   duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,   duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleLogin = () => {
    const u = username.trim().toLowerCase();
    const p = password;
    const found = USERS[u];
    if (found && found.password === p) {
      onLogin(u, found.role);
    } else {
      shake();
      Alert.alert('❌ Invalid Credentials', 'Please check your username and password.');
    }
  };

  const openSettings = () => {
    const match = apiUrl ? apiUrl.match(/http:\/\/([^:]+):(\d+)/) : null;
    setIpInput(match ? match[1] : '');
    setShowSettings(true);
  };

  const saveSettings = () => {
    const ip = ipInput.trim();
    if (!ip) { Alert.alert('\u26a0\ufe0f Invalid IP', 'Please enter a valid IP address.'); return; }
    const newUrl = `http://${ip}:8000`;
    if (onSaveUrl) onSaveUrl(newUrl);
    setShowSettings(false);
    Alert.alert('\u2705 Server Saved', `Server set to:\n${newUrl}\n\nRestart the app if already logged in.`);
  };

  return (
    <SafeAreaView style={ls.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0D47A1" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={ls.scroll} keyboardShouldPersistTaps="handled">

          {/* Logo area */}
          <View style={ls.logoArea}>
            <View style={ls.logoCircle}>
              <Text style={ls.logoEmoji}>🍽️</Text>
            </View>
            <Text style={ls.appName}>Canteen Feedback</Text>
            <Text style={ls.appSub}>Brakes India Pvt Ltd — TSF</Text>
          </View>

          {/* Card */}
          <Animated.View style={[ls.card, { transform: [{ translateX: shakeAnim }] }]}>
            <Text style={ls.cardTitle}>Welcome Back</Text>
            <Text style={ls.cardSub}>Sign in to continue</Text>

            {/* Username */}
            <View style={ls.fieldWrap}>
              <Text style={ls.fieldLabel}>Username</Text>
              <View style={ls.inputRow}>
                <Text style={ls.inputIcon}>👤</Text>
                <TextInput
                  style={ls.input}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Enter username"
                  placeholderTextColor="#A0AEC0"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Password */}
            <View style={ls.fieldWrap}>
              <Text style={ls.fieldLabel}>Password</Text>
              <View style={ls.inputRow}>
                <Text style={ls.inputIcon}>🔒</Text>
                <TextInput
                  style={[ls.input, { flex: 1 }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter password"
                  placeholderTextColor="#A0AEC0"
                  secureTextEntry={!showPass}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity onPress={() => setShowPass(p => !p)} style={ls.eyeBtn}>
                  <Text style={{ fontSize: 18 }}>{showPass ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Login Button */}
            <TouchableOpacity style={ls.loginBtn} onPress={handleLogin} activeOpacity={0.85}>
              <Text style={ls.loginBtnText}>Sign In →</Text>
            </TouchableOpacity>


          </Animated.View>

          {/* Settings button */}
          <TouchableOpacity onPress={openSettings} style={ls.settingsBtn}>
            <Text style={ls.settingsBtnText}>⚙️  Configure Server IP</Text>
          </TouchableOpacity>

          <Text style={ls.footer}>🔒 Secure internal system — Brakes India</Text>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Server Settings Modal ── */}
      <Modal
        visible={showSettings}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSettings(false)}
      >
        <View style={ls.modalOverlay}>
          <View style={ls.modalBox}>
            <Text style={ls.modalTitle}>⚙️ Server Settings</Text>
            <Text style={ls.modalSub}>Enter your PC's Wi-Fi IP address</Text>

            <Text style={ls.modalLabel}>Current server</Text>
            <Text style={ls.modalCurrent}>{apiUrl || 'Not set'}</Text>

            <Text style={ls.modalLabel}>New IP Address</Text>
            <View style={ls.modalInputRow}>
              <Text style={ls.modalPrefix}>http://</Text>
              <TextInput
                style={ls.modalInput}
                value={ipInput}
                onChangeText={setIpInput}
                placeholder="172.19.165.219"
                placeholderTextColor="#A0AEC0"
                keyboardType="numeric"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={saveSettings}
              />
              <Text style={ls.modalSuffix}>:8000</Text>
            </View>

            <View style={ls.modalHintBox}>
              <Text style={ls.modalHint}>💡 On your PC, open PowerShell and run:</Text>
              <Text style={ls.modalHintCode}>ipconfig</Text>
              <Text style={ls.modalHint}>Look for "Wireless LAN" → IPv4 Address</Text>
            </View>

            <TouchableOpacity style={ls.modalSaveBtn} onPress={saveSettings} activeOpacity={0.85}>
              <Text style={ls.modalSaveBtnText}>💾  Save & Connect</Text>
            </TouchableOpacity>
            <TouchableOpacity style={ls.modalCancelBtn} onPress={() => setShowSettings(false)}>
              <Text style={ls.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const ls = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: '#0D47A1' },
  scroll:     { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logoArea:   { alignItems: 'center', marginBottom: 32, gap: 8 },
  logoCircle: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
  },
  logoEmoji:  { fontSize: 42 },
  appName:    { fontSize: 26, fontWeight: '800', color: '#FFFFFF' },
  appSub:     { fontSize: 13, color: '#90CAF9', fontWeight: '500' },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 24,
    padding: 28, gap: 16,
    elevation: 12, shadowColor: '#000',
    shadowOpacity: 0.15, shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
  },
  cardTitle:  { fontSize: 22, fontWeight: '800', color: '#0D47A1' },
  cardSub:    { fontSize: 14, color: '#718096', marginTop: -8 },
  fieldWrap:  { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: '#4A5568' },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F7FAFC', borderRadius: 12,
    borderWidth: 1.5, borderColor: '#E2E8F0', paddingHorizontal: 14,
  },
  inputIcon:  { fontSize: 18, marginRight: 10 },
  input: {
    flex: 1, paddingVertical: 14, fontSize: 16,
    color: '#1A202C', fontWeight: '500',
  },
  eyeBtn:     { padding: 4 },
  loginBtn: {
    backgroundColor: '#1565C0', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
    elevation: 4, shadowColor: '#1565C0',
    shadowOpacity: 0.4, shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    marginTop: 4,
  },
  loginBtnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800', letterSpacing: 0.5 },

  footer:     { textAlign: 'center', fontSize: 11, color: '#90CAF9', marginTop: 24 },
  settingsBtn: { alignItems: 'center', marginTop: 8, paddingVertical: 6 },
  settingsBtnText: { color: '#90CAF9', fontSize: 13, textDecorationLine: 'underline' },
  // Modal styles
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 28, paddingBottom: 40, gap: 12,
    elevation: 20, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 20,
  },
  modalTitle:   { fontSize: 22, fontWeight: '800', color: '#0D47A1' },
  modalSub:     { fontSize: 14, color: '#718096', marginTop: -6 },
  modalLabel:   { fontSize: 12, fontWeight: '700', color: '#4A5568', letterSpacing: 0.5 },
  modalCurrent: { fontSize: 13, color: '#1565C0', fontWeight: '600', backgroundColor: '#EBF8FF', padding: 10, borderRadius: 10 },
  modalInputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F7FAFC', borderRadius: 12,
    borderWidth: 1.5, borderColor: '#BEE3F8', paddingHorizontal: 12,
  },
  modalPrefix:  { fontSize: 14, color: '#718096', fontWeight: '600' },
  modalInput:   { flex: 1, paddingVertical: 14, fontSize: 16, color: '#1A202C', fontWeight: '600' },
  modalSuffix:  { fontSize: 14, color: '#718096', fontWeight: '600' },
  modalHintBox: { backgroundColor: '#FFFFF0', borderRadius: 12, padding: 12, gap: 4, borderLeftWidth: 3, borderLeftColor: '#ECC94B' },
  modalHint:    { fontSize: 12, color: '#744210' },
  modalHintCode:{ fontSize: 13, fontWeight: '800', color: '#744210', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  modalSaveBtn: {
    backgroundColor: '#1565C0', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
    elevation: 4, shadowColor: '#1565C0', shadowOpacity: 0.4, shadowRadius: 8,
    marginTop: 4,
  },
  modalSaveBtnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  modalCancelBtn:   { alignItems: 'center', paddingVertical: 10 },
  modalCancelText:  { color: '#A0AEC0', fontSize: 14 },
});

// ── Mobile Admin Dashboard ─────────────────────────────────────
function AdminDashboard({ apiUrl, onLogout }) {
  const [summary,  setSummary]  = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [exporting, setExporting] = useState(false);
  const [tab,      setTab]      = useState('summary'); // 'summary' | 'records'

  const CATS = [
    { key: 'avg_food_quality',   label: 'Food Quality',   emoji: '🍱', color: '#1565C0' },
    { key: 'avg_food_taste',     label: 'Food Taste',     emoji: '😋', color: '#7B1FA2' },
    { key: 'avg_cleanliness',    label: 'Cleanliness',    emoji: '✨', color: '#00695C' },
    { key: 'avg_staff_behavior', label: 'Staff Behavior', emoji: '👨‍🍳', color: '#E65100' },
    { key: 'avg_food_hygiene',   label: 'Food Hygiene',   emoji: '🧼', color: '#1976D2' },
  ];

  const moodOf = v =>
    v >= 4.5 ? '🤩' : v >= 4 ? '😊' : v >= 3 ? '😐' : v >= 2 ? '😕' : v > 0 ? '😢' : '—';

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [s, f] = await Promise.all([
        fetch(`${apiUrl}/feedback/summary`).then(r => r.json()),
        fetch(`${apiUrl}/feedback/all`).then(r => r.json()),
      ]);
      setSummary(s);
      setFeedback(Array.isArray(f) ? f : []);
    } catch (e) {
      Alert.alert('❌ Error', 'Cannot reach server.\n' + apiUrl);
    }
    setLoading(false);
  }, [apiUrl]);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const url = `${apiUrl}/feedback/export`;
      const filename = `canteen_feedback_${new Date().toISOString().slice(0, 10)}.xlsx`;
      const fileUri = FileSystem.documentDirectory + filename;

      // Download the file first
      const downloadResult = await FileSystem.downloadAsync(url, fileUri);
      if (downloadResult.status !== 200) throw new Error('Download failed');

      if (Platform.OS === 'android') {
        // Android: get a content:// URI and open with "Open with" dialog
        const contentUri = await FileSystem.getContentUriAsync(fileUri);
        await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
          data: contentUri,
          flags: 1,           // FLAG_GRANT_READ_URI_PERMISSION
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
      } else {
        // iOS: use share sheet
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          dialogTitle: 'Open Excel Report',
          UTI: 'com.microsoft.excel.xlsx',
        });
      }
    } catch (e) {
      // Fallback to share sheet if intent fails
      try {
        const filename = `canteen_feedback_${new Date().toISOString().slice(0, 10)}.xlsx`;
        const fileUri = FileSystem.documentDirectory + filename;
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            dialogTitle: 'Open or Save Excel Report',
          });
        }
      } catch (_) {
        Alert.alert('❌ Export Failed', 'Cannot open the file.\nMake sure Excel or Google Sheets is installed.');
      }
    }
    setExporting(false);
  }, [apiUrl]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const overall = summary
    ? (CATS.map(c => summary[c.key] || 0).reduce((a, b) => a + b, 0) / CATS.length)
    : 0;

  const MEAL_COLORS = {
    Breakfast: { bg: '#E3F2FD', color: '#1565C0', emoji: '🌅' },
    Lunch:     { bg: '#E8F5E9', color: '#2E7D32', emoji: '☀️' },
    Dinner:    { bg: '#EDE7F6', color: '#4527A0', emoji: '🌙' },
  };

  return (
    <SafeAreaView style={ad.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0D47A1" />

      {/* Header */}
      <View style={ad.header}>
        <View style={{ flex: 1 }}>
          <Text style={ad.headerTitle}>📊 Admin Dashboard</Text>
          <Text style={ad.headerSub}>Canteen Analytics — Brakes India</Text>
        </View>
        <TouchableOpacity
          style={ad.exportBtn}
          onPress={handleExport}
          disabled={exporting}
          activeOpacity={0.85}
        >
          <Text style={ad.exportText}>{exporting ? '⏳...' : '📥 Export'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={ad.logoutBtn} onPress={onLogout}>
          <Text style={ad.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={ad.tabs}>
        {[{ id: 'summary', label: '📈 Summary' }, { id: 'records', label: '📋 Records' }].map(t => (
          <TouchableOpacity
            key={t.id}
            style={[ad.tab, tab === t.id && ad.tabOn]}
            onPress={() => setTab(t.id)}
          >
            <Text style={[ad.tabText, tab === t.id && ad.tabTextOn]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={ad.refreshBtn} onPress={fetchData}>
          <Text style={{ fontSize: 18 }}>🔄</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={ad.center}>
          <ActivityIndicator size="large" color="#1565C0" />
          <Text style={{ color: '#5C85C9', marginTop: 12 }}>Loading...</Text>
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 14 }}>

          {tab === 'summary' && (
            <>
              {/* Total count */}
              <View style={ad.totalCard}>
                <Text style={ad.totalEmoji}>📝</Text>
                <View>
                  <Text style={ad.totalLabel}>Total Feedback</Text>
                  <Text style={ad.totalCount}>{summary?.total_count ?? 0}</Text>
                </View>
                <View style={{ marginLeft: 'auto', alignItems: 'center' }}>
                  <Text style={{ fontSize: 40 }}>{moodOf(overall)}</Text>
                  <Text style={ad.overallScore}>{overall.toFixed(1)} / 5.0</Text>
                </View>
              </View>

              {/* Overall health bar */}
              <View style={ad.healthCard}>
                <Text style={ad.healthLabel}>Overall Satisfaction</Text>
                <View style={ad.healthBarBg}>
                  <View style={[ad.healthBarFill, {
                    width: `${(overall / 5) * 100}%`,
                    backgroundColor: overall >= 4 ? '#38A169' : overall >= 3 ? '#ECC94B' : '#E53E3E',
                  }]} />
                </View>
                <Text style={ad.healthPct}>{((overall / 5) * 100).toFixed(0)}% satisfaction rate</Text>
              </View>

              {/* Category Cards */}
              {CATS.map(c => {
                const val = summary?.[c.key] || 0;
                const full = Math.round(val);
                return (
                  <View key={c.key} style={[ad.catCard, { borderLeftColor: c.color }]}>
                    <View style={ad.catLeft}>
                      <Text style={{ fontSize: 28 }}>{c.emoji}</Text>
                      <View>
                        <Text style={ad.catLabel}>{c.label}</Text>
                        <Text style={{ fontSize: 11, color: '#A0AEC0' }}>
                          {'★'.repeat(full)}{'☆'.repeat(5 - full)}
                        </Text>
                      </View>
                    </View>
                    <View style={ad.catRight}>
                      <Text style={[ad.catScore, { color: c.color }]}>{val.toFixed(1)}</Text>
                      <Text style={{ fontSize: 22 }}>{moodOf(val)}</Text>
                    </View>
                  </View>
                );
              })}

              {/* Meal Breakdown */}
              <Text style={ad.sectionTitle}>🍴 By Meal Type</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {['Breakfast', 'Lunch', 'Dinner'].map(m => {
                  const mc = MEAL_COLORS[m];
                  const count = feedback.filter(r => r.meal_type === m).length;
                  const pct = feedback.length ? Math.round(count / feedback.length * 100) : 0;
                  return (
                    <View key={m} style={[ad.mealCard, { backgroundColor: mc.bg, flex: 1 }]}>
                      <Text style={{ fontSize: 28 }}>{mc.emoji}</Text>
                      <Text style={[ad.mealLabel, { color: mc.color }]}>{m}</Text>
                      <Text style={[ad.mealCount, { color: mc.color }]}>{count}</Text>
                      <Text style={{ fontSize: 11, color: mc.color, opacity: 0.7 }}>{pct}%</Text>
                    </View>
                  );
                })}
              </View>
            </>
          )}

          {tab === 'records' && (
            <>
              <Text style={ad.sectionTitle}>Recent Submissions ({feedback.length})</Text>
              {feedback.length === 0 ? (
                <View style={ad.center}>
                  <Text style={{ fontSize: 40 }}>📭</Text>
                  <Text style={{ color: '#A0AEC0', marginTop: 8 }}>No feedback yet</Text>
                </View>
              ) : feedback.slice(0, 20).map((row, i) => {
                const mc = MEAL_COLORS[row.meal_type] || MEAL_COLORS.Lunch;
                const avg = [row.food_quality, row.food_taste, row.cleanliness, row.staff_behavior, row.food_hygiene]
                  .filter(v => v > 0).reduce((a, b) => a + b, 0) /
                  [row.food_quality, row.food_taste, row.cleanliness, row.staff_behavior, row.food_hygiene].filter(v => v > 0).length;
                return (
                  <View key={i} style={ad.recordCard}>
                    <View style={ad.recordTop}>
                      <View style={[ad.mealPill, { backgroundColor: mc.bg }]}>
                        <Text style={{ fontSize: 14 }}>{mc.emoji}</Text>
                        <Text style={[ad.mealPillText, { color: mc.color }]}>{row.meal_type}</Text>
                      </View>
                      <Text style={[ad.recordScore, { color: avg >= 4 ? '#38A169' : avg >= 3 ? '#ECC94B' : '#E53E3E' }]}>
                        {avg ? avg.toFixed(1) : '—'} ⭐
                      </Text>
                    </View>
                    <View style={ad.recordFields}>
                      {[
                        { label: '🍱 Quality', val: row.food_quality },
                        { label: '😋 Taste',   val: row.food_taste },
                        { label: '✨ Clean',   val: row.cleanliness },
                        { label: '👨‍🍳 Staff',   val: row.staff_behavior },
                        { label: '🧼 Hygiene', val: row.food_hygiene },
                      ].map(f => (
                        <View key={f.label} style={ad.recordField}>
                          <Text style={ad.recordFieldLabel}>{f.label}</Text>
                          <Text style={ad.recordFieldVal}>{f.val || '—'}/5</Text>
                        </View>
                      ))}
                    </View>
                    {row.comments ? (
                      <Text style={ad.recordComment}>💬 {row.comments}</Text>
                    ) : null}
                  </View>
                );
              })}
            </>
          )}

          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const ad = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: '#F0F7FF' },
  header: {
    backgroundColor: '#0D47A1', paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 16 : 10,
    paddingBottom: 16, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between',
  },
  headerTitle:  { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  headerSub:    { fontSize: 11, color: '#90CAF9', marginTop: 2 },
  exportBtn:    { backgroundColor: '#FFD54F', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8 },
  exportText:   { color: '#0D47A1', fontSize: 12, fontWeight: '800' },
  logoutBtn:    { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  logoutText:   { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  tabs: {
    flexDirection: 'row', backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#BBDEFB',
    alignItems: 'center',
  },
  tab:          { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabOn:        { borderBottomWidth: 3, borderBottomColor: '#1565C0' },
  tabText:      { fontSize: 13, fontWeight: '600', color: '#90CAF9' },
  tabTextOn:    { color: '#1565C0' },
  refreshBtn:   { paddingHorizontal: 16 },
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  totalCard: {
    backgroundColor: '#1565C0', borderRadius: 16, padding: 20,
    flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  totalEmoji:   { fontSize: 36 },
  totalLabel:   { fontSize: 12, color: '#90CAF9', fontWeight: '600' },
  totalCount:   { fontSize: 40, fontWeight: '800', color: '#FFFFFF' },
  overallScore: { fontSize: 14, fontWeight: '700', color: '#FFD700' },
  healthCard: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16,
    gap: 10, borderWidth: 1, borderColor: '#BBDEFB',
  },
  healthLabel:  { fontSize: 13, fontWeight: '700', color: '#0D47A1' },
  healthBarBg:  { height: 12, backgroundColor: '#E2E8F0', borderRadius: 10 },
  healthBarFill:{ height: 12, borderRadius: 10 },
  healthPct:    { fontSize: 12, color: '#5C85C9', textAlign: 'center' },
  catCard: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderLeftWidth: 4, borderWidth: 1, borderColor: '#BBDEFB',
  },
  catLeft:      { flexDirection: 'row', alignItems: 'center', gap: 12 },
  catLabel:     { fontSize: 15, fontWeight: '700', color: '#1A202C' },
  catRight:     { alignItems: 'center', gap: 4 },
  catScore:     { fontSize: 26, fontWeight: '800' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#0D47A1' },
  mealCard: {
    borderRadius: 12, padding: 14, alignItems: 'center', gap: 4,
  },
  mealLabel:    { fontSize: 12, fontWeight: '700' },
  mealCount:    { fontSize: 26, fontWeight: '800' },
  recordCard: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16,
    gap: 10, borderWidth: 1, borderColor: '#BBDEFB',
  },
  recordTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mealPill:     { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  mealPillText: { fontSize: 12, fontWeight: '700' },
  recordScore:  { fontSize: 18, fontWeight: '800' },
  recordFields: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  recordField:  { alignItems: 'center', backgroundColor: '#F0F7FF', borderRadius: 8, padding: 8, minWidth: 60 },
  recordFieldLabel: { fontSize: 10, color: '#5C85C9', fontWeight: '600' },
  recordFieldVal:   { fontSize: 14, fontWeight: '800', color: '#0D47A1' },
  recordComment:    { fontSize: 12, color: '#718096', fontStyle: 'italic', paddingTop: 4, borderTopWidth: 1, borderTopColor: '#EEF4FF' },
});

// ── Star Row ──────────────────────────────────────────────────
function StarRow({ emoji, label, value, onChange }) {
  const faceScale  = useRef(new Animated.Value(1)).current;
  const faceRotate = useRef(new Animated.Value(0)).current;
  const starScales = [1, 2, 3, 4, 5].map(() => useRef(new Animated.Value(1)).current);
  const mood = MOOD[value];

  const animateFace = () => {
    faceScale.setValue(1.6);
    faceRotate.setValue(-0.2);
    Animated.parallel([
      Animated.spring(faceScale,  { toValue: 1, useNativeDriver: true, tension: 200, friction: 8 }),
      Animated.spring(faceRotate, { toValue: 0, useNativeDriver: true, tension: 200, friction: 8 }),
    ]).start();
  };

  const animateStar = (n) => {
    Animated.sequence([
      Animated.timing(starScales[n - 1], { toValue: 1.5, duration: 80, useNativeDriver: true }),
      Animated.spring(starScales[n - 1], { toValue: 1, useNativeDriver: true, tension: 300, friction: 6 }),
    ]).start();
  };

  const handlePress = (n) => { onChange(n); animateFace(); animateStar(n); };
  const spin = faceRotate.interpolate({ inputRange: [-0.2, 0.2], outputRange: ['-15deg', '15deg'] });

  return (
    <View style={sr.row}>
      <View style={sr.left}>
        <Text style={sr.emoji}>{emoji}</Text>
        <View>
          <Text style={sr.label}>{label}</Text>
          {value > 0 && <Text style={[sr.moodLabel, { color: mood.color }]}>{mood.label}</Text>}
        </View>
      </View>
      <View style={sr.right}>
        <View style={sr.stars}>
          {[1, 2, 3, 4, 5].map(n => (
            <TouchableOpacity key={n} onPress={() => handlePress(n)} activeOpacity={0.7}>
              <Animated.Text style={[sr.star, { color: n <= value ? '#FFD700' : '#CBD5E0' }, { transform: [{ scale: starScales[n - 1] }] }]}>★</Animated.Text>
            </TouchableOpacity>
          ))}
        </View>
        <Animated.Text style={[sr.face, { transform: [{ scale: faceScale }, { rotate: spin }] }]}>{mood.face}</Animated.Text>
      </View>
    </View>
  );
}
const sr = StyleSheet.create({
  row:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F4F8' },
  left:     { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  emoji:    { fontSize: 22 },
  label:    { fontSize: 14, fontWeight: '700', color: '#2D3748' },
  moodLabel:{ fontSize: 11, fontWeight: '700', marginTop: 2 },
  right:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stars:    { flexDirection: 'row', gap: 3 },
  star:     { fontSize: 26 },
  face:     { fontSize: 30, width: 38, textAlign: 'center' },
});

// ── Overall Score Bar ─────────────────────────────────────────
function OverallBar({ ratings }) {
  const vals    = Object.values(ratings).filter(v => v > 0);
  const avg     = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  const rounded = Math.round(avg);
  const pct     = (avg / 5) * 100;
  const face    = OVERALL_FACE[rounded];
  const scaleAnim = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    Animated.sequence([
      Animated.timing(scaleAnim,  { toValue: 1.2, duration: 150, useNativeDriver: true }),
      Animated.spring(scaleAnim,  { toValue: 1,   useNativeDriver: true, tension: 200 }),
    ]).start();
  }, [rounded]);

  if (!vals.length) return null;

  return (
    <View style={ob.wrap}>
      <View style={ob.top}>
        <View>
          <Text style={ob.label}>Overall Score</Text>
          <Text style={ob.value}>{avg.toFixed(1)} / 5.0</Text>
        </View>
        <Animated.Text style={[ob.face, { transform: [{ scale: scaleAnim }] }]}>{face}</Animated.Text>
      </View>
      <View style={ob.barBg}>
        <View style={[ob.barFill, { width: `${pct}%` }]} />
      </View>
      <Text style={ob.barLabel}>
        {rounded === 5 ? '🎉 Outstanding!' : rounded === 4 ? '👍 Great job!' :
          rounded === 3 ? '👌 Decent' : rounded === 2 ? '⚠️ Needs improvement' : '🔴 Poor — urgent attention needed'}
      </Text>
    </View>
  );
}
const ob = StyleSheet.create({
  wrap:     { backgroundColor: '#1A1A2E', borderRadius: 16, padding: 18, gap: 10 },
  top:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label:    { color: '#A0AEC0', fontSize: 12, fontWeight: '600' },
  value:    { color: '#FFD700', fontSize: 26, fontWeight: '800', marginTop: 2 },
  face:     { fontSize: 48 },
  barBg:    { height: 10, backgroundColor: '#2D3748', borderRadius: 10 },
  barFill:  { height: 10, backgroundColor: '#FFD700', borderRadius: 10 },
  barLabel: { color: '#A0AEC0', fontSize: 12, textAlign: 'center' },
});

// ── Feedback Form (User) ──────────────────────────────────────
function FeedbackForm({ apiUrl, onLogout }) {
  const [meal,     setMeal]     = useState('');
  const [ratings,  setRatings]  = useState({ ...INITIAL_RATINGS });
  const [comments, setComments] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [screen,   setScreen]   = useState('form'); // 'form' | 'success'
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  const showSuccess = () => {
    setScreen('success');
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 100 }),
    ]).start();
    setTimeout(() => {
      setScreen('form');
      setMeal(''); setRatings({ ...INITIAL_RATINGS }); setComments('');
      fadeAnim.setValue(0); slideAnim.setValue(40);
    }, 4000);
  };

  const submit = async () => {
    if (!meal) { Alert.alert('⚠️ Select Meal', 'Please choose Breakfast, Lunch or Dinner.'); return; }
    const missing = RATING_FIELDS.filter(f => ratings[f.key] === 0);
    if (missing.length) { Alert.alert('⭐ Missing Ratings', `Please rate:\n${missing.map(f => `• ${f.label}`).join('\n')}`); return; }
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          canteen_name:   'Main Canteen',
          canteen_id:     1,
          meal_type:      meal,
          food_quality:   ratings.food_quality,
          food_taste:     ratings.food_taste,
          cleanliness:    ratings.cleanliness,
          staff_behavior: ratings.staff_behavior,
          food_hygiene:   ratings.food_hygiene,
          comments:       comments.trim() || null,
        }),
      });
      if (!res.ok) throw new Error('Server error');
      setLoading(false);
      showSuccess();
    } catch (e) {
      setLoading(false);
      Alert.alert('❌ Connection Error', `Backend not reachable.\nServer: ${apiUrl}`);
    }
  };

  if (screen === 'success') return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A2E" />
      <View style={s.successPage}>
        <Animated.View style={[s.successBox, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={s.successBigEmoji}>🎉</Text>
          <Text style={s.successTitle}>Thank You!</Text>
          <Text style={s.successSub}>Your feedback has been{'\n'}submitted anonymously.</Text>
          <View style={s.anonPill}>
            <Text style={s.anonPillText}>🔒 No personal data collected</Text>
          </View>
          <Text style={s.resetNote}>Form resets in a few seconds...</Text>
        </Animated.View>
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A2E" />
      <View style={s.header}>
        <View style={s.headerLeft}>
          <Text style={s.headerIcon}>🍽️</Text>
          <View>
            <Text style={s.headerTitle}>Canteen Feedback</Text>
            <Text style={s.headerSub}>Help us serve you better</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <View style={s.anonBadge}><Text style={s.anonText}>🔒 Anonymous</Text></View>
          <TouchableOpacity style={s.logoutBtn} onPress={onLogout}>
            <Text style={s.logoutText}>Exit</Text>
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          <View style={s.notice}>
            <Text style={s.noticeIcon}>🛡️</Text>
            <Text style={s.noticeText}>Completely anonymous. No name, ID or personal data is collected or stored.</Text>
          </View>

          <View style={s.card}>
            <Text style={s.cardTitle}>🍴  Select Your Meal</Text>
            <View style={s.mealRow}>
              {MEAL_TYPES.map(({ label, emoji }) => (
                <TouchableOpacity key={label} style={[s.mealBtn, meal === label && s.mealBtnOn]} onPress={() => setMeal(label)} activeOpacity={0.8}>
                  <Text style={s.mealEmoji}>{emoji}</Text>
                  <Text style={[s.mealText, meal === label && s.mealTextOn]}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={s.card}>
            <Text style={s.cardTitle}>⭐  Rate Your Experience</Text>
            <Text style={s.cardHint}>Tap stars — watch the emoji react!</Text>
            {RATING_FIELDS.map(f => (
              <StarRow key={f.key} emoji={f.emoji} label={f.label} value={ratings[f.key]} onChange={v => setRatings(p => ({ ...p, [f.key]: v }))} />
            ))}
          </View>

          <OverallBar ratings={ratings} />

          <View style={s.card}>
            <Text style={s.cardTitle}>💬  Additional Comments</Text>
            <TextInput style={s.textarea} multiline numberOfLines={4} maxLength={500}
              placeholder="Any additional comments? (Optional)" placeholderTextColor="#A0AEC0"
              value={comments} onChangeText={setComments} textAlignVertical="top" />
            <Text style={s.charCount}>{comments.length} / 500</Text>
          </View>

          <TouchableOpacity style={[s.submitBtn, loading && s.submitOff]} onPress={submit} disabled={loading} activeOpacity={0.85}>
            <Text style={s.submitText}>{loading ? '⏳  Submitting...' : '✅  Submit Feedback'}</Text>
          </TouchableOpacity>

          <Text style={s.footer}>🔒 Your feedback is 100% anonymous and helps{'\n'}improve our canteen services every day.</Text>
          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: '#F7F8FC' },
  header: {
    backgroundColor: '#1A1A2E',
    paddingTop: Platform.OS === 'android' ? 16 : 10,
    paddingBottom: 16, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  headerLeft:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIcon:  { fontSize: 32 },
  headerTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '800' },
  headerSub:   { color: '#A0AEC0', fontSize: 12, marginTop: 2 },
  anonBadge:   { backgroundColor: '#2D3748', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  anonText:    { color: '#68D391', fontSize: 11, fontWeight: '600' },
  logoutBtn:   { backgroundColor: '#4A5568', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  logoutText:  { color: '#E2E8F0', fontSize: 11, fontWeight: '700' },
  scroll:      { flex: 1 },
  scrollContent: { padding: 16, gap: 14 },
  notice: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: '#EBF8FF', borderRadius: 12, padding: 14,
    borderLeftWidth: 4, borderLeftColor: '#3182CE', gap: 10,
  },
  noticeIcon:  { fontSize: 20 },
  noticeText:  { flex: 1, color: '#2C5282', fontSize: 13, fontWeight: '500', lineHeight: 20 },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18, elevation: 3,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 }, gap: 10,
  },
  cardTitle:   { fontSize: 17, fontWeight: '700', color: '#1A202C' },
  cardHint:    { fontSize: 12, color: '#718096', marginTop: -4 },
  mealRow:     { flexDirection: 'row', gap: 10 },
  mealBtn:     { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 14, backgroundColor: '#F7FAFC', borderWidth: 2, borderColor: '#E2E8F0' },
  mealBtnOn:   { backgroundColor: '#FFF5EB', borderColor: '#F6821F' },
  mealEmoji:   { fontSize: 26, marginBottom: 4 },
  mealText:    { fontSize: 13, fontWeight: '600', color: '#4A5568' },
  mealTextOn:  { color: '#C05621' },
  textarea: {
    backgroundColor: '#F7FAFC', borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0',
    padding: 14, fontSize: 15, color: '#2D3748', minHeight: 100,
  },
  charCount:   { textAlign: 'right', fontSize: 12, color: '#A0AEC0' },
  submitBtn: {
    backgroundColor: '#38A169', borderRadius: 16, paddingVertical: 18, alignItems: 'center',
    elevation: 4, shadowColor: '#38A169', shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
  },
  submitOff:   { backgroundColor: '#9AE6B4', elevation: 0 },
  submitText:  { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  footer:      { textAlign: 'center', fontSize: 12, color: '#A0AEC0', lineHeight: 18, paddingHorizontal: 20 },
  successPage: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7F8FC', padding: 24 },
  successBox: {
    backgroundColor: '#FFFFFF', borderRadius: 24, padding: 40, alignItems: 'center',
    width: '100%', maxWidth: 380, elevation: 8, shadowColor: '#000',
    shadowOpacity: 0.1, shadowRadius: 20, gap: 12,
  },
  successBigEmoji: { fontSize: 80 },
  successTitle:    { fontSize: 32, fontWeight: '800', color: '#276749' },
  successSub:      { fontSize: 16, color: '#2F855A', textAlign: 'center', lineHeight: 24 },
  anonPill:        { backgroundColor: '#F0FFF4', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, marginTop: 4 },
  anonPillText:    { color: '#276749', fontSize: 13, fontWeight: '600' },
  resetNote:       { fontSize: 12, color: '#A0AEC0', marginTop: 4 },
});

// ── Root App (Login Gate) ─────────────────────────────────────
export default function App() {
  const [authState, setAuthState] = useState({ user: null, role: null });
  const [apiUrl, setApiUrl]       = useState(API_URL);

  // Load saved API URL
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(saved => { if (saved) setApiUrl(saved); });
  }, []);

  const handleLogin = (user, role) => setAuthState({ user, role });
  const handleLogout = () => setAuthState({ user: null, role: null });
  const handleSaveUrl = (url) => {
    setApiUrl(url);
    AsyncStorage.setItem(STORAGE_KEY, url);
  };

  if (!authState.user)
    return <LoginScreen onLogin={handleLogin} apiUrl={apiUrl} onSaveUrl={handleSaveUrl} />;

  if (authState.role === 'admin')
    return <AdminDashboard apiUrl={apiUrl} onLogout={handleLogout} />;

  return <FeedbackForm apiUrl={apiUrl} onLogout={handleLogout} />;
}