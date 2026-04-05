import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Animated,
  Platform,
  KeyboardAvoidingView,
  StatusBar,
} from 'react-native';
import StarRating from '../components/StarRating';

// ────────────────────────────────────────────────────────────
// ⚠️  UPDATE THIS to your PC's local IP address
//     Run `ipconfig` on your PC and use the IPv4 address
//     Example: http://192.168.1.100:8000
// ────────────────────────────────────────────────────────────
const API_URL = 'http://10.100.201.76:8000';

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner'];

const RATING_FIELDS = [
  { key: 'food_quality', label: 'Food Quality' },
  { key: 'food_taste', label: 'Food Taste' },
  { key: 'food_hygiene', label: 'Food Hygiene' },
  { key: 'staff_behavior', label: 'Staff Behavior' },
  { key: 'hospitality', label: 'Hospitality' },
];

const initialRatings = {
  food_quality: 0,
  food_taste: 0,
  food_hygiene: 0,
  staff_behavior: 0,
  hospitality: 0,
};

const FeedbackScreen = () => {
  const [mealType, setMealType] = useState('');
  const [ratings, setRatings] = useState({ ...initialRatings });
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const successOpacity = useRef(new Animated.Value(0)).current;

  // ── Reset form ────────────────────────────────────────────
  const resetForm = () => {
    setMealType('');
    setRatings({ ...initialRatings });
    setComments('');
  };

  // ── Show success animation then reset ─────────────────────
  const showSuccess = () => {
    setSubmitted(true);
    Animated.sequence([
      Animated.timing(successOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.delay(1800),
      Animated.timing(successOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start(() => {
      setSubmitted(false);
      resetForm();
    });
  };

  // ── Validate ──────────────────────────────────────────────
  const validate = () => {
    if (!mealType) {
      Alert.alert('Incomplete', 'Please select a meal type (Breakfast, Lunch, or Dinner).');
      return false;
    }
    const missing = RATING_FIELDS.filter(f => ratings[f.key] === 0).map(f => f.label);
    if (missing.length > 0) {
      Alert.alert('Incomplete', `Please rate the following:\n\n• ${missing.join('\n• ')}`);
      return false;
    }
    return true;
  };

  // ── Submit ────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);

    const payload = {
      canteen_name: 'Main Canteen',
      canteen_id: 1,
      meal_type: mealType,
      food_quality: ratings.food_quality,
      food_taste: ratings.food_taste,
      food_hygiene: ratings.food_hygiene,
      staff_behavior: ratings.staff_behavior,
      hospitality: ratings.hospitality,
      comments: comments.trim() || null,
      // ⚠️ NO name, email, ID, device info — fully anonymous
    };

    try {
      const res = await fetch(`${API_URL}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Submission failed');
      }

      setLoading(false);
      showSuccess();
    } catch (error) {
      setLoading(false);
      Alert.alert(
        'Error',
        `Could not submit feedback.\n\nMake sure the backend server is running at:\n${API_URL}\n\nError: ${error.message}`,
      );
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A2E" />

      {/* ── Header ──────────────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🍽️ Canteen Feedback</Text>
        <Text style={styles.headerSub}>Your opinion helps us serve you better</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* ── Anonymity notice ──────────────────────────────── */}
          <View style={styles.anonymityCard}>
            <Text style={styles.anonymityIcon}>🔒</Text>
            <Text style={styles.anonymityText}>
              This feedback is completely anonymous. No personal data is collected.
            </Text>
          </View>

          {/* ── Meal Type Selector ────────────────────────────── */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Meal Type</Text>
            <View style={styles.mealRow}>
              {MEAL_TYPES.map((mt) => (
                <TouchableOpacity
                  key={mt}
                  style={[styles.mealBtn, mealType === mt && styles.mealBtnActive]}
                  onPress={() => setMealType(mt)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.mealBtnText, mealType === mt && styles.mealBtnTextActive]}>
                    {mt === 'Breakfast' ? '🌅' : mt === 'Lunch' ? '☀️' : '🌙'} {mt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ── Star Ratings ──────────────────────────────────── */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Rate Your Experience</Text>
            <Text style={styles.sectionHint}>Tap stars to rate (1 = Poor, 5 = Excellent)</Text>
            {RATING_FIELDS.map((field) => (
              <StarRating
                key={field.key}
                label={field.label}
                value={ratings[field.key]}
                onChange={(val) => setRatings(prev => ({ ...prev, [field.key]: val }))}
              />
            ))}
          </View>

          {/* ── Comments ──────────────────────────────────────── */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Additional Comments</Text>
            <TextInput
              style={styles.textArea}
              multiline
              numberOfLines={4}
              maxLength={500}
              placeholder="Any additional comments? (Optional)"
              placeholderTextColor="#A0AEC0"
              value={comments}
              onChangeText={setComments}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{comments.length}/500</Text>
          </View>

          {/* ── Submit Button ─────────────────────────────────── */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.submitBtnText}>
              {loading ? '⏳  Submitting...' : '✅  Submit Feedback'}
            </Text>
          </TouchableOpacity>

          {/* ── Success Message ───────────────────────────────── */}
          {submitted && (
            <Animated.View style={[styles.successCard, { opacity: successOpacity }]}>
              <Text style={styles.successIcon}>🎉</Text>
              <Text style={styles.successTitle}>Thank You!</Text>
              <Text style={styles.successText}>
                Your feedback has been submitted anonymously.{'\n'}
                The form will reset in a moment.
              </Text>
            </Animated.View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F0F4F8',
  },

  // Header
  header: {
    backgroundColor: '#1A1A2E',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 24,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerSub: {
    color: '#A0AEC0',
    fontSize: 14,
    marginTop: 4,
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: {
    padding: 16,
    gap: 14,
  },

  // Anonymity card
  anonymityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF8FF',
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#3182CE',
    gap: 10,
  },
  anonymityIcon: { fontSize: 24 },
  anonymityText: {
    flex: 1,
    color: '#2C5282',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },

  // Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A202C',
  },
  sectionHint: {
    fontSize: 13,
    color: '#718096',
    marginTop: -6,
  },

  // Meal type
  mealRow: {
    flexDirection: 'row',
    gap: 10,
  },
  mealBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#EDF2F7',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  mealBtnActive: {
    backgroundColor: '#FFF3E0',
    borderColor: '#F6821F',
  },
  mealBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4A5568',
  },
  mealBtnTextActive: {
    color: '#C05621',
  },

  // Text area
  textArea: {
    backgroundColor: '#F7FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    fontSize: 15,
    color: '#2D3748',
    minHeight: 100,
  },
  charCount: {
    textAlign: 'right',
    fontSize: 12,
    color: '#A0AEC0',
  },

  // Submit button
  submitBtn: {
    backgroundColor: '#38A169',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#38A169',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  submitBtnDisabled: {
    backgroundColor: '#9AE6B4',
    elevation: 0,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // Success
  successCard: {
    backgroundColor: '#F0FFF4',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#38A169',
    gap: 8,
  },
  successIcon: { fontSize: 48 },
  successTitle: { fontSize: 22, fontWeight: '800', color: '#276749' },
  successText: { fontSize: 15, color: '#2F855A', textAlign: 'center', lineHeight: 22 },
});

export default FeedbackScreen;
