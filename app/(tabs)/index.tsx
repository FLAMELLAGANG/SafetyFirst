import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Animated,
  Platform,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/lib/auth-context';
import { Colors, Fonts, MedicalEmergencyTypes, MedicalEmergencyType } from '@/constants/theme';
import { Bell, Settings } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const CARD_GAP = 10;
const CARD_WIDTH = (width - 48 - CARD_GAP) / 2;

export default function HomeScreen() {
  const { profile, isResponder } = useAuth();
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<MedicalEmergencyType | null>(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnims = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  useEffect(() => {
    if (isResponder) return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    );
    pulse.start();

    const waveLoop = Animated.loop(
      Animated.stagger(800, waveAnims.map(anim =>
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: 2000, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      ))
    );
    waveLoop.start();

    return () => { pulse.stop(); waveLoop.stop(); };
  }, [isResponder]);

  // Redirect responders to alerts screen
  useFocusEffect(
    React.useCallback(() => {
      if (isResponder) {
        router.replace('/(tabs)/emergencies');
      }
    }, [isResponder])
  );

  // Don't render anything for responders
  if (isResponder) {
    return null;
  }

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handleSOS = () => {
    if (!selectedType) return;
    const type = MedicalEmergencyTypes[selectedType];
    router.push({
      pathname: '/emergency/report',
      params: { medicalType: selectedType, label: type.label },
    });
  };

  const mainTypes = (Object.keys(MedicalEmergencyTypes) as MedicalEmergencyType[]).filter(k => k !== 'other');
  const otherType = MedicalEmergencyTypes.other;

  return (
    <LinearGradient colors={['#000000', '#0D0000', '#000000']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{getGreeting()},</Text>
          <Text style={styles.userName}>{profile?.full_name || 'User'} 👋</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.push('/(tabs)/emergencies')}>
            <Bell color={Colors.text} size={22} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.push('/(tabs)/profile')}>
            <Settings color={Colors.text} size={22} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* SOS Zone */}
        <View style={styles.sosZone}>
          {/* Wave rings */}
          <View style={styles.sosOuter}>
            {waveAnims.map((anim, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.wave,
                  {
                    opacity: anim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 0.8, 0] }),
                    transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.5] }) }],
                  },
                ]}
              />
            ))}
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity
                onPress={handleSOS}
                activeOpacity={0.85}
                disabled={!selectedType}
              >
                <LinearGradient
                  colors={selectedType ? ['#C01020', '#74070E', '#3A0005'] : ['#2A2A2A', '#1A1A1A']}
                  style={styles.sosCore}
                >
                  <Text style={styles.sosLabel}>SOS</Text>
                  <Text style={styles.sosHint}>
                    {selectedType ? 'TAP TO SEND' : 'SELECT TYPE'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </View>

          <Text style={styles.selectHint}>
            {selectedType
              ? `Type: ${MedicalEmergencyTypes[selectedType].label}`
              : 'Select the type so responders can prepare'}
          </Text>
        </View>

        {/* Emergency Type Grid */}
        <View style={styles.gridSection}>
          <View style={styles.grid}>
            {mainTypes.map((key) => {
              const type = MedicalEmergencyTypes[key];
              const selected = selectedType === key;
              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => setSelectedType(selected ? null : key)}
                  activeOpacity={0.8}
                  style={[styles.card, selected && styles.cardSelected]}
                >
                  <LinearGradient
                    colors={[type.gradientStart, type.gradientEnd]}
                    style={styles.cardVisual}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.cardEmoji}>{type.emoji}</Text>
                  </LinearGradient>
                  <View style={styles.cardBody}>
                    <Text style={styles.cardLabel}>{type.label}</Text>
                  </View>
                  {selected && <View style={styles.selectedIndicator} />}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Other Emergency — full width row */}
          <TouchableOpacity
            onPress={() => setSelectedType(selectedType === 'other' ? null : 'other')}
            activeOpacity={0.8}
            style={[styles.otherCard, selectedType === 'other' && styles.cardSelected]}
          >
            <LinearGradient
              colors={[otherType.gradientStart, otherType.gradientEnd]}
              style={styles.otherVisual}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.otherEmoji}>{otherType.emoji}</Text>
            </LinearGradient>
            <View style={styles.otherBody}>
              <Text style={styles.cardLabel}>{otherType.label}</Text>
              <Text style={styles.otherSubtitle}>{otherType.subtitle}</Text>
            </View>
            {selectedType === 'other' && <View style={styles.selectedIndicator} />}
          </TouchableOpacity>
        </View>

        {/* Send SOS Button */}
        <View style={styles.sendSection}>
          <TouchableOpacity
            onPress={handleSOS}
            activeOpacity={0.8}
            disabled={!selectedType}
            style={[styles.sendBtn, !selectedType && styles.sendBtnDisabled]}
          >
            <LinearGradient
              colors={selectedType ? ['#74070E', '#C01020'] : ['#2A2A2A', '#2A2A2A']}
              style={styles.sendBtnInner}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={[styles.sendBtnText, !selectedType && styles.sendBtnTextDisabled]}>
                SEND SOS NOW →
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 22,
    paddingTop: 60,
    paddingBottom: 8,
  },
  greeting: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  userName: {
    fontFamily: Fonts.heading,
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 2,
  },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: { paddingBottom: 100 },
  sosZone: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  sosOuter: {
    width: 230,
    height: 230,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wave: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 1.5,
    borderColor: 'rgba(116,7,14,0.4)',
  },
  sosCore: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#74070E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 30,
    elevation: 20,
  },
  sosLabel: {
    fontFamily: Fonts.heading,
    fontSize: 40,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 4,
  },
  sosHint: {
    fontFamily: Fonts.body,
    fontSize: 9,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1.5,
    marginTop: 4,
  },
  selectHint: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    letterSpacing: 0.5,
  },
  gridSection: {
    paddingHorizontal: 20,
    marginTop: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
    marginBottom: CARD_GAP,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.06)',
    backgroundColor: '#0D0D0D',
  },
  cardSelected: {
    borderColor: '#C01020',
    shadowColor: '#74070E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  cardVisual: {
    width: '100%',
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  cardEmoji: {
    fontSize: 34,
  },
  cardBody: {
    padding: 10,
    paddingTop: 8,
  },
  cardLabel: {
    fontFamily: Fonts.heading,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#C01020',
  },
  otherCard: {
    flexDirection: 'row',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.06)',
    backgroundColor: '#0D0D0D',
    minHeight: 70,
  },
  otherVisual: {
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 0,
  },
  otherEmoji: {
    fontSize: 28,
  },
  otherBody: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  otherSubtitle: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 3,
    lineHeight: 16,
  },
  sendSection: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  sendBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
  sendBtnInner: {
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnText: {
    fontFamily: Fonts.heading,
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  sendBtnTextDisabled: {
    color: Colors.textMuted,
  },
});
