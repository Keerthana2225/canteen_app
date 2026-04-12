import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  TextInput, Animated, Alert, Platform, Modal, Image,
  KeyboardAvoidingView, StatusBar, SafeAreaView, ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as IntentLauncher from 'expo-intent-launcher';
import { Ionicons } from '@expo/vector-icons';

// ── Constants ─────────────────────────────────────────────────
import CONFIG from './config';
const STORAGE_KEY = '@canteen_server_url';
const DEFAULT_PORT = '8000';
const API_URL = CONFIG.API_URL; // Initial default from config

// Hardcoded credentials (no backend auth needed)
const USERS = {
  admin: { password: 'admin@123', role: 'admin' },
  user: { password: 'user@123', role: 'user' },
};

const MEAL_TYPES = [
  { label: 'Breakfast', emoji: '🌅' },
  { label: 'Lunch', emoji: '☀️' },
  { label: 'Dinner', emoji: '🌙' },
];

const RATING_FIELDS = [
  { key: 'food_quality', label: 'Food Quality', emoji: '🍱' },
  { key: 'food_taste', label: 'Food Taste', emoji: '😋' },
  { key: 'food_hygiene', label: 'Food Hygiene', emoji: '🧼' },
  { key: 'cleanliness', label: 'Cleanliness', emoji: '✨' },
  { key: 'staff_behavior', label: 'Staff Behavior', emoji: '👨‍🍳' },
];

const MOOD = {
  0: { face: '😶', color: '#A0AEC0', label: '' },
  1: { face: '😢', color: '#E53E3E', label: 'Poor' },
  2: { face: '😕', color: '#ED8936', label: 'Below Average' },
  3: { face: '😐', color: '#ECC94B', label: 'Average' },
  4: { face: '😊', color: '#48BB78', label: 'Good' },
  5: { face: '🤩', color: '#38A169', label: 'Excellent' },
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
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
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
            <View style={ls.tsfContainer}>
              <Image
                source={require('./assets/tsf_logo_white.png')}
                style={ls.tsfLogoImg}
                resizeMode="contain"
              />
            </View>
            <Text style={ls.tsfBrand}>Brɑkes Indiɑ</Text>
            <Text style={ls.appName}>Canteen Feedback</Text>
          </View>

          {/* Card */}
          <Animated.View style={[ls.card, { transform: [{ translateX: shakeAnim }] }]}>
            <Text style={ls.cardTitle}>Welcome</Text>
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
                  <Ionicons name={showPass ? 'eye-off' : 'eye'} size={22} color="#A0AEC0" />
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

          <Text style={ls.footer}>🔒 Secure internal system — Brɑkes Indiɑ</Text>
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
                placeholder="e.g. 10.100.201.78"
                placeholderTextColor="#A0AEC0"
                keyboardType="numeric"
                autoCapitalize="none"
                autoCorrect={false}
                selectTextOnFocus={true}
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
  safe: { flex: 1, backgroundColor: '#0D47A1' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logoArea: { alignItems: 'center', marginBottom: 38, gap: 8 },
  tsfContainer: {
    width: 86, height: 86,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  tsfLogoImg: { width: 66, height: 66 },
  tsfBrand: { fontSize: 34, fontWeight: 'bold', fontFamily: 'sans-serif', color: '#FFFFFF', letterSpacing: -1 },
  appName: { fontSize: 22, fontWeight: 'bold', fontFamily: 'sans-serif', color: '#90CAF9', letterSpacing: 0, textAlign: 'center', marginTop: -4 },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 24,
    padding: 28, gap: 16,
    elevation: 12, shadowColor: '#000',
    shadowOpacity: 0.15, shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
  },
  cardTitle: { fontSize: 22, fontWeight: '800', color: '#0D47A1' },
  cardSub: { fontSize: 14, color: '#718096', marginTop: -8 },
  fieldWrap: { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: '#4A5568' },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F7FAFC', borderRadius: 12,
    borderWidth: 1.5, borderColor: '#E2E8F0', paddingHorizontal: 14,
  },
  inputIcon: { fontSize: 18, marginRight: 10 },
  input: {
    flex: 1, paddingVertical: 14, fontSize: 16,
    color: '#1A202C', fontWeight: '500',
  },
  eyeBtn: { padding: 4 },
  loginBtn: {
    backgroundColor: '#1565C0', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
    elevation: 4, shadowColor: '#1565C0',
    shadowOpacity: 0.4, shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    marginTop: 4,
  },
  loginBtnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800', letterSpacing: 0.5 },

  footer: { textAlign: 'center', fontSize: 11, color: '#90CAF9', marginTop: 24 },
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
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#0D47A1' },
  modalSub: { fontSize: 14, color: '#718096', marginTop: -6 },
  modalLabel: { fontSize: 12, fontWeight: '700', color: '#4A5568', letterSpacing: 0.5 },
  modalCurrent: { fontSize: 13, color: '#1565C0', fontWeight: '600', backgroundColor: '#EBF8FF', padding: 10, borderRadius: 10 },
  modalInputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F7FAFC', borderRadius: 12,
    borderWidth: 1.5, borderColor: '#BEE3F8', paddingHorizontal: 12,
  },
  modalPrefix: { fontSize: 14, color: '#718096', fontWeight: '600' },
  modalInput: { flex: 1, paddingVertical: 14, fontSize: 16, color: '#1A202C', fontWeight: '600' },
  modalSuffix: { fontSize: 14, color: '#718096', fontWeight: '600' },
  modalHintBox: { backgroundColor: '#FFFFF0', borderRadius: 12, padding: 12, gap: 4, borderLeftWidth: 3, borderLeftColor: '#ECC94B' },
  modalHint: { fontSize: 12, color: '#744210' },
  modalHintCode: { fontSize: 13, fontWeight: '800', color: '#744210', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  modalSaveBtn: {
    backgroundColor: '#1565C0', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
    elevation: 4, shadowColor: '#1565C0', shadowOpacity: 0.4, shadowRadius: 8,
    marginTop: 4,
  },
  modalSaveBtnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  modalCancelBtn: { alignItems: 'center', paddingVertical: 10 },
  modalCancelText: { color: '#A0AEC0', fontSize: 14 },
});

// ── Stat Progress Bar ─────────────────────────────────────────
function StatBar({ label, emoji, value, color }) {
  const pct = ((value / 5) * 100).toFixed(0);
  const mood = value >= 4.5 ? '🤩' : value >= 4 ? '😊' : value >= 3 ? '😐' : value >= 2 ? '😕' : value > 0 ? '😢' : '—';
  return (
    <View style={{ marginBottom: 14 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 16 }}>{emoji}</Text>
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#2D3748' }}>{label}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 14 }}>{mood}</Text>
          <Text style={{ fontSize: 15, fontWeight: '800', color }}>{value.toFixed(1)}</Text>
          <Text style={{ fontSize: 12, color: '#A0AEC0' }}>/5</Text>
        </View>
      </View>
      <View style={{ height: 8, backgroundColor: '#EDF2F7', borderRadius: 8, overflow: 'hidden' }}>
        <View style={{ height: 8, width: `${pct}%`, backgroundColor: color, borderRadius: 8 }} />
      </View>
    </View>
  );
}

// ── Mobile Admin Dashboard ─────────────────────────────────────
function AdminDashboard({ apiUrl, onLogout }) {
  const [summary, setSummary] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [tab, setTab] = useState('summary');
  const [monthlyData, setMonthlyData] = useState(null);
  const [selMonth, setSelMonth] = useState(new Date().getMonth() + 1);
  const [selYear]  = useState(new Date().getFullYear());
  const [loadingM, setLoadingM] = useState(false);
  const [kioskMode, setKioskMode] = useState(false);
  const [filterMeal, setFilterMeal] = useState('All');

  const CATS = [
    { key: 'avg_food_quality',   fbKey: 'food_quality',   label: 'Food Quality',   emoji: '🍱', color: '#1565C0' },
    { key: 'avg_food_taste',     fbKey: 'food_taste',     label: 'Food Taste',     emoji: '😋', color: '#7B1FA2' },
    { key: 'avg_food_hygiene',   fbKey: 'food_hygiene',   label: 'Food Hygiene',   emoji: '🧼', color: '#1976D2' },
    { key: 'avg_cleanliness',    fbKey: 'cleanliness',    label: 'Cleanliness',    emoji: '✨', color: '#00695C' },
    { key: 'avg_staff_behavior', fbKey: 'staff_behavior', label: 'Staff Behavior', emoji: '👨‍🍳', color: '#E65100' },
  ];

  const MEAL_COLORS = {
    Breakfast: { bg: '#EBF8FF', color: '#1565C0', border: '#BEE3F8', emoji: '🌅' },
    Lunch:     { bg: '#F0FFF4', color: '#276749', border: '#9AE6B4', emoji: '☀️' },
    Dinner:    { bg: '#FAF5FF', color: '#553C9A', border: '#D6BCFA', emoji: '🌙' },
  };

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [s, f] = await Promise.all([
        fetch(`${apiUrl}/feedback/summary`).then(r => r.json()),
        fetch(`${apiUrl}/feedback/all?limit=200`).then(r => r.json()),
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
      const downloadResult = await FileSystem.downloadAsync(url, fileUri);
      if (downloadResult.status !== 200) throw new Error('Download failed');
      if (Platform.OS === 'android') {
        const contentUri = await FileSystem.getContentUriAsync(fileUri);
        await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
          data: contentUri, flags: 1,
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
      } else {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          dialogTitle: 'Open Excel Report', UTI: 'com.microsoft.excel.xlsx',
        });
      }
    } catch (e) {
      try {
        const filename = `canteen_feedback_${new Date().toISOString().slice(0, 10)}.xlsx`;
        const fileUri = FileSystem.documentDirectory + filename;
        if (await Sharing.isAvailableAsync())
          await Sharing.shareAsync(fileUri, { mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      } catch (_) {
        Alert.alert('❌ Export Failed', 'Cannot open the file.\nMake sure Excel or Google Sheets is installed.');
      }
    }
    setExporting(false);
  }, [apiUrl]);

  const fetchMonthly = useCallback(async (m, y) => {
    setLoadingM(true);
    try {
      const r = await fetch(`${apiUrl}/analytics/monthly?year=${y}&month=${m}`);
      setMonthlyData(await r.json());
    } catch (_) { Alert.alert('Error', 'Cannot load analytics'); }
    setLoadingM(false);
  }, [apiUrl]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { fetchMonthly(selMonth, selYear); }, [fetchMonthly, selMonth, selYear]);

  const overall = summary
    ? CATS.map(c => summary[c.key] || 0).reduce((a, b) => a + b, 0) / CATS.length
    : 0;

  const healthLabel = overall >= 4.5 ? { text: 'Excellent', color: '#276749', bg: '#F0FFF4', border: '#9AE6B4' }
    : overall >= 4   ? { text: 'Good',      color: '#2B6CB0', bg: '#EBF8FF', border: '#90CDF4' }
    : overall >= 3   ? { text: 'Average',   color: '#744210', bg: '#FFFBEB', border: '#FAF089' }
    : overall >= 2   ? { text: 'Poor',      color: '#9B2C2C', bg: '#FFF5F5', border: '#FEB2B2' }
    : { text: 'No Data', color: '#718096', bg: '#F7FAFC', border: '#E2E8F0' };

  // Records filtered by meal
  const filteredFeedback = filterMeal === 'All'
    ? feedback
    : feedback.filter(f => f.meal_type === filterMeal);

  // Meal-type breakdown counts
  const mealCounts = ['Breakfast', 'Lunch', 'Dinner'].map(m => ({
    meal: m,
    count: feedback.filter(f => f.meal_type === m).length,
  }));
  const totalCount = feedback.length || 1;

  if (kioskMode) return <FeedbackForm apiUrl={apiUrl} onBack={() => setKioskMode(false)} />;

  return (
    <SafeAreaView style={ad.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0D47A1" />

      {/* ── Header ── */}
      <View style={ad.header}>
        <View style={{ flex: 1 }}>
          <Text style={ad.headerTitle}>Feedback Admin</Text>
          <Text style={ad.headerSub}>TSF Brɑkes Indiɑ — Control Center</Text>
        </View>
        <TouchableOpacity style={ad.refreshIconBtn} onPress={fetchData}>
          <Text style={{ fontSize: 18 }}>🔄</Text>
        </TouchableOpacity>
        <TouchableOpacity style={ad.exportBtn} onPress={handleExport} disabled={exporting} activeOpacity={0.85}>
          <Text style={ad.exportText}>{exporting ? '⏳' : '📥 Excel'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={ad.logoutBtn} onPress={onLogout}>
          <Text style={ad.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* ── Tabs ── */}
      <View style={ad.tabsScroll}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={ad.tabs}>
          {[
            { id: 'summary', label: '📊  Summary' },
            { id: 'records', label: `📋  Records (${feedback.length})` },
          ].map(t => (
            <TouchableOpacity
              key={t.id}
              style={[ad.tab, tab === t.id && ad.tabOn]}
              onPress={() => setTab(t.id)}
            >
              <Text style={[ad.tabText, tab === t.id && ad.tabTextOn]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={ad.center}>
          <ActivityIndicator size="large" color="#1565C0" />
          <Text style={{ color: '#5C85C9', marginTop: 12, fontWeight: '600' }}>Loading dashboard...</Text>
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 16 }} showsVerticalScrollIndicator={false}>

          {/* ═══════════════════════════════════════════ SUMMARY TAB ══ */}
          {tab === 'summary' && (
            <>
              {/* KPI Hero Card */}
              <View style={ad.heroCard}>
                <View style={ad.heroLeft}>
                  <Text style={ad.heroLabel}>Total Responses</Text>
                  <Text style={ad.heroCount}>{summary?.total_count ?? 0}</Text>
                  <View style={[ad.healthBadge, { backgroundColor: healthLabel.bg, borderColor: healthLabel.border }]}>
                    <Text style={[ad.healthBadgeText, { color: healthLabel.color }]}>● {healthLabel.text}</Text>
                  </View>
                </View>
                <View style={ad.heroRight}>
                  <Text style={ad.heroScoreEmoji}>
                    {overall >= 4.5 ? '🤩' : overall >= 4 ? '😊' : overall >= 3 ? '😐' : overall >= 2 ? '😕' : '😶'}
                  </Text>
                  <Text style={ad.heroScore}>{overall.toFixed(2)}</Text>
                  <Text style={ad.heroScoreSub}>Avg Score / 5</Text>
                </View>
              </View>

              {/* Meal Type Distribution */}
              <View style={ad.sectionCard}>
                <Text style={ad.sectionCardTitle}>🍽️  Meal Distribution</Text>
                {mealCounts.map(({ meal, count }) => {
                  const mc = MEAL_COLORS[meal];
                  const pct = Math.round((count / totalCount) * 100);
                  return (
                    <View key={meal} style={{ marginBottom: 12 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={{ fontSize: 15 }}>{mc.emoji}</Text>
                          <Text style={{ fontSize: 13, fontWeight: '700', color: '#2D3748' }}>{meal}</Text>
                        </View>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: mc.color }}>{count} ({pct}%)</Text>
                      </View>
                      <View style={{ height: 8, backgroundColor: '#EDF2F7', borderRadius: 8, overflow: 'hidden' }}>
                        <View style={{ height: 8, width: `${pct}%`, backgroundColor: mc.color, borderRadius: 8 }} />
                      </View>
                    </View>
                  );
                })}
              </View>

              {/* All-time Rating Bars */}
              <View style={ad.sectionCard}>
                <Text style={ad.sectionCardTitle}>⭐  Overall Rating Breakdown</Text>
                {CATS.map(c => (
                  <StatBar
                    key={c.key}
                    label={c.label} emoji={c.emoji}
                    value={summary?.[c.key] || 0}
                    color={c.color}
                  />
                ))}
              </View>

              {/* Monthly Analytics Section */}
              <Text style={ad.sectionTitle}>📅  Monthly Report — {selYear}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {MONTHS.map((mn, i) => (
                    <TouchableOpacity
                      key={mn}
                      style={[ad.monthBtn, selMonth === i + 1 && ad.monthBtnOn]}
                      onPress={() => setSelMonth(i + 1)}
                    >
                      <Text style={[ad.monthBtnTxt, selMonth === i + 1 && ad.monthBtnTxtOn]}>{mn}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              {loadingM ? (
                <ActivityIndicator size="large" color="#1565C0" style={{ marginTop: 20 }} />
              ) : monthlyData ? (
                <>
                  {monthlyData.total_count > 0 ? (
                    <>
                      {/* ── Monthly Overview Hero Card ── */}
                      {(() => {
                        const monthAvg = CATS.map(c => monthlyData[c.key] || 0).reduce((a, b) => a + b, 0) / CATS.length;
                        const mHealth = monthAvg >= 4.5 ? { label: 'Excellent', color: '#276749', bg: '#F0FFF4', border: '#9AE6B4' }
                          : monthAvg >= 4   ? { label: 'Good',      color: '#1A5276', bg: '#EBF8FF', border: '#90CDF4' }
                          : monthAvg >= 3   ? { label: 'Average',   color: '#7B4F00', bg: '#FFFBEB', border: '#FAD961' }
                          : monthAvg >= 2   ? { label: 'Poor',      color: '#9B2C2C', bg: '#FFF5F5', border: '#FEB2B2' }
                          : { label: 'No Data',  color: '#718096', bg: '#F7FAFC', border: '#E2E8F0' };
                        const mMood = monthAvg >= 4.5 ? '🤩' : monthAvg >= 4 ? '😊' : monthAvg >= 3 ? '😐' : monthAvg >= 2 ? '😕' : '😶';
                        const pct = Math.round((monthAvg / 5) * 100);
                        return (
                          <View style={ad.monthOverviewCard}>
                            {/* Left: response count */}
                            <View style={ad.monthOverviewLeft}>
                              <Text style={ad.monthOverviewMonthLabel}>{MONTHS[selMonth - 1].toUpperCase()} {selYear}</Text>
                              <Text style={ad.monthOverviewCount}>{monthlyData.total_count}</Text>
                              <Text style={ad.monthOverviewCountLabel}>Responses</Text>
                              <View style={[ad.monthOverviewBadge, { backgroundColor: mHealth.bg, borderColor: mHealth.border }]}>
                                <Text style={[ad.monthOverviewBadgeText, { color: mHealth.color }]}>● {mHealth.label}</Text>
                              </View>
                            </View>

                            {/* Divider */}
                            <View style={ad.monthOverviewDivider} />

                            {/* Right: score */}
                            <View style={ad.monthOverviewRight}>
                              <Text style={ad.monthOverviewMood}>{mMood}</Text>
                              <Text style={ad.monthOverviewScore}>{monthAvg.toFixed(2)}</Text>
                              <Text style={ad.monthOverviewScoreSub}>out of 5.0</Text>
                              {/* Mini progress */}
                              <View style={ad.monthOverviewBar}>
                                <View style={[ad.monthOverviewBarFill, { width: `${pct}%` }]} />
                              </View>
                            </View>
                          </View>
                        );
                      })()}

                      {/* ── Rating Breakdown ── */}
                      <View style={ad.sectionCard}>
                        <Text style={ad.sectionCardTitle}>📊  {MONTHS[selMonth - 1]} Ratings</Text>
                        {CATS.map(c => (
                          <StatBar
                            key={c.key}
                            label={c.label} emoji={c.emoji}
                            value={monthlyData[c.key] || 0}
                            color={c.color}
                          />
                        ))}
                      </View>

                      {/* ── Meal Type Split ── */}
                      <View style={ad.sectionCard}>
                        <Text style={ad.sectionCardTitle}>🍽️  Meal Type Split</Text>
                        {['Breakfast', 'Lunch', 'Dinner'].map(m => {
                          const mc = MEAL_COLORS[m];
                          const mCount = monthlyData[`${m.toLowerCase()}_count`] || 0;
                          const mPct = Math.round((mCount / (monthlyData.total_count || 1)) * 100);
                          return (
                            <View key={m} style={{ marginBottom: 14 }}>
                              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                  <View style={[ad.mealDot, { backgroundColor: mc.color }]} />
                                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#2D3748' }}>{mc.emoji}  {m}</Text>
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                  <Text style={{ fontSize: 16, fontWeight: '900', color: mc.color }}>{mCount}</Text>
                                  <Text style={{ fontSize: 12, color: '#A0AEC0', fontWeight: '600' }}>({mPct}%)</Text>
                                </View>
                              </View>
                              <View style={{ height: 10, backgroundColor: '#EDF2F7', borderRadius: 10, overflow: 'hidden' }}>
                                <View style={{ height: 10, width: `${mPct}%`, backgroundColor: mc.color, borderRadius: 10 }} />
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    </>
                  ) : (
                    <View style={ad.emptyBox}>
                      <Text style={{ fontSize: 44, marginBottom: 8 }}>📭</Text>
                      <Text style={{ fontSize: 17, fontWeight: '800', color: '#4A5568' }}>No data for {MONTHS[selMonth - 1]}</Text>
                      <Text style={{ fontSize: 13, color: '#A0AEC0', marginTop: 6, textAlign: 'center' }}>No feedback was submitted this month yet.</Text>
                    </View>
                  )}
                </>
              ) : (
                <View style={ad.emptyBox}>
                  <Text style={{ fontSize: 13, color: '#A0AEC0' }}>Select a month to load analytics</Text>
                </View>
              )}
            </>
          )}

          {/* ═══════════════════════════════════════════ RECORDS TAB ══ */}
          {tab === 'records' && (
            <>
              {/* Filter bar */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {['All', 'Breakfast', 'Lunch', 'Dinner'].map(m => (
                    <TouchableOpacity
                      key={m}
                      style={[
                        ad.filterChip,
                        filterMeal === m && ad.filterChipOn,
                        m !== 'All' && filterMeal === m && { backgroundColor: MEAL_COLORS[m]?.color, borderColor: MEAL_COLORS[m]?.color },
                      ]}
                      onPress={() => setFilterMeal(m)}
                    >
                      <Text style={[ad.filterChipText, filterMeal === m && ad.filterChipTextOn]}>
                        {m === 'All' ? '🗂️  All' : `${MEAL_COLORS[m].emoji}  ${m}`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              {filteredFeedback.length === 0 ? (
                <View style={ad.emptyBox}>
                  <Text style={{ fontSize: 48, marginBottom: 10 }}>📭</Text>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: '#4A5568' }}>No Records Found</Text>
                  <Text style={{ fontSize: 13, color: '#A0AEC0', marginTop: 6, textAlign: 'center' }}>
                    {filterMeal === 'All' ? 'No feedback has been submitted yet.' : `No ${filterMeal} feedback submitted yet.`}
                  </Text>
                </View>
              ) : (
                filteredFeedback.map((item, idx) => {
                  const mc = MEAL_COLORS[item.meal_type] || { bg: '#F7FAFC', color: '#4A5568', border: '#E2E8F0', emoji: '🍽️' };
                  const avg = ([
                    item.food_quality, item.food_taste, item.food_hygiene,
                    item.staff_behavior, item.cleanliness,
                  ].reduce((a, b) => a + b, 0) / 5);
                  const avgMood = avg >= 4.5 ? '🤩' : avg >= 4 ? '😊' : avg >= 3 ? '😐' : avg >= 2 ? '😕' : '😢';
                  return (
                    <View key={item.id ?? idx} style={ad.recordCard}>
                      {/* Card Header */}
                      <View style={ad.recordHeader}>
                        <View style={[ad.mealPill, { backgroundColor: mc.bg, borderColor: mc.border }]}>
                          <Text style={{ fontSize: 13 }}>{mc.emoji}</Text>
                          <Text style={[ad.mealPillText, { color: mc.color }]}>{item.meal_type}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <Text style={{ fontSize: 20 }}>{avgMood}</Text>
                            <Text style={[ad.recordScore, { color: avg >= 4 ? '#276749' : avg >= 3 ? '#744210' : '#9B2C2C' }]}>
                              {avg.toFixed(1)}
                            </Text>
                            <Text style={{ fontSize: 12, color: '#A0AEC0', fontWeight: '600' }}>/5</Text>
                          </View>
                          <Text style={{ fontSize: 11, color: '#A0AEC0' }}>#{item.id}</Text>
                        </View>
                      </View>

                      {/* Divider */}
                      <View style={{ height: 1, backgroundColor: '#EDF2F7' }} />

                      {/* Rating rows */}
                      {CATS.map(c => {
                        const val = item[c.fbKey] || 0;
                        return (
                          <View key={c.key} style={ad.ratingRow}>
                            <Text style={{ fontSize: 14 }}>{c.emoji}</Text>
                            <Text style={ad.ratingLabel}>{c.label}</Text>
                            <View style={{ flexDirection: 'row', gap: 2, marginLeft: 'auto' }}>
                              {[1,2,3,4,5].map(s => (
                                <Text key={s} style={{ fontSize: 14, color: s <= val ? '#FFD700' : '#CBD5E0' }}>★</Text>
                              ))}
                            </View>
                            <Text style={[ad.ratingVal, { color: c.color }]}>{val}</Text>
                          </View>
                        );
                      })}

                      {/* Comment */}
                      {item.comments ? (
                        <View style={ad.commentBox}>
                          <Text style={ad.commentLabel}>💬 Comment</Text>
                          <Text style={ad.commentText}>"{item.comments}"</Text>
                        </View>
                      ) : null}
                    </View>
                  );
                })
              )}
            </>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const ad = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F0F7FF' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },

  // Header
  header: {
    backgroundColor: '#0D47A1', paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 14 : 10,
    paddingBottom: 14, flexDirection: 'row',
    alignItems: 'center', gap: 8,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  headerSub: { fontSize: 11, color: '#90CAF9' },
  refreshIconBtn: { padding: 8 },
  exportBtn: { backgroundColor: '#FFD54F', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  exportText: { color: '#0D47A1', fontSize: 12, fontWeight: '800' },
  logoutBtn: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  logoutText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },

  // Tabs
  tabsScroll: { backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', elevation: 3 },
  tabs: { paddingHorizontal: 16, gap: 32 },
  tab: { paddingVertical: 14, borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabOn: { borderBottomColor: '#0D47A1' },
  tabText: { fontSize: 14, fontWeight: '700', color: '#A0AEC0' },
  tabTextOn: { color: '#0D47A1' },

  // Hero KPI card
  heroCard: {
    backgroundColor: '#0D47A1', borderRadius: 22, padding: 24,
    flexDirection: 'row', alignItems: 'center',
    elevation: 10, shadowColor: '#0D47A1', shadowOpacity: 0.35, shadowRadius: 20, shadowOffset: { width: 0, height: 10 },
  },
  heroLeft: { flex: 1, gap: 8 },
  heroLabel: { fontSize: 13, color: '#90CAF9', fontWeight: '600' },
  heroCount: { fontSize: 52, fontWeight: '900', color: '#FFFFFF', letterSpacing: -2 },
  healthBadge: { alignSelf: 'flex-start', borderRadius: 20, borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 5 },
  healthBadgeText: { fontSize: 12, fontWeight: '800' },
  heroRight: { alignItems: 'center', gap: 4 },
  heroScoreEmoji: { fontSize: 44 },
  heroScore: { fontSize: 32, fontWeight: '900', color: '#FFD54F', letterSpacing: -1 },
  heroScoreSub: { fontSize: 11, color: '#90CAF9', fontWeight: '600' },

  // Section card (white rounded container)
  sectionCard: {
    backgroundColor: '#FFFFFF', borderRadius: 18, padding: 18,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10,
  },
  sectionCardTitle: { fontSize: 16, fontWeight: '800', color: '#1A202C', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1A202C', marginTop: 4 },

  // Monthly buttons
  monthBtn: {
    backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1.5, borderColor: '#E2E8F0',
    elevation: 1,
  },
  monthBtnOn: { backgroundColor: '#0D47A1', borderColor: '#0D47A1', elevation: 4 },
  monthBtnTxt: { fontSize: 13, fontWeight: '700', color: '#4A5568' },
  monthBtnTxtOn: { color: '#FFFFFF' },

  // Monthly Overview Hero Card
  monthOverviewCard: {
    backgroundColor: '#0D47A1', borderRadius: 22, padding: 22,
    flexDirection: 'row', alignItems: 'stretch',
    elevation: 10, shadowColor: '#0D47A1', shadowOpacity: 0.35, shadowRadius: 20, shadowOffset: { width: 0, height: 10 },
    gap: 0,
  },
  monthOverviewLeft: { flex: 1, gap: 6, paddingRight: 16 },
  monthOverviewMonthLabel: { fontSize: 11, color: '#90CAF9', fontWeight: '800', letterSpacing: 1.5 },
  monthOverviewCount: { fontSize: 50, fontWeight: '900', color: '#FFFFFF', letterSpacing: -2, lineHeight: 56 },
  monthOverviewCountLabel: { fontSize: 13, color: '#90CAF9', fontWeight: '600', marginTop: -6 },
  monthOverviewBadge: { alignSelf: 'flex-start', borderRadius: 20, borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 5, marginTop: 4 },
  monthOverviewBadgeText: { fontSize: 12, fontWeight: '800' },

  monthOverviewDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginHorizontal: 0 },

  monthOverviewRight: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4, paddingLeft: 16 },
  monthOverviewMood: { fontSize: 42, lineHeight: 54, includeFontPadding: false },
  monthOverviewScore: { fontSize: 36, fontWeight: '900', color: '#FFD54F', letterSpacing: -1, lineHeight: 42 },
  monthOverviewScoreSub: { fontSize: 11, color: '#90CAF9', fontWeight: '600' },
  monthOverviewBar: { width: '100%', height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 6, marginTop: 6, overflow: 'hidden' },
  monthOverviewBarFill: { height: 6, backgroundColor: '#FFD54F', borderRadius: 6 },

  // Meal dot indicator
  mealDot: { width: 10, height: 10, borderRadius: 5 },

  // Records tab
  filterChip: {
    borderRadius: 22, borderWidth: 1.5, borderColor: '#E2E8F0',
    paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#FFFFFF',
  },
  filterChipOn: { borderColor: '#0D47A1', backgroundColor: '#0D47A1' },
  filterChipText: { fontSize: 13, fontWeight: '700', color: '#4A5568' },
  filterChipTextOn: { color: '#FFFFFF' },

  recordCard: {
    backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16,
    gap: 10, elevation: 3, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
  },
  recordHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  mealPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 22, paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 1.5,
  },
  mealPillText: { fontSize: 13, fontWeight: '800' },
  recordScore: { fontSize: 22, fontWeight: '900' },

  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 3 },
  ratingLabel: { fontSize: 13, fontWeight: '600', color: '#4A5568', flex: 1 },
  ratingVal: { fontSize: 14, fontWeight: '800', minWidth: 16, textAlign: 'right' },

  commentBox: { backgroundColor: '#FFFBEB', borderRadius: 12, padding: 12, borderLeftWidth: 3, borderLeftColor: '#F6E05E' },
  commentLabel: { fontSize: 11, fontWeight: '800', color: '#744210', marginBottom: 4, letterSpacing: 0.5 },
  commentText: { fontSize: 13, color: '#744210', fontStyle: 'italic', lineHeight: 18 },

  // Empty state
  emptyBox: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 48, paddingHorizontal: 24,
    backgroundColor: '#FFFFFF', borderRadius: 18,
    elevation: 1,
  },

  // Legacy (keep for safety)
  actionRow: { flexDirection: 'row', gap: 12 },
  actionCard: { flex: 1, borderRadius: 20, padding: 20, elevation: 4 },
  actionCardTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF', marginTop: 8 },
  actionCardSub: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 4, lineHeight: 18 },
});


// ── Star Row ──────────────────────────────────────────────────
function StarRow({ emoji, label, value, onChange }) {
  const faceScale = useRef(new Animated.Value(1)).current;
  const faceRotate = useRef(new Animated.Value(0)).current;
  const starScales = [1, 2, 3, 4, 5].map(() => useRef(new Animated.Value(1)).current);
  const mood = MOOD[value];

  const animateFace = () => {
    faceScale.setValue(1.6);
    faceRotate.setValue(-0.2);
    Animated.parallel([
      Animated.spring(faceScale, { toValue: 1, useNativeDriver: true, tension: 200, friction: 8 }),
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
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F4F8' },
  left: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  emoji: { fontSize: 22 },
  label: { fontSize: 14, fontWeight: '700', color: '#2D3748' },
  moodLabel: { fontSize: 11, fontWeight: '700', marginTop: 2 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stars: { flexDirection: 'row', gap: 3 },
  star: { fontSize: 26 },
  face: { fontSize: 30, width: 38, textAlign: 'center' },
});

// ── Overall Score Bar ─────────────────────────────────────────
function OverallBar({ ratings }) {
  const vals = Object.values(ratings).filter(v => v > 0);
  const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  const rounded = Math.round(avg);
  const pct = (avg / 5) * 100;
  const face = OVERALL_FACE[rounded];
  const scaleAnim = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.2, duration: 150, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 200 }),
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
  wrap: { backgroundColor: '#1A1A2E', borderRadius: 16, padding: 18, gap: 10 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { color: '#A0AEC0', fontSize: 12, fontWeight: '600' },
  value: { color: '#FFD700', fontSize: 26, fontWeight: '800', marginTop: 2 },
  face: { fontSize: 48 },
  barBg: { height: 10, backgroundColor: '#2D3748', borderRadius: 10 },
  barFill: { height: 10, backgroundColor: '#FFD700', borderRadius: 10 },
  barLabel: { color: '#A0AEC0', fontSize: 12, textAlign: 'center' },
});

// ── Feedback Form (User) ──────────────────────────────────────
function FeedbackForm({ apiUrl, onLogout, onBack }) {
  const [meal, setMeal] = useState('');
  const [ratings, setRatings] = useState({ ...INITIAL_RATINGS });
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);
  const [screen, setScreen] = useState('form'); // 'form' | 'success'
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  const showSuccess = () => {
    setScreen('success');
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
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
          canteen_name: 'Main Canteen',
          canteen_id: 1,
          meal_type: meal,
          food_quality: ratings.food_quality,
          food_taste: ratings.food_taste,
          cleanliness: ratings.cleanliness,
          staff_behavior: ratings.staff_behavior,
          food_hygiene: ratings.food_hygiene,
          comments: comments.trim() || null,
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
          {onBack ? (
            <TouchableOpacity style={s.backBtn} onPress={onBack}>
              <Text style={s.logoutText}>← Back</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={s.logoutBtn} onPress={onLogout}>
              <Text style={s.logoutText}>Logout</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">



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
  safe: { flex: 1, backgroundColor: '#F7F8FC' },
  header: {
    backgroundColor: '#1A1A2E',
    paddingTop: Platform.OS === 'android' ? 16 : 10,
    paddingBottom: 16, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIcon: { fontSize: 32 },
  headerTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '800' },
  headerSub: { color: '#A0AEC0', fontSize: 12, marginTop: 2 },
  anonBadge: { backgroundColor: '#2D3748', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  anonText: { color: '#68D391', fontSize: 11, fontWeight: '600' },
  logoutBtn: { backgroundColor: '#4A5568', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  backBtn: { backgroundColor: '#C53030', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  logoutText: { color: '#E2E8F0', fontSize: 12, fontWeight: '700' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 14 },
  notice: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: '#EBF8FF', borderRadius: 12, padding: 14,
    borderLeftWidth: 4, borderLeftColor: '#3182CE', gap: 10,
  },
  noticeIcon: { fontSize: 20 },
  noticeText: { flex: 1, color: '#2C5282', fontSize: 13, fontWeight: '500', lineHeight: 20 },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18, elevation: 3,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 }, gap: 10,
  },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#1A202C' },
  cardHint: { fontSize: 12, color: '#718096', marginTop: -4 },
  mealRow: { flexDirection: 'row', gap: 10 },
  mealBtn: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 14, backgroundColor: '#F7FAFC', borderWidth: 2, borderColor: '#E2E8F0' },
  mealBtnOn: { backgroundColor: '#FFF5EB', borderColor: '#F6821F' },
  mealEmoji: { fontSize: 26, marginBottom: 4 },
  mealText: { fontSize: 13, fontWeight: '600', color: '#4A5568' },
  mealTextOn: { color: '#C05621' },
  textarea: {
    backgroundColor: '#F7FAFC', borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0',
    padding: 14, fontSize: 15, color: '#2D3748', minHeight: 100,
  },
  charCount: { textAlign: 'right', fontSize: 12, color: '#A0AEC0' },
  submitBtn: {
    backgroundColor: '#38A169', borderRadius: 16, paddingVertical: 18, alignItems: 'center',
    elevation: 4, shadowColor: '#38A169', shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
  },
  submitOff: { backgroundColor: '#9AE6B4', elevation: 0 },
  submitText: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  footer: { textAlign: 'center', fontSize: 12, color: '#A0AEC0', lineHeight: 18, paddingHorizontal: 20 },
  successPage: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7F8FC', padding: 24 },
  successBox: {
    backgroundColor: '#FFFFFF', borderRadius: 24, padding: 40, alignItems: 'center',
    width: '100%', maxWidth: 380, elevation: 8, shadowColor: '#000',
    shadowOpacity: 0.1, shadowRadius: 20, gap: 12,
  },
  successBigEmoji: { fontSize: 80 },
  successTitle: { fontSize: 32, fontWeight: '800', color: '#276749' },
  successSub: { fontSize: 16, color: '#2F855A', textAlign: 'center', lineHeight: 24 },
  anonPill: { backgroundColor: '#F0FFF4', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, marginTop: 4 },
  anonPillText: { color: '#276749', fontSize: 13, fontWeight: '600' },
  resetNote: { fontSize: 12, color: '#A0AEC0', marginTop: 4 },
});

// ── Root App (Login Gate) ─────────────────────────────────────
export default function App() {
  const [authState, setAuthState] = useState({ user: null, role: null });
  const [apiUrl, setApiUrl] = useState(API_URL);

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