import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts } from '@/constants/theme';
import { X, ChevronLeft } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const CARD_GAP = 10;
const CARD_W = (width - 48 - CARD_GAP) / 2;

type Guide = {
  id: string;
  label: string;
  subtitle: string;
  emoji: string;
  gradientStart: string;
  gradientEnd: string;
  severity: string;
  severityColor: string;
  facts: { icon: string; label: string; value: string }[];
  steps: { action: string; desc: string }[];
  dos: string[];
  donts: string[];
  warning: string;
};

const guides: Guide[] = [
  {
    id: 'cardiac',
    label: 'Cardiac Arrest',
    subtitle: 'CPR & resuscitation',
    emoji: '❤️',
    gradientStart: '#3A0005',
    gradientEnd: '#74070E',
    severity: '🔴 CRITICAL — Act within 4 minutes',
    severityColor: '#FF6B6B',
    facts: [
      { icon: '⏱️', label: 'Time Critical', value: '4 minutes' },
      { icon: '💪', label: 'CPR Rate', value: '100–120/min' },
      { icon: '🔁', label: 'Cycle', value: '30:2 ratio' },
      { icon: '📍', label: 'Compress Depth', value: '5–6 cm' },
    ],
    steps: [
      { action: 'Assess & Call', desc: 'Tap shoulders firmly and shout "Are you okay?" If unresponsive, trigger SOS immediately and shout for help.' },
      { action: 'Check Breathing', desc: 'Tilt the head back, lift the chin and look, listen and feel for normal breathing for no more than 10 seconds.' },
      { action: 'Position Hands', desc: 'Kneel beside the person. Place the heel of your dominant hand on the centre of their chest, between the nipples. Interlock your other hand on top.' },
      { action: 'Begin Compressions', desc: 'Keep arms straight, push hard and fast — compress 5–6 cm deep at 100–120 per minute. Allow full chest recoil between compressions.' },
      { action: 'Rescue Breaths (if trained)', desc: 'After 30 compressions, give 2 rescue breaths. Tilt head, close nostrils, seal your mouth over theirs, breathe in for 1 second. Watch chest rise.' },
      { action: 'Continue Without Stopping', desc: 'Continue 30:2 cycle without stopping. If others are present, take turns every 2 minutes to avoid fatigue. Do not stop until help arrives.' },
    ],
    dos: ['Start CPR immediately', 'Push hard and fast', 'Let chest fully rise', 'Use AED if available'],
    donts: ['Stop CPR prematurely', 'Give up — keep going', 'Compress too gently', 'Delay calling SOS'],
    warning: 'Brain damage begins within 4–6 minutes of cardiac arrest. Every second without CPR reduces survival by 10%. Act immediately.',
  },
  {
    id: 'breathing',
    label: 'Breathing Difficulty',
    subtitle: 'Airway management',
    emoji: '🌬️',
    gradientStart: '#001a3a',
    gradientEnd: '#0a4a8a',
    severity: '🔴 CRITICAL — Airway is priority',
    severityColor: '#FF6B6B',
    facts: [
      { icon: '🧍', label: 'Position', value: 'Sit upright' },
      { icon: '👔', label: 'Clothing', value: 'Loosen tight' },
      { icon: '💊', label: 'Inhaler', value: 'Assist if has one' },
      { icon: '🚫', label: 'Avoid', value: 'Laying flat' },
    ],
    steps: [
      { action: 'Call for Help', desc: 'Trigger SOS immediately. Do not wait to see if it improves — breathing emergencies escalate fast.' },
      { action: 'Sit Them Upright', desc: 'Help the person sit up straight or slightly forward. This opens the airways. Never lay them flat — it worsens breathing.' },
      { action: 'Loosen Clothing', desc: 'Undo any tight buttons, ties, or belts around the neck and chest to ease breathing restriction immediately.' },
      { action: 'Use Inhaler if Available', desc: 'If the person has an asthma inhaler — shake it, place in mouth, press down as they inhale slowly. Wait 60 seconds. Repeat up to 3 times if needed.' },
      { action: 'Encourage Slow Breathing', desc: 'Say calmly: "Breathe in slowly through your nose, out through your mouth." Guide them. Panic makes breathing harder.' },
      { action: 'If Unconscious', desc: 'If they lose consciousness, place them in the recovery position (on their side). Begin CPR only if they stop breathing completely.' },
    ],
    dos: ['Keep them calm', 'Sit them upright', 'Assist with inhaler', 'Stay with them'],
    donts: ['Lay them down flat', 'Leave them alone', 'Give food or water', 'Panic or shout'],
    warning: 'Blue lips or fingertips (cyanosis), inability to speak in full sentences, or loss of consciousness — these require immediate CPR.',
  },
  {
    id: 'trauma',
    label: 'Accident / Trauma',
    subtitle: 'Wound care & stabilization',
    emoji: '🩹',
    gradientStart: '#1A001A',
    gradientEnd: '#4A0030',
    severity: '🟠 HIGH — Control bleeding first',
    severityColor: '#F0A500',
    facts: [
      { icon: '🩸', label: 'Priority', value: 'Stop bleeding' },
      { icon: '🚫', label: 'Movement', value: 'Do not move' },
      { icon: '🌡️', label: 'Warmth', value: 'Keep warm' },
      { icon: '👁️', label: 'Monitor', value: 'Breathing & pulse' },
    ],
    steps: [
      { action: 'Ensure Safety', desc: 'Make sure the scene is safe for you to approach. If there is a vehicle accident, watch for traffic. Do not become a second victim.' },
      { action: 'Do Not Move Them', desc: 'Unless they are in immediate danger (fire, drowning), do not move the person. A spinal injury could be worsened by movement.' },
      { action: 'Control Bleeding', desc: 'Apply firm, direct pressure to any bleeding wounds using a clean cloth, bandage, or clothing. Press hard and do not lift to check — maintain pressure continuously.' },
      { action: 'Do Not Remove Objects', desc: 'If an object is embedded in a wound (glass, metal), do NOT remove it. It may be preventing further bleeding. Stabilise it and press around it.' },
      { action: 'Treat for Shock', desc: 'Lay them flat (unless injuries prevent this), elevate legs slightly, keep them warm with a blanket or jacket. Speak reassuringly and keep them conscious.' },
      { action: 'Monitor Until Help Arrives', desc: 'Watch breathing, pulse, and consciousness every minute. Record any changes to report to the responder when they arrive.' },
    ],
    dos: ['Apply firm pressure', 'Keep them warm', 'Talk to them calmly', 'Monitor breathing'],
    donts: ['Remove embedded objects', 'Move unnecessarily', 'Give food or water', 'Leave them alone'],
    warning: 'Pale or clammy skin, rapid weak pulse, confusion, rapid breathing — these are signs of shock. Lay flat, keep warm, call SOS urgently.',
  },
  {
    id: 'seizure',
    label: 'Seizure',
    subtitle: 'Safety & timing steps',
    emoji: '⚡',
    gradientStart: '#1A1200',
    gradientEnd: '#5A4400',
    severity: '🟠 HIGH — Protect, time, observe',
    severityColor: '#F0A500',
    facts: [
      { icon: '⏱️', label: 'Time It', value: 'Start timer now' },
      { icon: '🚫', label: 'Never Restrain', value: 'Do not hold down' },
      { icon: '🔄', label: 'After Seizure', value: 'Recovery position' },
      { icon: '🆘', label: 'Call SOS if', value: 'Over 5 minutes' },
    ],
    steps: [
      { action: 'Start Timing Immediately', desc: 'As soon as you see the seizure begin, start a timer. If it lasts more than 5 minutes, or the person has no history of seizures, call SOS urgently.' },
      { action: 'Clear the Area', desc: 'Remove all hard, sharp, or hot objects from around them. Move furniture away. Create a safe space of at least 1 metre around the person.' },
      { action: 'Cushion the Head', desc: 'Place something soft — a folded jacket or cushion — under their head to prevent injury. Do not hold the head still or force it into position.' },
      { action: 'Do Not Restrain', desc: 'Never hold the person down, pin their arms, or try to stop the convulsions. This can cause injuries. Let the seizure run its course safely.' },
      { action: 'Never Put Anything in Mouth', desc: 'Do NOT put fingers, a spoon, or any object in their mouth. People cannot swallow their tongue. You risk serious injury to both.' },
      { action: 'Recovery Position After', desc: 'Once the seizure stops, gently roll them onto their side (recovery position) to keep the airway clear. They may be confused — speak gently and stay with them.' },
    ],
    dos: ['Time the seizure', 'Cushion the head', 'Clear the area', 'Stay and reassure'],
    donts: ['Restrain them', 'Put things in mouth', 'Give water during', 'Leave them alone'],
    warning: 'Seizure lasts more than 5 minutes • Person does not wake up after • Second seizure begins immediately • Person is injured or pregnant.',
  },
  {
    id: 'poisoning',
    label: 'Poisoning',
    subtitle: "Do's & don'ts",
    emoji: '☠️',
    gradientStart: '#001A00',
    gradientEnd: '#0A4A0A',
    severity: '🔴 CRITICAL — Do NOT induce vomiting',
    severityColor: '#FF6B6B',
    facts: [
      { icon: '🚫', label: 'Never', value: 'Induce vomiting' },
      { icon: '📦', label: 'Collect', value: 'Container/substance' },
      { icon: '🧍', label: 'Position', value: 'Keep still' },
      { icon: '🕐', label: 'Note Time', value: 'When ingested' },
    ],
    steps: [
      { action: 'Call SOS Immediately', desc: 'Do not wait for symptoms to worsen. Poisoning can be fast-acting. Trigger SOS and describe what was taken and when.' },
      { action: 'Identify the Poison', desc: 'Collect any containers, bottles, or substances nearby. Note the name, quantity, and time of ingestion. This information is critical for the responder.' },
      { action: 'Do NOT Induce Vomiting', desc: 'Unless specifically instructed by a medical professional. Vomiting corrosive substances (bleach, acids, batteries) causes more damage on the way back up.' },
      { action: 'If on Skin — Rinse Immediately', desc: 'For chemical contact on skin — remove contaminated clothing carefully and rinse affected area with large amounts of clean water for at least 20 minutes.' },
      { action: 'If Inhaled — Fresh Air', desc: 'Move person away from fumes to fresh air immediately. Loosen clothing. If breathing stops, begin CPR. Do not enter a fume-filled space without protection.' },
      { action: 'Monitor Closely', desc: 'Keep the person awake and still. Watch for vomiting, seizures, or loss of consciousness. Place in recovery position if they become unresponsive but are breathing.' },
    ],
    dos: ['Collect the container', 'Note time & amount', 'Rinse skin contact', 'Stay with them'],
    donts: ['Induce vomiting', 'Give food or milk', 'Leave them alone', 'Enter fume spaces'],
    warning: 'For household chemical poisoning, battery acid, or pesticides — NEVER give milk or induce vomiting. These require emergency medical treatment only.',
  },
  {
    id: 'maternity',
    label: 'Maternity',
    subtitle: 'Labour support',
    emoji: '🤱',
    gradientStart: '#1A0012',
    gradientEnd: '#6B0035',
    severity: '🔴 CRITICAL — Two lives at risk',
    severityColor: '#FF6B6B',
    facts: [
      { icon: '⏱️', label: 'Time Contractions', value: 'Frequency & length' },
      { icon: '🛌', label: 'Position', value: 'Lie on left side' },
      { icon: '🌡️', label: 'Warmth', value: 'Keep mother warm' },
      { icon: '✂️', label: 'Cord', value: 'Never cut cord' },
    ],
    steps: [
      { action: 'Call SOS First', desc: 'Trigger SOS immediately. A maternity emergency always requires professional medical help. Give location and state the mother is in labour or distress.' },
      { action: 'Keep Mother Calm', desc: 'Speak reassuringly. Anxiety and fear increase pain and can slow labour. Help her focus on slow, steady breathing — in through the nose, out through the mouth.' },
      { action: 'Position Correctly', desc: 'Help her lie on her left side or semi-reclined. This improves blood flow to the baby. Keep her comfortable, warm and covered with a clean cloth or blanket.' },
      { action: 'Time the Contractions', desc: 'Note how far apart contractions are and how long each lasts. If contractions are less than 2 minutes apart, birth may be imminent — prepare to assist.' },
      { action: 'If Birth is Imminent', desc: 'If the baby is visible or mother feels the urge to push: gently support the baby\'s head as it emerges — do NOT pull. Let the baby come naturally. Clear its airway gently.' },
      { action: 'After Birth', desc: 'Keep both mother and baby warm. Place baby on mother\'s chest skin-to-skin. Do NOT cut the umbilical cord — wait for the responder. The placenta will follow naturally.' },
    ],
    dos: ['Keep mother calm', "Support baby's head", 'Keep both warm', 'Time contractions'],
    donts: ['Cut the cord', 'Pull the baby', 'Leave mother alone', 'Give medications'],
    warning: "Heavy bleeding, severe abdominal pain without contractions, baby's foot or arm appearing first (breech), or mother becoming unconscious — all require immediate SOS.",
  },
];

export default function FirstAidScreen() {
  const [selected, setSelected] = useState<Guide | null>(null);

  return (
    <LinearGradient colors={['#000000', '#080000', '#000000']} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <ChevronLeft color={Colors.text} size={0} />
        <Text style={styles.title}>FIRST AID GUIDES</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Offline badge */}
        <View style={styles.offlineBadge}>
          <View style={styles.offlineDot} />
          <Text style={styles.offlineText}>All 6 Guides — Available Offline</Text>
        </View>

        <Text style={styles.introText}>
          Tap an emergency type for step-by-step first aid guidance to follow while waiting for help.
        </Text>

        {/* 6-card grid */}
        <View style={styles.grid}>
          {guides.map((guide) => (
            <TouchableOpacity
              key={guide.id}
              onPress={() => setSelected(guide)}
              activeOpacity={0.8}
              style={styles.card}
            >
              <LinearGradient
                colors={[guide.gradientStart, guide.gradientEnd]}
                style={styles.cardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.cardEmoji}>{guide.emoji}</Text>
                <Text style={styles.cardLabel}>{guide.label}</Text>
                <Text style={styles.cardSubtitle}>{guide.subtitle}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* Golden Rules */}
        <View style={styles.goldenBox}>
          <Text style={styles.goldenTitle}>💡 GOLDEN RULES</Text>
          {[
            'Trigger SOS before starting first aid',
            'Stay calm — panic slows your response',
            'Do not move the person unless in danger',
            'Talk to the person even if unconscious',
            'Stay with them until help arrives',
          ].map((rule, i) => (
            <View key={i} style={styles.ruleRow}>
              <Text style={styles.ruleCheck}>✓</Text>
              <Text style={styles.ruleText}>{rule}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Guide Detail Modal */}
      <Modal visible={!!selected} animationType="slide" presentationStyle="pageSheet">
        {selected && <GuideDetail guide={selected} onClose={() => setSelected(null)} />}
      </Modal>
    </LinearGradient>
  );
}

function GuideDetail({ guide, onClose }: { guide: Guide; onClose: () => void }) {
  return (
    <View style={detail.container}>
      {/* Header */}
      <LinearGradient
        colors={[guide.gradientStart, guide.gradientEnd]}
        style={detail.hero}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity style={detail.closeBtn} onPress={onClose}>
          <X color="#fff" size={20} />
        </TouchableOpacity>
        <Text style={detail.heroEmoji}>{guide.emoji}</Text>
        <Text style={detail.heroTitle}>{guide.label.toUpperCase()}</Text>
        <Text style={detail.heroSubtitle}>{guide.subtitle}</Text>
      </LinearGradient>

      <ScrollView style={detail.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={detail.scrollContent}>
        {/* Severity */}
        <View style={[detail.severityBadge, { borderColor: guide.severityColor + '80', backgroundColor: guide.severityColor + '20' }]}>
          <Text style={[detail.severityText, { color: guide.severityColor }]}>{guide.severity}</Text>
        </View>

        {/* Quick facts */}
        <View style={detail.factsGrid}>
          {guide.facts.map((f, i) => (
            <View key={i} style={detail.factCard}>
              <Text style={detail.factEmoji}>{f.icon}</Text>
              <Text style={detail.factLabel}>{f.label}</Text>
              <Text style={detail.factValue}>{f.value}</Text>
            </View>
          ))}
        </View>

        {/* Steps */}
        {guide.steps.map((s, i) => (
          <View key={i} style={detail.step}>
            <View style={detail.stepNum}>
              <Text style={detail.stepNumText}>{i + 1}</Text>
            </View>
            <View style={detail.stepBody}>
              <Text style={detail.stepAction}>{s.action.toUpperCase()}</Text>
              <Text style={detail.stepDesc}>{s.desc}</Text>
            </View>
          </View>
        ))}

        {/* Do / Don't */}
        <View style={detail.doDont}>
          <View style={detail.doBox}>
            <Text style={detail.doTitle}>✓ DO</Text>
            {guide.dos.map((d, i) => <Text key={i} style={detail.doItem}>• {d}</Text>)}
          </View>
          <View style={detail.dontBox}>
            <Text style={detail.dontTitle}>✗ DON'T</Text>
            {guide.donts.map((d, i) => <Text key={i} style={detail.dontItem}>• {d}</Text>)}
          </View>
        </View>

        {/* Warning */}
        <View style={detail.warningBox}>
          <Text style={detail.warningTitle}>⚠ CRITICAL NOTE</Text>
          <Text style={detail.warningText}>{guide.warning}</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const DETAIL_FACT_W = (width - 48 - 8) / 2;

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 12,
  },
  title: {
    fontFamily: Fonts.heading,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: 3,
    textAlign: 'center',
  },
  scroll: { paddingBottom: 100 },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: 'rgba(29,185,84,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(29,185,84,0.25)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  offlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1DB954',
  },
  offlineText: {
    fontFamily: Fonts.heading,
    fontSize: 10,
    color: '#52D68A',
    letterSpacing: 0.5,
    fontWeight: '700',
  },
  introText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.textSecondary,
    marginHorizontal: 20,
    marginBottom: 16,
    lineHeight: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  card: {
    width: CARD_W,
    borderRadius: 18,
    overflow: 'hidden',
  },
  cardGradient: {
    minHeight: 130,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  cardEmoji: {
    fontSize: 36,
  },
  cardLabel: {
    fontFamily: Fonts.heading,
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  cardSubtitle: {
    fontFamily: Fonts.body,
    fontSize: 9,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
  },
  goldenBox: {
    marginHorizontal: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 16,
  },
  goldenTitle: {
    fontFamily: Fonts.heading,
    fontSize: 11,
    fontWeight: '700',
    color: '#74070E',
    letterSpacing: 1,
    marginBottom: 10,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 3,
  },
  ruleCheck: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: '#1DB954',
    fontWeight: '700',
  },
  ruleText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
});

const detail = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  hero: {
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingBottom: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 44,
    left: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroEmoji: { fontSize: 52, marginBottom: 8 },
  heroTitle: {
    fontFamily: Fonts.heading,
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 2,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  severityBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 16,
  },
  severityText: {
    fontFamily: Fonts.heading,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  factsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  factCard: {
    width: DETAIL_FACT_W,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 12,
    gap: 2,
  },
  factEmoji: { fontSize: 18, marginBottom: 4 },
  factLabel: {
    fontFamily: Fonts.heading,
    fontSize: 9,
    color: Colors.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  factValue: {
    fontFamily: Fonts.heading,
    fontSize: 13,
    color: Colors.text,
    fontWeight: '700',
    marginTop: 2,
  },
  step: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: '#74070E',
  },
  stepNum: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#74070E',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  stepNumText: {
    fontFamily: Fonts.heading,
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  stepBody: { flex: 1 },
  stepAction: {
    fontFamily: Fonts.heading,
    fontSize: 10,
    fontWeight: '700',
    color: '#C01020',
    letterSpacing: 1,
    marginBottom: 4,
  },
  stepDesc: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  doDont: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
    marginBottom: 12,
  },
  doBox: {
    flex: 1,
    backgroundColor: 'rgba(39,174,96,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(39,174,96,0.2)',
    borderRadius: 12,
    padding: 12,
  },
  dontBox: {
    flex: 1,
    backgroundColor: 'rgba(192,57,43,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(192,57,43,0.2)',
    borderRadius: 12,
    padding: 12,
  },
  doTitle: {
    fontFamily: Fonts.heading,
    fontSize: 10,
    fontWeight: '700',
    color: '#52D68A',
    letterSpacing: 1,
    marginBottom: 8,
  },
  dontTitle: {
    fontFamily: Fonts.heading,
    fontSize: 10,
    fontWeight: '700',
    color: '#C01020',
    letterSpacing: 1,
    marginBottom: 8,
  },
  doItem: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  dontItem: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  warningBox: {
    backgroundColor: 'rgba(116,7,14,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(116,7,14,0.25)',
    borderRadius: 14,
    padding: 14,
  },
  warningTitle: {
    fontFamily: Fonts.heading,
    fontSize: 10,
    fontWeight: '700',
    color: '#C01020',
    letterSpacing: 2,
    marginBottom: 6,
  },
  warningText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
});
