import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';

/**
 * StarRating — Reusable 1-5 star selector component
 *
 * Props:
 *   label    {string}   — Row label, e.g. "Food Quality"
 *   value    {number}   — Currently selected rating (0 = none selected)
 *   onChange {function} — Called with new rating (1-5) when star is tapped
 */
const StarRating = ({ label, value, onChange }) => {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => onChange(star)}
            style={styles.starTouch}
            activeOpacity={0.7}
            accessibilityLabel={`Rate ${label} ${star} star${star > 1 ? 's' : ''}`}
          >
            <Text style={[styles.star, star <= value ? styles.starFilled : styles.starEmpty]}>
              {star <= value ? '★' : '☆'}
            </Text>
          </TouchableOpacity>
        ))}
        {value > 0 && (
          <Text style={styles.ratingText}>{value}/5</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginVertical: 4,
    backgroundColor: '#FFFFFF',
    borderRadius:   10,
    shadowColor:    '#000',
    shadowOpacity:  0.05,
    shadowRadius:   4,
    shadowOffset:   { width: 0, height: 2 },
    elevation:      2,
  },
  label: {
    fontSize:   17,
    fontWeight: '600',
    color:      '#2D3748',
    width:      150,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           4,
  },
  starTouch: {
    padding:     4,
    minWidth:    48,  // large touch target for tablet
    minHeight:   48,
    alignItems:  'center',
    justifyContent: 'center',
  },
  star: {
    fontSize:   40,   // large for tablet use
  },
  starFilled: {
    color: '#FFD700',  // gold
  },
  starEmpty: {
    color: '#CCCCCC',  // light gray
  },
  ratingText: {
    fontSize:   15,
    fontWeight: '700',
    color:      '#F6821F',
    marginLeft: 8,
    width:      36,
  },
});

export default StarRating;
