import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Linking,
  RefreshControl,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Emergency, EmergencyContact } from '@/types/database';
import { Colors, Fonts } from '@/constants/theme';
import { Phone, Building2, AlertTriangle, Flame, HeartPulse, Shield, Car, Plus, ChevronRight } from 'lucide-react-native';

// ─── Helpers ──────────────────────────────────────────────────────────
function getEmergencyEmoji(description: string | null) {
  const d = (description || '').toLowerCase();
  if (d.includes('cardiac')) return '❤️';
  if (d.includes('breath')) return '🌬️';
  if (d.includes('trauma') || d.includes('accident')) return '🩹';
  if (d.includes('seizure')) return '⚡';
  if (d.includes('poison')) return '☠️';
  if (d.includes('matern')) return '🤱';
  return '🆘';
}

function getEmergencyLabel(description: string | null, type: string) {
  if (!description) return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const colon = description.indexOf(':');
  if (colon > 0) return description.substring(0, colon).trim();
  return description.length > 30 ? description.substring(0, 30) + '…' : description;
}

function formatDateTime(dateString: string) {
  const d = new Date(dateString);
  const today = new Date();
  const isToday =
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();

  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (isToday) return `Today · ${time}`;

  const dateStr = d.toLocaleDateString([], { month: 'short', d: 'numeric', year: 'numeric' } as any);
  return `${dateStr} · ${time}`;
}

type EmergencyWithCitizen = Emergency & { citizen: { full_name: string } | null };

type StatusGroup = 'active' | 'resolved' | 'cancelled';

function getStatusGroup(status: string): StatusGroup {
  if (status === 'resolved') return 'resolved';
  if (status === 'cancelled') return 'cancelled';
  return 'active';
}

const STATUS_CONFIG: Record<StatusGroup, { label: string; color: string; bg: string }> = {
  active: { label: 'ACTIVE', color: '#00CED1', bg: 'rgba(0,206,209,0.12)' },
  resolved: { label: 'RESOLVED', color: Colors.success, bg: 'rgba(34,197,94,0.18)' },
  cancelled: { label: 'CANCELLED', color: Colors.textMuted, bg: 'rgba(107,107,107,0.18)' },
};

// ─── Responder History Screen ──────────────────────────────────────────
function ResponderHistoryScreen({ profile }: { profile: any }) {
  const router = useRouter();
  const [emergencies, setEmergencies] = useState<EmergencyWithCitizen[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetch = useCallback(async () => {
    if (!profile?.id) return;
    const { data } = await supabase
      .from('emergencies')
      .select('*, citizen:profiles!citizen_id(full_name)')
      .eq('responder_id', profile.id)
      .order('created_at', { ascending: false });
    setEmergencies((data as EmergencyWithCitizen[]) || []);
    setLoading(false);
  }, [profile?.id]);

  useFocusEffect(useCallback(() => { fetch(); }, [fetch]));

  const onRefresh = async () => {
    setRefreshing(true);
    await fetch();
    setRefreshing(false);
  };

  const responded = emergencies.length;
  const resolved = emergencies.filter(e => e.status === 'resolved').length;
  const cancelled = emergencies.filter(e => e.status === 'cancelled').length;

  const initials = (profile?.full_name || 'R')
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <LinearGradient colors={['#000000', '#080000', '#000000']} style={{ flex: 1 }}>
      {/* Header */}
      <View style={hStyles.header}>
        <Text style={hStyles.title}>HISTORY</Text>
        <View style={hStyles.avatar}>
          <Text style={hStyles.avatarText}>{initials}</Text>
        </View>
      </View>

      {/* Stats row */}
      <View style={hStyles.statsRow}>
        <View style={hStyles.statBox}>
          <Text style={[hStyles.statNum, { color: '#00CED1' }]}>{responded}</Text>
          <Text style={hStyles.statLabel}>RESPONDED</Text>
        </View>
        <View style={[hStyles.statBox, hStyles.statBoxMid]}>
          <Text style={[hStyles.statNum, { color: Colors.success }]}>{resolved}</Text>
          <Text style={hStyles.statLabel}>RESOLVED</Text>
        </View>
        <View style={hStyles.statBox}>
          <Text style={[hStyles.statNum, { color: Colors.textMuted }]}>{cancelled}</Text>
          <Text style={hStyles.statLabel}>CANCELLED</Text>
        </View>
      </View>

      <FlatList
        data={emergencies}
        keyExtractor={(item) => item.id}
        contentContainerStyle={hStyles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={hStyles.empty}>
              <Text style={hStyles.emptyIcon}>📋</Text>
              <Text style={hStyles.emptyTitle}>NO HISTORY YET</Text>
              <Text style={hStyles.emptySub}>Emergencies you respond to will appear here</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const group = getStatusGroup(item.status);
          const cfg = STATUS_CONFIG[group];
          const citizenName = item.citizen?.full_name || 'Unknown';
          const locationStr = item.address ? `${citizenName} · ${item.address}` : citizenName;

          return (
            <TouchableOpacity
              style={hStyles.card}
              onPress={() => router.push(`/emergency/${item.id}`)}
              activeOpacity={0.75}
            >
              <View style={hStyles.cardLeft}>
                <View style={hStyles.emojiBox}>
                  <Text style={{ fontSize: 20 }}>{getEmergencyEmoji(item.description)}</Text>
                </View>
              </View>
              <View style={hStyles.cardBody}>
                <View style={hStyles.cardTopRow}>
                  <Text style={hStyles.cardType} numberOfLines={1}>
                    {getEmergencyLabel(item.description, item.emergency_type)}
                  </Text>
                  <View style={[hStyles.statusBadge, { backgroundColor: cfg.bg, borderColor: cfg.color + '50' }]}>
                    <Text style={[hStyles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
                  </View>
                </View>
                <Text style={hStyles.cardMeta} numberOfLines={1}>{locationStr}</Text>
                <Text style={hStyles.cardDate}>{formatDateTime(item.created_at)}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </LinearGradient>
  );
}

const hStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 44,
    paddingBottom: 16,
  },
  title: {
    fontFamily: Fonts.heading,
    fontSize: 26,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: 2,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontFamily: Fonts.heading,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.surface,
    paddingVertical: 14,
    alignItems: 'center',
  },
  statBoxMid: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: Colors.border,
  },
  statNum: {
    fontFamily: Fonts.heading,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statLabel: {
    fontFamily: Fonts.heading,
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 1.5,
    marginTop: 3,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    flexGrow: 1,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
    padding: 14,
    alignItems: 'flex-start',
    gap: 12,
  },
  cardLeft: {},
  emojiBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBody: {
    flex: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardType: {
    fontFamily: Fonts.heading,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusText: {
    fontFamily: Fonts.heading,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  cardMeta: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 5,
  },
  cardDate: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 3,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyTitle: {
    fontFamily: Fonts.heading,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 2,
  },
  emptySub: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    maxWidth: 240,
    lineHeight: 20,
  },
});

// ─── Citizen Emergency Contacts Screen ────────────────────────────────
const serviceIcons: Record<string, React.ReactNode> = {
  fire: <Flame color={Colors.fire} size={24} />,
  medical: <HeartPulse color={Colors.medical} size={24} />,
  police: <Shield color={Colors.police} size={24} />,
  accident: <Car color={Colors.accident} size={24} />,
  general: <AlertTriangle color={Colors.primary} size={24} />,
};

function CitizenContactsScreen() {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('emergency_contacts')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setContacts(data || []);
    } catch {
      setContacts([
        { id: '1', name: 'Emergency Services', phone_number: '911', role: 'general', is_primary: true, display_order: 1, created_at: '' } as EmergencyContact,
        { id: '2', name: 'Fire Department', phone_number: '911', role: 'fire', is_primary: false, display_order: 2, created_at: '' } as EmergencyContact,
        { id: '3', name: 'Police', phone_number: '911', role: 'police', is_primary: false, display_order: 3, created_at: '' } as EmergencyContact,
        { id: '4', name: 'Ambulance', phone_number: '911', role: 'medical', is_primary: false, display_order: 4, created_at: '' } as EmergencyContact,
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchContacts(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchContacts();
    setRefreshing(false);
  };

  const handleCall = (phone: string) => Linking.openURL(`tel:${phone}`);

  const getServiceType = (role: string) => {
    if (role.includes('fire')) return 'fire';
    if (role.includes('medical') || role.includes('ambulance') || role.includes('health')) return 'medical';
    if (role.includes('police')) return 'police';
    if (role.includes('accident')) return 'accident';
    return 'general';
  };

  return (
    <LinearGradient colors={[Colors.background, Colors.backgroundSecondary]} style={cStyles.container}>
      <View style={cStyles.header}>
        <Text style={cStyles.title}>Emergency Contacts</Text>
        <Text style={cStyles.subtitle}>Quick access to emergency services</Text>
      </View>

      <View style={cStyles.sosBanner}>
        <LinearGradient
          colors={[Colors.primary, Colors.primaryDark]}
          style={cStyles.sosBannerGradient}
        >
          <AlertTriangle color={Colors.text} size={32} />
          <View style={cStyles.sosBannerContent}>
            <Text style={cStyles.sosBannerTitle}>In case of emergency</Text>
            <Text style={cStyles.sosBannerText}>Call 911 immediately</Text>
          </View>
          <TouchableOpacity style={cStyles.sosCallButton} onPress={() => handleCall('911')}>
            <Phone color={Colors.primary} size={24} />
          </TouchableOpacity>
        </LinearGradient>
      </View>

      <FlatList
        data={contacts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={cStyles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        renderItem={({ item }) => {
          const serviceType = getServiceType(item.role);
          return (
            <TouchableOpacity
              style={cStyles.contactCard}
              onPress={() => handleCall(item.phone_number)}
              activeOpacity={0.7}
            >
              <View style={cStyles.contactIcon}>
                {serviceIcons[serviceType] || serviceIcons['general']}
              </View>
              <View style={cStyles.contactInfo}>
                <Text style={cStyles.contactName}>{item.name}</Text>
                <View style={cStyles.contactMeta}>
                  <Building2 color={Colors.textMuted} size={12} />
                  <Text style={cStyles.contactService}>{item.role}</Text>
                </View>
              </View>
              <View style={cStyles.callButton}>
                <Phone color={Colors.success} size={24} />
              </View>
            </TouchableOpacity>
          );
        }}
        ListFooterComponent={
          <View style={cStyles.quickActions}>
            <TouchableOpacity style={cStyles.quickActionCard}>
              <Plus color={Colors.primary} size={24} />
              <Text style={cStyles.quickActionText}>Add Personal Contact</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </LinearGradient>
  );
}

const cStyles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 16 },
  title: { fontFamily: Fonts.heading, fontSize: 28, fontWeight: '700', color: Colors.text, letterSpacing: 1 },
  subtitle: { fontFamily: Fonts.body, fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  sosBanner: { marginHorizontal: 24, marginBottom: 24, borderRadius: 20, overflow: 'hidden' },
  sosBannerGradient: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 16 },
  sosBannerContent: { flex: 1 },
  sosBannerTitle: { fontFamily: Fonts.heading, fontSize: 16, fontWeight: '600', color: Colors.text },
  sosBannerText: { fontFamily: Fonts.body, fontSize: 14, color: Colors.text, opacity: 0.8, marginTop: 2 },
  sosCallButton: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.text, justifyContent: 'center', alignItems: 'center',
  },
  listContent: { paddingHorizontal: 24, paddingBottom: 100 },
  contactCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border,
  },
  contactIcon: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.surface,
    justifyContent: 'center', alignItems: 'center',
  },
  contactInfo: { flex: 1, marginLeft: 16 },
  contactName: { fontFamily: Fonts.heading, fontSize: 16, fontWeight: '600', color: Colors.text },
  contactMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  contactService: { fontFamily: Fonts.body, fontSize: 12, color: Colors.textMuted, textTransform: 'capitalize' },
  callButton: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.success + '20', justifyContent: 'center', alignItems: 'center',
  },
  quickActions: { marginTop: 24 },
  quickActionCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.surface, paddingVertical: 16, borderRadius: 16,
    gap: 8, borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed',
  },
  quickActionText: { fontFamily: Fonts.body, fontSize: 14, color: Colors.primary, fontWeight: '500' },
});

// ─── Root Export ──────────────────────────────────────────────────────
export default function ContactsScreen() {
  const { profile, isResponder } = useAuth();

  if (isResponder) {
    return <ResponderHistoryScreen profile={profile} />;
  }

  return <CitizenContactsScreen />;
}
