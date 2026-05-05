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
  { label: 'Breakfast',              emoji: '🌅', color: '#1565C0' },
  { label: 'Lunch',                  emoji: '☀️', color: '#2E7D32' },
  { label: 'Dinner',                 emoji: '🌙', color: '#6A1B9A' },
  { label: 'Midnight Supper',        emoji: '🌃', color: '#1A237E' },
  { label: 'Early Morning Breakfast',emoji: '🌄', color: '#E65100' },
];

function detectMealType() {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  const mins = h * 60 + m;
  // 6:00–10:59 → Breakfast
  if (mins >= 360 && mins <= 659)  return MEAL_TYPES[0];
  // 11:00–14:59 → Lunch
  if (mins >= 660 && mins <= 899)  return MEAL_TYPES[1];
  // 15:00–18:59 → Lunch (afternoon)
  if (mins >= 900 && mins <= 1139) return MEAL_TYPES[1];
  // 19:00–22:59 → Dinner
  if (mins >= 1140 && mins <= 1379) return MEAL_TYPES[2];
  // 23:00–01:30 → Midnight Supper (1380–1439 and 0–90)
  if (mins >= 1380 || mins <= 90)  return MEAL_TYPES[3];
  // 01:31–05:59 → Early Morning Breakfast
  return MEAL_TYPES[4];
}

const TRANSLATIONS = {
  en: {
    headerTitle:    'Canteen Feedback',
    headerSub:      'Help us serve you better',
    mealDetected:   'Meal Auto-Detected',
    rateExperience: '⭐  Rate Your Experience',
    tapStars:       'Tap stars — watch the emoji react!',
    addComments:    '💬  Additional Comments',
    commentRequired:'Comment is required when overall average rating is 1 or 2',
    commentHint:    'Enter comment (Optional)',
    commentOptional:'Enter comment (Optional)',
    submit:         '✅  Submit Feedback',
    submitting:     '⏳  Submitting...',
    successTitle:   'Thank You!',
    successSub:     'Your feedback has been\nsubmitted successfully.',
    anonNote:       '🔒 No personal data collected',
    resetNote:      'Form resets in a few seconds...',
    footer:         '🔒 Your feedback is 100% anonymous and helps\nimprove our canteen services every day.',
    missingRatings: 'Missing Ratings',
    pleaseRate:     'Please rate all categories before submitting.',
    commentNeeded:  'Comment Required',
    commentNeededMsg:'Please add a comment when the overall average rating is 2 or below (≤ 2).',
    connErr:        'Connection Error',
    connErrMsg:     'Backend not reachable.',
    logout:         'Logout',
    back:           '← Back',
    lowFeedback:    '⚠️ Low Feedback',
    criticalAlert:  '🔴 Critical — comment required',
    food_quality:   'Food Quality',
    food_taste:     'Food Taste',
    food_hygiene:   'Food Hygiene',
    cleanliness:    'Cleanliness',
    staff_behavior: 'Staff Behavior',
    // Meal type names (English — shown as-is)
    'Breakfast':               'Breakfast',
    'Lunch':                   'Lunch',
    'Dinner':                  'Dinner',
    'Midnight Supper':         'Midnight Supper',
    'Early Morning Breakfast': 'Early Morning Breakfast',
  },
  ta: {
    headerTitle:    'கேன்டீன் கருத்து',
    headerSub:      'சிறந்த சேவைக்கு உதவுங்கள்',
    mealDetected:   'உணவு வகை தானாக கண்டறியப்பட்டது',
    rateExperience: '⭐  உங்கள் அனுபவத்தை மதிப்பிடுங்கள்',
    tapStars:       'நட்சத்திரங்களை தொடுங்கள்!',
    addComments:    '💬  கூடுதல் கருத்துகள்',
    commentRequired:'ஒட்டுமொத்த சராசரி மதிப்பெண் 1 அல்லது 2 ஆக இருந்தால் கருத்து கட்டாயம்',
    commentHint:    'கருத்து உள்ளிடுக (விருப்பத்தேர்வு)',
    commentOptional:'கருத்து உள்ளிடுக (விருப்பத்தேர்வு)',
    submit:         '✅  கருத்தை சமர்ப்பி',
    submitting:     '⏳  சமர்ப்பிக்கிறது...',
    successTitle:   'நன்றி!',
    successSub:     'உங்கள் கருத்து சமர்ப்பிக்கப்பட்டது.',
    anonNote:       '🔒 தனிப்பட்ட தரவு சேகரிக்கப்படவில்லை',
    resetNote:      'சில நொடிகளில் படிவம் மீட்டமைக்கப்படும்...',
    footer:         '🔒 உங்கள் கருத்து 100% அநாமதேயமானது.',
    missingRatings: 'மதிப்பீடு தேவை',
    pleaseRate:     'அனைத்து பிரிவுகளையும் மதிப்பிடுங்கள்.',
    commentNeeded:  'கருத்து தேவை',
    commentNeededMsg:'குறைந்த மதிப்பெண்ணுக்கான (≤ 2) காரணம் தெரிவிக்கவும்.',
    connErr:        'இணைப்பு பிழை',
    connErrMsg:     'சர்வர் கிடைக்கவில்லை.',
    logout:         'வெளியேறு',
    back:           '← பின்',
    lowFeedback:    '⚠️ குறைந்த கருத்து',
    criticalAlert:  '🔴 மிகவும் குறைவு — கருத்து கட்டாயம்',
    food_quality:   'உணவின் தரம்',
    food_taste:     'உணவின் சுவை',
    food_hygiene:   'உணவு சுகாதாரம்',
    cleanliness:    'தூய்மை',
    staff_behavior: 'ஊழியர்களின் நடத்தை',
    // Meal type names in Tamil
    'Breakfast':               'காலை உணவு',
    'Lunch':                   'மதிய உணவு',
    'Dinner':                  'இரவு உணவு',
    'Midnight Supper':         'நள்ளிரவு சிற்றுண்டி',
    'Early Morning Breakfast': 'அதிகாலை காலை உணவு',
  },
};

const RATING_FIELDS = [
  { key: 'food_quality', emoji: '🍱' },
  { key: 'food_taste', emoji: '😋' },
  { key: 'food_hygiene', emoji: '🧼' },
  { key: 'cleanliness', emoji: '✨' },
  { key: 'staff_behavior', emoji: '👨‍🍳' },
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
                keyboardType="decimal-pad"
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
  const [tab, setTab] = useState('summary'); // 'summary' or 'records'
  const [filterMode, setFilterMode] = useState('today'); // 'today' or 'all'
  
  const [monthlyData, setMonthlyData] = useState(null);
  const [selMonth, setSelMonth] = useState(new Date().getMonth() + 1);
  const [selYear]  = useState(new Date().getFullYear());
  const [loadingM, setLoadingM] = useState(false);
  const [filterMeal, setFilterMeal] = useState('All');
  const [showExportOptions, setShowExportOptions] = useState(false);

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
    'Midnight Supper': { bg: '#E8EAF6', color: '#1A237E', border: '#C5CAE9', emoji: '🌃' },
    'Early Morning Breakfast': { bg: '#FFF3E0', color: '#E65100', border: '#FFE0B2', emoji: '🌄' },
  };
  const MEAL_ARR = ['Breakfast', 'Lunch', 'Dinner', 'Midnight Supper', 'Early Morning Breakfast'];
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const d = new Date();
      const todayStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      const q = filterMode === 'today' ? `?from_date=${todayStr}&to_date=${todayStr}` : '?limit=200';
      
      const [s, f] = await Promise.all([
        fetch(`${apiUrl}/feedback/summary`).then(r => r.json()),
        fetch(`${apiUrl}/feedback/all${q}`).then(r => r.json()),
      ]);
      setSummary(s);
      setFeedback(Array.isArray(f) ? f : []);
    } catch (e) {
      Alert.alert('❌ Error', 'Cannot reach server.\n' + apiUrl);
    }
    setLoading(false);
  }, [apiUrl, filterMode]);

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

  const handleExport = useCallback(async (urlParams = '') => {
    setExporting(true);
    setShowExportOptions(false);
    try {
      const url = `${apiUrl}/feedback/export${urlParams ? '?' + urlParams : ''}`;
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
    : filterMeal === 'Critical'
    ? feedback.filter(f => f.is_critical === 1)
    : feedback.filter(f => f.meal_type === filterMeal);

  // Meal-type breakdown counts
  const mealCounts = MEAL_ARR.map(m => ({
    meal: m,
    count: feedback.filter(f => f.meal_type === m).length,
  })).filter(m => m.count > 0);
  const totalCount = feedback.length || 1;

  return (
    <SafeAreaView style={ad.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />

      {/* ── Header ── */}
      <View style={ad.header}>
        <View style={{ flex: 1 }}>
          <Text style={ad.headerTitle}>Admin Center</Text>
          <Text style={ad.headerSub}>Live Feedback Monitoring</Text>
        </View>
        <TouchableOpacity style={ad.refreshIconBtn} onPress={fetchData}>
          <Text style={{ fontSize: 20 }}>🔄</Text>
        </TouchableOpacity>
        <TouchableOpacity style={ad.exportBtn} onPress={() => setShowExportOptions(true)} disabled={exporting}>
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
            { id: 'summary', label: '📊 Summary & Analytics' },
            { id: 'records', label: `📋 Feedback Records` },
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
          <ActivityIndicator size="large" color="#0A0A0A" />
          <Text style={{ color: '#475569', marginTop: 12, fontWeight: '600' }}>Loading dashboard...</Text>
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 16 }} showsVerticalScrollIndicator={false}>

          {/* ═══════════════════════════════════════════ SUMMARY TAB ══ */}
          {tab === 'summary' && (
            <>
              {/* KPI Hero Card */}
              <View style={ad.heroCard}>
                <View style={ad.heroLeft}>
                  <Text style={ad.heroLabel}>All-Time Responses</Text>
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
                <ActivityIndicator size="large" color="#0A0A0A" style={{ marginTop: 20 }} />
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
                        <Text style={ad.sectionCardTitle}>📊  {MONTHS[selMonth - 1]} Ratings Breakdown</Text>
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
                        <Text style={ad.sectionCardTitle}>🍽️  {MONTHS[selMonth - 1]} Meal Distribution</Text>
                        {MEAL_ARR.map(m => {
                          const mc = MEAL_COLORS[m];
                          const mCount = monthlyData[`${m.toLowerCase().replace(/ /g, '_')}_count`] || 0;
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
              {/* Mode Toggle */}
              <View style={{ backgroundColor: '#FFFFFF', borderRadius: 12, padding: 4, flexDirection: 'row', borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 8 }}>
                <TouchableOpacity style={[ad.toggleBtn, filterMode === 'today' && ad.toggleBtnOn]} onPress={() => setFilterMode('today')}>
                  <Text style={[ad.toggleText, filterMode === 'today' && ad.toggleTextOn]}>Today's Records</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[ad.toggleBtn, filterMode === 'all' && ad.toggleBtnOn]} onPress={() => setFilterMode('all')}>
                  <Text style={[ad.toggleText, filterMode === 'all' && ad.toggleTextOn]}>All Records</Text>
                </TouchableOpacity>
              </View>

              {/* Filter bar */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {['All', 'Critical', ...MEAL_ARR].map(m => (
                    <TouchableOpacity
                      key={m}
                      style={[
                        ad.filterChip,
                        filterMeal === m && ad.filterChipOn,
                        m === 'Critical' && filterMeal === m && { backgroundColor: '#FEE2E2', borderColor: '#EF4444' },
                        m !== 'All' && m !== 'Critical' && filterMeal === m && { backgroundColor: MEAL_COLORS[m]?.color, borderColor: MEAL_COLORS[m]?.color },
                      ]}
                      onPress={() => setFilterMeal(m)}
                    >
                      <Text style={[
                        ad.filterChipText, 
                        filterMeal === m && ad.filterChipTextOn,
                        m === 'Critical' && filterMeal === m && { color: '#B91C1C' }
                      ]}>
                        {m === 'All' ? '🗂️  All' : m === 'Critical' ? '🔴 Critical' : `${MEAL_COLORS[m].emoji}  ${m}`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              {filteredFeedback.length === 0 ? (
                <View style={ad.emptyBox}>
                  <Text style={{ fontSize: 48, marginBottom: 10 }}>📭</Text>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A' }}>No Records Found</Text>
                  <Text style={{ fontSize: 13, color: '#64748b', marginTop: 6, textAlign: 'center' }}>
                    {filterMeal === 'All' 
                      ? `No feedback submitted ${filterMode === 'today' ? 'today' : 'yet'}.` 
                      : `No ${filterMeal} feedback submitted ${filterMode === 'today' ? 'today' : 'yet'}.`}
                  </Text>
                </View>
              ) : (
                filteredFeedback.map((item, idx) => {
                  const mc = MEAL_COLORS[item.meal_type] || { bg: '#F1F5F9', color: '#475569', border: '#E2E8F0', emoji: '🍽️' };
                  const avg = ([
                    item.food_quality, item.food_taste, item.food_hygiene,
                    item.staff_behavior, item.cleanliness,
                  ].reduce((a, b) => a + b, 0) / 5);
                  return (
                    <View key={item.id ?? idx} style={[ad.recordCard, item.is_critical === 1 && { borderColor: '#FECACA', borderWidth: 2, backgroundColor: '#FEF2F2' }]}>
                      <View style={ad.recordHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Text style={{ fontSize: 24 }}>{mc.emoji}</Text>
                          <View>
                            <Text style={[ad.mealPillText, { color: mc.color }]}>{item.meal_type}</Text>
                            <Text style={{ fontSize: 11, color: '#94a3b8', fontWeight: '500' }}>{item.feedback_date || 'Date N/A'}</Text>
                          </View>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                            <Text style={{ fontSize: 14, color: avg >= 4 ? '#10b981' : avg >= 3 ? '#f59e0b' : '#ef4444' }}>★</Text>
                            <Text style={[ad.recordScore, { color: avg >= 4 ? '#10b981' : avg >= 3 ? '#b45309' : '#b91c1c' }]}>{avg.toFixed(1)}</Text>
                          </View>
                          {item.is_critical === 1 && <Text style={{ fontSize: 10, color: '#ef4444', fontWeight: '800' }}>CRITICAL</Text>}
                        </View>
                      </View>
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

      {/* ── Export Modal ── */}
      <Modal visible={showExportOptions} transparent animationType="fade">
        <View style={ad.modalOverlay}>
          <View style={ad.exportModal}>
            <Text style={ad.exportModalTitle}>📥 Download Excel Report</Text>
            <TouchableOpacity style={ad.exportModalBtn} onPress={() => {
              const d = new Date().toISOString().slice(0, 10);
              handleExport(`from_date=${d}&to_date=${d}`);
            }}>
              <Text style={ad.exportModalBtnText}>📅 Today's Data</Text>
            </TouchableOpacity>
            <TouchableOpacity style={ad.exportModalBtn} onPress={() => {
              const d = new Date();
              const firstDay = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
              const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
              handleExport(`from_date=${firstDay}&to_date=${lastDay}`);
            }}>
              <Text style={ad.exportModalBtnText}>📆 This Month</Text>
            </TouchableOpacity>
            <TouchableOpacity style={ad.exportModalBtn} onPress={() => handleExport()}>
              <Text style={ad.exportModalBtnText}>🗂️ Overall Data</Text>
            </TouchableOpacity>
            <TouchableOpacity style={ad.exportModalCancel} onPress={() => setShowExportOptions(false)}>
              <Text style={ad.exportModalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const ad = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },

  // Header
  header: {
    backgroundColor: '#FFFFFF', paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 16 : 24,
    paddingBottom: 20, flexDirection: 'row',
    alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 },
  headerSub: { fontSize: 13, color: '#64748B', marginTop: 2, fontWeight: '600' },
  refreshIconBtn: { padding: 8, backgroundColor: '#F1F5F9', borderRadius: 12 },
  exportBtn: { backgroundColor: '#EFF6FF', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  exportText: { color: '#2563EB', fontSize: 13, fontWeight: '800' },
  logoutBtn: { backgroundColor: '#FEF2F2', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  logoutText: { color: '#DC2626', fontSize: 13, fontWeight: '800' },

  toggleBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: 'transparent', alignItems: 'center' },
  toggleBtnOn: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  toggleText: { fontSize: 14, fontWeight: '700', color: '#94A3B8' },
  toggleTextOn: { color: '#0F172A' },

  tabsScroll: { backgroundColor: 'transparent', paddingVertical: 16 },
  tabs: { paddingHorizontal: 20, gap: 12 },
  tab: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 24, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', elevation: 2, shadowColor: '#0F172A', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: {width: 0, height: 4} },
  tabOn: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  tabText: { fontSize: 14, fontWeight: '800', color: '#64748B' },
  tabTextOn: { color: '#FFFFFF' },

  heroCard: {
    backgroundColor: '#FFFFFF', borderRadius: 32, padding: 28,
    flexDirection: 'row', alignItems: 'center',
    elevation: 12, shadowColor: '#2563EB', shadowOpacity: 0.08, shadowRadius: 30, shadowOffset: { width: 0, height: 15 },
    borderWidth: 1, borderColor: '#E0E7FF',
  },
  heroLeft: { flex: 1, gap: 8 },
  heroLabel: { fontSize: 12, color: '#64748B', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  heroCount: { fontSize: 56, fontWeight: '900', color: '#0F172A', letterSpacing: -2 },
  healthBadge: { alignSelf: 'flex-start', borderRadius: 20, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 6 },
  healthBadgeText: { fontSize: 12, fontWeight: '800' },
  heroRight: { alignItems: 'center', gap: 4 },
  heroScoreEmoji: { fontSize: 48 },
  heroScore: { fontSize: 36, fontWeight: '900', color: '#2563EB', letterSpacing: -1 },
  heroScoreSub: { fontSize: 12, color: '#94A3B8', fontWeight: '700' },

  sectionCard: {
    backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24,
    elevation: 4, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 16, shadowOffset: {width: 0, height: 4},
    borderWidth: 1, borderColor: '#F1F5F9',
  },
  sectionCardTitle: { fontSize: 16, fontWeight: '900', color: '#0F172A', marginBottom: 20, letterSpacing: -0.5 },
  sectionTitle: { fontSize: 20, fontWeight: '900', color: '#0F172A', marginTop: 10, letterSpacing: -0.5, marginBottom: 8 },

  monthBtn: {
    backgroundColor: '#FFFFFF', borderRadius: 16, paddingHorizontal: 18, paddingVertical: 14,
    borderWidth: 1.5, borderColor: '#E2E8F0',
    elevation: 1, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5,
  },
  monthBtnOn: { backgroundColor: '#0F172A', borderColor: '#0F172A', elevation: 6, shadowOpacity: 0.15, shadowRadius: 10 },
  monthBtnTxt: { fontSize: 14, fontWeight: '800', color: '#64748B' },
  monthBtnTxtOn: { color: '#FFFFFF' },

  // Monthly Overview Hero Card
  monthOverviewCard: {
    backgroundColor: '#FFFFFF', borderRadius: 28, padding: 24,
    flexDirection: 'row', alignItems: 'stretch',
    elevation: 8, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 24, shadowOffset: { width: 0, height: 10 },
    borderWidth: 1, borderColor: '#E2E8F0',
    gap: 0,
  },
  monthOverviewLeft: { flex: 1, gap: 6, paddingRight: 16 },
  monthOverviewMonthLabel: { fontSize: 12, color: '#64748B', fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase' },
  monthOverviewCount: { fontSize: 50, fontWeight: '900', color: '#0F172A', letterSpacing: -2, lineHeight: 56 },
  monthOverviewCountLabel: { fontSize: 13, color: '#94A3B8', fontWeight: '700', marginTop: -6 },
  monthOverviewBadge: { alignSelf: 'flex-start', borderRadius: 20, borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 5, marginTop: 4 },
  monthOverviewBadgeText: { fontSize: 12, fontWeight: '800' },

  monthOverviewDivider: { width: 1, backgroundColor: '#F1F5F9', marginHorizontal: 0 },

  monthOverviewRight: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4, paddingLeft: 16 },
  monthOverviewMood: { fontSize: 42, lineHeight: 54, includeFontPadding: false },
  monthOverviewScore: { fontSize: 36, fontWeight: '900', color: '#2563EB', letterSpacing: -1, lineHeight: 42 },
  monthOverviewScoreSub: { fontSize: 12, color: '#94A3B8', fontWeight: '700' },
  monthOverviewBar: { width: '100%', height: 6, backgroundColor: '#F1F5F9', borderRadius: 6, marginTop: 6, overflow: 'hidden' },
  monthOverviewBarFill: { height: 6, backgroundColor: '#2563EB', borderRadius: 6 },

  // Meal dot indicator
  mealDot: { width: 10, height: 10, borderRadius: 5 },

  // Records tab
  filterChip: {
    borderRadius: 24, borderWidth: 1.5, borderColor: '#E2E8F0',
    paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#FFFFFF',
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 5, shadowOffset: {width:0, height:2}
  },
  filterChipOn: { borderColor: '#2563EB', backgroundColor: '#2563EB' },
  filterChipText: { fontSize: 14, fontWeight: '800', color: '#64748B' },
  filterChipTextOn: { color: '#FFFFFF' },

  recordCard: {
    backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20,
    gap: 12, elevation: 6, shadowColor: '#0F172A', shadowOpacity: 0.06, shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 }, borderWidth: 1, borderColor: '#F1F5F9',
  },
  recordHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  mealPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 22, paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 1.5,
  },
  mealPillText: { fontSize: 14, fontWeight: '900', letterSpacing: -0.3 },
  recordScore: { fontSize: 24, fontWeight: '900', letterSpacing: -1 },

  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  ratingLabel: { fontSize: 14, fontWeight: '700', color: '#64748B', flex: 1 },
  ratingVal: { fontSize: 15, fontWeight: '900', minWidth: 20, textAlign: 'right' },

  commentBox: { backgroundColor: '#F8FAFC', borderRadius: 16, padding: 16, borderLeftWidth: 4, borderLeftColor: '#CBD5E1', marginTop: 4 },
  commentLabel: { fontSize: 11, fontWeight: '800', color: '#94A3B8', marginBottom: 6, letterSpacing: 1, textTransform: 'uppercase' },
  commentText: { fontSize: 14, color: '#0F172A', fontStyle: 'italic', lineHeight: 22 },

  // Empty state
  emptyBox: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 64, paddingHorizontal: 24,
    backgroundColor: '#FFFFFF', borderRadius: 32,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 15,
    borderWidth: 2, borderColor: '#F1F5F9', borderStyle: 'dashed'
  },

  // Legacy (keep for safety)
  actionRow: { flexDirection: 'row', gap: 12 },
  actionCard: { flex: 1, borderRadius: 20, padding: 20, elevation: 4 },
  actionCardTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF', marginTop: 8 },
  actionCardSub: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 4, lineHeight: 18 },

  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.4)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  exportModal: { backgroundColor: '#FFFFFF', borderRadius: 32, padding: 32, width: '100%', maxWidth: 360, elevation: 20, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 30, shadowOffset: {width: 0, height: 10} },
  exportModalTitle: { fontSize: 20, fontWeight: '900', color: '#0F172A', marginBottom: 24, textAlign: 'center', letterSpacing: -0.5 },
  exportModalBtn: { backgroundColor: '#F8FAFC', borderRadius: 16, paddingVertical: 18, marginBottom: 12, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  exportModalBtnText: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  exportModalCancel: { marginTop: 12, paddingVertical: 16, alignItems: 'center' },
  exportModalCancelText: { fontSize: 16, fontWeight: '800', color: '#EF4444' },
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
        <View style={{ flex: 1 }}>
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
  left: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, paddingRight: 10 },
  emoji: { fontSize: 22 },
  label: { fontSize: 14, fontWeight: '700', color: '#2D3748', flexShrink: 1, flexWrap: 'wrap' },
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
  const [lang, setLang] = useState('en');
  const t = (k) => TRANSLATIONS[lang][k] || TRANSLATIONS.en[k];

  const detectedMeal = detectMealType();
  const [ratings, setRatings] = useState({ ...INITIAL_RATINGS });
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);
  const [screen, setScreen] = useState('form');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  // Old validation logic (disabled) — comment was mandatory when ANY individual rating was ≤ 2
  // const anyRatingIsLow = Object.values(ratings).some(v => v > 0 && v <= 2);
  // const commentRequired = anyRatingIsLow;

  // New validation logic — comment is mandatory ONLY when overall average rating is ≤ 2
  const overallAvg = Object.values(ratings).filter(v => v > 0).reduce((a, b) => a + b, 0) /
    (Object.values(ratings).filter(v => v > 0).length || 1);
  const commentRequired = overallAvg > 0 && overallAvg <= 2;
  const isLowFeedback = overallAvg > 0 && overallAvg < 3;

  const showSuccess = () => {
    setScreen('success');
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 100 }),
    ]).start();
    setTimeout(() => {
      setScreen('form');
      setRatings({ ...INITIAL_RATINGS }); setComments('');
      fadeAnim.setValue(0); slideAnim.setValue(40);
    }, 4000);
  };

  const submit = async () => {
    const missing = RATING_FIELDS.filter(f => ratings[f.key] === 0);
    if (missing.length) {
      Alert.alert(t('missingRatings'), t('pleaseRate'));
      return;
    }
    // Old validation logic (disabled) — blocked submit when ANY individual rating ≤ 2 and no comment
    // if (commentRequired && !comments.trim()) {
    //   Alert.alert(t('commentNeeded'), t('commentNeededMsg'));
    //   return;
    // }

    // New validation logic (disabled) — comment mandatory when overall avg ≤ 2 (re-enable in future if needed)
    // if (commentRequired && !comments.trim()) {
    //   Alert.alert(t('commentNeeded'), t('commentNeededMsg'));
    //   return;
    // }
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          canteen_name:  'Main Canteen',
          canteen_id:    1,
          meal_type:     detectedMeal.label,
          food_quality:  ratings.food_quality,
          food_taste:    ratings.food_taste,
          cleanliness:   ratings.cleanliness,
          staff_behavior:ratings.staff_behavior,
          food_hygiene:  ratings.food_hygiene,
          comments:      comments.trim() || null,
        }),
      });
      if (!res.ok) throw new Error('Server error');
      setLoading(false);
      showSuccess();
    } catch (e) {
      setLoading(false);
      Alert.alert(t('connErr'), `${t('connErrMsg')}\n${apiUrl}`);
    }
  };

  if (screen === 'success') return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A2E" />
      <View style={s.successPage}>
        <Animated.View style={[s.successBox, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={s.successBigEmoji}>🎉</Text>
          <Text style={s.successTitle}>{t('successTitle')}</Text>
          <Text style={s.successSub}>{t('successSub')}</Text>
          {/* anonNote removed — 'No personal data collected' pill hidden */}
          <Text style={s.resetNote}>{t('resetNote')}</Text>
        </Animated.View>
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A2E" />
      <View style={s.header}>
        <View style={s.headerLeft}>
          <Text style={[s.headerIcon, { fontSize: 24, marginRight: 4 }]}>🍽️</Text>
          <View style={{ flexShrink: 1 }}>
            <Text style={s.headerTitle} numberOfLines={1} adjustsFontSizeToFit>{t('headerTitle')}</Text>
            <Text style={s.headerSub}>{t('headerSub')}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 10 }}>
          <TouchableOpacity
            style={[s.langBtn, { backgroundColor: lang === 'ta' ? '#7B1FA2' : '#1565C0', marginRight: 10 }]}
            onPress={() => setLang(l => l === 'en' ? 'ta' : 'en')}
          >
            <Text style={s.langBtnText}>{lang === 'en' ? 'தமிழ்' : 'EN'}</Text>
          </TouchableOpacity>
          {onBack ? (
            <TouchableOpacity style={s.backBtn} onPress={onBack}>
              <Text style={s.logoutText}>{t('back')}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={s.logoutBtn} onPress={onLogout}>
              <Text style={s.logoutText}>{t('logout')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* ── Auto-Detected Meal Type ── */}
          <View style={[s.mealDetectCard, { borderColor: detectedMeal.color }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Text style={{ fontSize: 36 }}>{detectedMeal.emoji}</Text>
              <View style={{ flex: 1 }}>
                {/* mealDetected label removed — only emoji + meal name shown */}
                <Text style={[s.mealDetectName, { color: detectedMeal.color }]}>
                  {/* Use translated meal name if available (Tamil), else fall back to English label */}
                  {t(detectedMeal.label) || detectedMeal.label}
                </Text>
              </View>
              <View style={[s.mealDetectBadge, { backgroundColor: detectedMeal.color + '20', borderColor: detectedMeal.color }]}>
                <Text style={{ fontSize: 10, color: detectedMeal.color, fontWeight: '800' }}>AUTO</Text>
              </View>
            </View>
          </View>

          {/* ── Low Feedback Warning ── */}
          {isLowFeedback && (
            <View style={s.lowFeedbackBanner}>
              <Text style={s.lowFeedbackText}>{t('lowFeedback')} — {overallAvg.toFixed(1)}/5</Text>
            </View>
          )}

          <View style={s.card}>
            <Text style={s.cardTitle}>{t('rateExperience')}</Text>
            <Text style={s.cardHint}>{t('tapStars')}</Text>
            {RATING_FIELDS.map(f => (
              <StarRow key={f.key} emoji={f.emoji} label={t(f.key)}
                value={ratings[f.key]}
                onChange={v => setRatings(p => ({ ...p, [f.key]: v }))} />
            ))}
          </View>

          <OverallBar ratings={ratings} />

          {/* Old validation UI (disabled) — red border/banner shown when ANY individual rating ≤ 2 */}
          {/* <View style={[s.card, commentRequired && { borderWidth: 2, borderColor: '#E53E3E' }]}> */}
          {/*   <Text style={s.cardTitle}>{t('addComments')}</Text> */}
          {/*   {commentRequired && ( */}
          {/*     <View style={s.criticalBanner}> */}
          {/*       <Text style={s.criticalBannerText}>{t('criticalAlert')}</Text> */}
          {/*     </View> */}
          {/*   )} */}
          {/*   ... */}
          {/* </View> */}

          {/* Comment UI — comment is fully OPTIONAL in the UI.
               Red border and criticalBanner are hidden/disabled below.
               The backend still enforces a comment when overall avg ≤ 2,
               but the UI shows no mandatory indicators to the user. */}

          {/* Old comment UI with red border + criticalBanner (disabled) */}
          {/* <View style={[s.card, commentRequired && { borderWidth: 2, borderColor: '#E53E3E' }]}> */}
          {/*   <Text style={s.cardTitle}>{t('addComments')}</Text> */}
          {/*   {commentRequired && ( */}
          {/*     <View style={s.criticalBanner}> */}
          {/*       <Text style={s.criticalBannerText}>{t('criticalAlert')}</Text> */}
          {/*     </View> */}
          {/*   )} */}
          {/*   ... */}
          {/* </View> */}

          {/* New comment UI — fully optional appearance, no red border, no critical banner */}
          <View style={s.card}>
            <Text style={s.cardTitle}>{t('addComments')}</Text>
            <TextInput
              style={s.textarea}
              multiline numberOfLines={4} maxLength={500}
              placeholder={t('commentOptional')}
              placeholderTextColor="#A0AEC0"
              value={comments} onChangeText={setComments} textAlignVertical="top"
            />
            <Text style={s.charCount}>
              {comments.length} / 500
            </Text>
          </View>

          {/* Old submit button logic (disabled) — button went grey when comment was missing for low individual ratings */}
          {/* <TouchableOpacity */}
          {/*   style={[s.submitBtn, loading && s.submitOff, */}
          {/*     commentRequired && !comments.trim() && { backgroundColor: '#9AE6B4' }]} */}
          {/*   onPress={submit} disabled={loading} activeOpacity={0.85} */}
          {/* > */}

          {/* New submit button — only dims when loading; no grey-out for missing optional comment */}
          <TouchableOpacity
            style={[s.submitBtn, loading && s.submitOff]}
            onPress={submit} disabled={loading} activeOpacity={0.85}
          >
            <Text style={s.submitText}>{loading ? t('submitting') : t('submit')}</Text>
          </TouchableOpacity>

          {/* footer text removed */}
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
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 16 : 24,
    paddingBottom: 16, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 4 },
  headerIcon: { fontSize: 32 },
  headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
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
  langBtn: { borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
  langBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  mealDetectCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 2,
    elevation: 4, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10,
  },
  mealDetectLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  mealDetectName:  { fontSize: 20, fontWeight: '900', marginTop: 2 },
  mealDetectBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1.5 },
  criticalBanner: {
    backgroundColor: '#FFF5F5', borderRadius: 10, padding: 10,
    borderLeftWidth: 4, borderLeftColor: '#E53E3E',
  },
  criticalBannerText: { color: '#9B2C2C', fontSize: 12, fontWeight: '700' },
  lowFeedbackBanner: {
    backgroundColor: '#FFFBEB', borderRadius: 12, padding: 12,
    borderLeftWidth: 4, borderLeftColor: '#F6AD55', flexDirection: 'row', alignItems: 'center',
  },
  lowFeedbackText: { color: '#744210', fontSize: 13, fontWeight: '700' },
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
    if (Platform.OS === 'web') {
      setApiUrl('http://localhost:8000');
    } else {
      AsyncStorage.getItem(STORAGE_KEY).then(saved => { if (saved) setApiUrl(saved); });
    }
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