import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Animated,
  Platform,
  Alert,
  Switch,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Emergency } from '@/types/database';
import { Colors, Fonts } from '@/constants/theme';
import {
  MapPin,
  Clock,
  ChevronRight,
  AlertCircle,
  Check,
  X,
  Siren,
  Radio,
} from 'lucide-react-native';

// ─── Helpers ─────────────────────────────────────────────────────────
function getTimeAgo(dateString: string) {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function getMockDistance(id: string) {
  // Deterministic fake distance based on id so it doesn't flicker
  const seed = id.charCodeAt(0) + id.charCodeAt(id.length - 1);
  const km = ((seed % 38) + 2) / 10; // 0.2 – 4.0 km
  return `${km.toFixed(1)} km`;
}

function getEmergencyLabel(description: string | null, type: string) {
  if (!description) return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  // Extract the medical type label from the description prefix
  const colon = description.indexOf(':');
  if (colon > 0) return description.substring(0, colon).trim();
  return description.length > 30 ? description.substring(0, 30) + '…' : description;
}

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

const URGENCY_THRESHOLD_MINS = 5; // older than 5 mins = not urgent

function isUrgent(dateString: string) {
  const mins = (Date.now() - new Date(dateString).getTime()) / 60000;
  return mins < URGENCY_THRESHOLD_MINS;
}

// ─── Citizen: My Reports view ─────────────────────────────────────────
function CitizenView({ emergencies, refreshing, onRefresh, loading }: {
  emergencies: Emergency[];
  refreshing: boolean;
  onRefresh: () => void;
  loading: boolean;
}) {
  const router = useRouter();

  const statusColors: Record<string, string> = {
    pending: Colors.warning,
    accepted: Colors.info,
    dispatched: Colors.info,
    on_scene: Colors.success,
    resolved: Colors.textMuted,
    cancelled: Colors.textMuted,
  };

  const getStatusLabel = (s: string) => {
    const map: Record<string, string> = {
      pending: 'Pending', accepted: 'Accepted', dispatched: 'En Route',
      on_scene: 'On Scene', resolved: 'Resolved', cancelled: 'Cancelled',
    };
    return map[s] || s;
  };

  return (
    <LinearGradient colors={[Colors.background, Colors.backgroundSecondary]} style={{ flex: 1 }}>
      <View style={cStyles.header}>
        <Text style={cStyles.title}>My Reports</Text>
        <Text style={cStyles.subtitle}>Track your emergency reports</Text>
      </View>
      <FlatList
        data={emergencies}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        ListEmptyComponent={
          <View style={cStyles.empty}>
            <AlertCircle color={Colors.textMuted} size={44} />
            <Text style={cStyles.emptyText}>No emergency reports yet</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={cStyles.card}
            onPress={() => router.push(`/emergency/${item.id}`)}
            activeOpacity={0.75}
          >
            <View style={cStyles.cardRow}>
              <View style={cStyles.emojiBox}>
                <Text style={{ fontSize: 22 }}>{getEmergencyEmoji(item.description)}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={cStyles.cardType}>{getEmergencyLabel(item.description, item.emergency_type)}</Text>
                <View style={cStyles.meta}>
                  <Clock color={Colors.textMuted} size={12} />
                  <Text style={cStyles.metaText}>{getTimeAgo(item.created_at)}</Text>
                  {item.address && (
                    <>
                      <Text style={cStyles.metaDot}>·</Text>
                      <MapPin color={Colors.textMuted} size={12} />
                      <Text style={cStyles.metaText} numberOfLines={1}>{item.address}</Text>
                    </>
                  )}
                </View>
              </View>
              <View style={[cStyles.statusBadge, { backgroundColor: statusColors[item.status] + '25' }]}>
                <Text style={[cStyles.statusText, { color: statusColors[item.status] }]}>
                  {getStatusLabel(item.status)}
                </Text>
              </View>
            </View>
            <ChevronRight color={Colors.textMuted} size={18} style={cStyles.chevron} />
          </TouchableOpacity>
        )}
      />
    </LinearGradient>
  );
}

const cStyles = StyleSheet.create({
  header: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 16 },
  title: { fontFamily: Fonts.heading, fontSize: 26, fontWeight: '700', color: Colors.text, letterSpacing: 1 },
  subtitle: { fontFamily: Fonts.body, fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontFamily: Fonts.body, fontSize: 15, color: Colors.textMuted, marginTop: 14 },
  card: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: Colors.border, position: 'relative',
  },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  emojiBox: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.surfaceLight,
    justifyContent: 'center', alignItems: 'center',
  },
  cardType: { fontFamily: Fonts.heading, fontSize: 15, fontWeight: '600', color: Colors.text },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, flexWrap: 'nowrap' },
  metaText: { fontFamily: Fonts.body, fontSize: 11, color: Colors.textMuted, maxWidth: 100 },
  metaDot: { color: Colors.textMuted, fontSize: 11 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  statusText: { fontFamily: Fonts.heading, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  chevron: { position: 'absolute', right: 14, top: '50%', marginTop: -9 },
});

// ─── Responder: Alert Card ────────────────────────────────────────────
function AlertCard({
  item,
  onAccept,
  onDecline,
  accepting,
  declining,
}: {
  item: Emergency;
  onAccept: () => void;
  onDecline: () => void;
  accepting: boolean;
  declining: boolean;
}) {
  const urgent = isUrgent(item.created_at);
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!urgent) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 1400, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [urgent]);

  return (
    <Animated.View style={[
      rStyles.alertCard,
      urgent && {
        borderColor: Colors.primary,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: glowAnim,
        shadowRadius: 12,
        elevation: 8,
      },
    ]}>
      {/* Top row */}
      <View style={rStyles.alertTop}>
        <View style={rStyles.alertEmojiWrap}>
          <LinearGradient
            colors={urgent ? [Colors.primary, Colors.primaryDark] : [Colors.surface, Colors.surfaceLight]}
            style={rStyles.alertEmoji}
          >
            <Text style={{ fontSize: 22 }}>{getEmergencyEmoji(item.description)}</Text>
          </LinearGradient>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={rStyles.alertType}>{getEmergencyLabel(item.description, item.emergency_type)}</Text>
          <View style={rStyles.alertMeta}>
            <MapPin color={Colors.textMuted} size={13} />
            <Text style={rStyles.alertMetaText}>{getMockDistance(item.id)}</Text>
            <Clock color={Colors.textMuted} size={13} />
            <Text style={rStyles.alertMetaText}>{getTimeAgo(item.created_at)}</Text>
          </View>
          {item.address && (
            <Text style={rStyles.alertAddress} numberOfLines={1}>{item.address}</Text>
          )}
        </View>
        {urgent && (
          <View style={rStyles.urgentBadge}>
            <Text style={rStyles.urgentText}>URGENT</Text>
          </View>
        )}
      </View>

      {/* Action buttons */}
      <View style={rStyles.alertActions}>
        <TouchableOpacity
          style={[rStyles.acceptBtn, (accepting || declining) && { opacity: 0.6 }]}
          onPress={onAccept}
          disabled={accepting || declining}
          activeOpacity={0.8}
        >
          <LinearGradient colors={['#1e8449', Colors.success]} style={rStyles.acceptBtnInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Check color="#fff" size={16} strokeWidth={3} />
            <Text style={rStyles.acceptText}>ACCEPT</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity
          style={[rStyles.declineBtn, (accepting || declining) && { opacity: 0.6 }]}
          onPress={onDecline}
          disabled={accepting || declining}
          activeOpacity={0.8}
        >
          <X color={Colors.textMuted} size={16} strokeWidth={2.5} />
          <Text style={rStyles.declineText}>DECLINE</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

// ─── Responder Dashboard ──────────────────────────────────────────────
function ResponderView({ profile }: { profile: any }) {
  const router = useRouter();
  const [available, setAvailable] = useState(true);
  const [emergencies, setEmergencies] = useState<Emergency[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [declining, setDeclining] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const fetchEmergencies = useCallback(async () => {
    const { data } = await supabase
      .from('emergencies')
      .select('*')
      .in('status', ['pending'])
      .is('responder_id', null)
      .order('created_at', { ascending: false });
    setEmergencies((data as Emergency[]) || []);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchEmergencies();
      const interval = setInterval(fetchEmergencies, 10000);
      return () => clearInterval(interval);
    }, [fetchEmergencies])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEmergencies();
    setRefreshing(false);
  };

  const handleAccept = async (item: Emergency) => {
    setAccepting(item.id);
    try {
      const { error } = await supabase
        .from('emergencies')
        .update({ responder_id: profile.id, status: 'dispatched' } as never)
        .eq('id', item.id);
      if (error) throw error;
      router.push(`/emergency/${item.id}`);
    } catch {
      Alert.alert('Error', 'Failed to accept alert. Please try again.');
    } finally {
      setAccepting(null);
    }
  };

  const handleDecline = (item: Emergency) => {
    setDeclining(item.id);
    setTimeout(() => {
      setDismissed(prev => new Set([...prev, item.id]));
      setDeclining(null);
    }, 300);
  };

  const visible = emergencies.filter(e => !dismissed.has(e.id));

  const initials = (profile?.full_name || 'R').split(' ').map((w: string) => w[0]).join('').substring(0, 2).toUpperCase();

  return (
    <LinearGradient colors={['#000000', '#080000', '#000000']} style={{ flex: 1 }}>
      {/* Header */}
      <View style={rStyles.header}>
        <View>
          <Text style={rStyles.welcomeSmall}>Welcome back,</Text>
          <Text style={rStyles.welcomeName}>{profile?.full_name || 'Responder'}</Text>
        </View>
        <View style={rStyles.headerAvatar}>
          <Text style={rStyles.avatarText}>{initials}</Text>
        </View>
      </View>

      {/* Availability Toggle */}
      <View style={[rStyles.availCard, available && rStyles.availCardOn]}>
        <View style={{ flex: 1 }}>
          <Text style={[rStyles.availLabel, available ? rStyles.availLabelOn : rStyles.availLabelOff]}>
            {available ? 'AVAILABLE' : 'OFF DUTY'}
          </Text>
          <Text style={rStyles.availSub}>
            {available ? 'You will receive emergency alerts' : 'Toggle on to receive alerts'}
          </Text>
        </View>
        <Switch
          value={available}
          onValueChange={(v) => {
            setAvailable(v);
            if (!v) setDismissed(new Set(emergencies.map(e => e.id)));
            else setDismissed(new Set());
          }}
          trackColor={{ false: Colors.border, true: Colors.success }}
          thumbColor="#fff"
          ios_backgroundColor={Colors.border}
        />
      </View>

      {/* Nearby emergencies section */}
      <FlatList
        data={available ? visible : []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={rStyles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.success} />}
        ListHeaderComponent={
          <View style={rStyles.sectionHeader}>
            <Radio color={Colors.success} size={13} />
            <Text style={rStyles.sectionTitle}>NEARBY EMERGENCIES</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={rStyles.emptyWrap}>
            {!available ? (
              <>
                <View style={rStyles.emptyIcon}><Text style={{ fontSize: 36 }}>📵</Text></View>
                <Text style={rStyles.emptyTitle}>OFF DUTY</Text>
                <Text style={rStyles.emptySub}>Toggle to Available to receive emergency alerts</Text>
              </>
            ) : (
              <>
                <View style={rStyles.emptyIcon}><Text style={{ fontSize: 36 }}>✅</Text></View>
                <Text style={rStyles.emptyTitle}>ALL CLEAR</Text>
                <Text style={rStyles.emptySub}>No pending emergencies in your area right now</Text>
              </>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <AlertCard
            item={item}
            onAccept={() => handleAccept(item)}
            onDecline={() => handleDecline(item)}
            accepting={accepting === item.id}
            declining={declining === item.id}
          />
        )}
      />
    </LinearGradient>
  );
}

const rStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 44,
    paddingBottom: 10,
  },
  welcomeSmall: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  welcomeName: {
    fontFamily: Fonts.heading,
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 2,
  },
  headerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
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

  // Availability card
  availCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  availCardOn: {
    borderColor: Colors.success + '60',
    backgroundColor: Colors.success + '10',
  },
  availLabel: {
    fontFamily: Fonts.heading,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  availLabelOn: { color: Colors.success },
  availLabelOff: { color: Colors.textMuted },
  availSub: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: Fonts.heading,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 2,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    flexGrow: 1,
  },

  // Alert card
  alertCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginBottom: 12,
    overflow: 'hidden',
  },
  alertTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    gap: 12,
  },
  alertEmojiWrap: {},
  alertEmoji: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertType: {
    fontFamily: Fonts.heading,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: 0.3,
  },
  alertMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 5,
  },
  alertMetaText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textMuted,
    marginRight: 4,
  },
  alertAddress: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 3,
  },
  urgentBadge: {
    backgroundColor: Colors.primary + '20',
    borderWidth: 1,
    borderColor: Colors.primary + '60',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  urgentText: {
    fontFamily: Fonts.heading,
    fontSize: 9,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 1,
  },

  // Buttons
  alertActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  acceptBtn: {
    flex: 1,
    borderRightWidth: 0.5,
    borderRightColor: Colors.border,
    overflow: 'hidden',
    borderBottomLeftRadius: 14,
  },
  acceptBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 13,
  },
  acceptText: {
    fontFamily: Fonts.heading,
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 1,
  },
  declineBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 13,
    borderBottomRightRadius: 14,
  },
  declineText: {
    fontFamily: Fonts.heading,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 1,
  },

  // Empty
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 10,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 4,
  },
  emptyTitle: {
    fontFamily: Fonts.heading,
    fontSize: 14,
    color: Colors.textMuted,
    letterSpacing: 2,
    fontWeight: '700',
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

// ─── Root Export ──────────────────────────────────────────────────────
export default function EmergenciesScreen() {
  const { profile, isResponder } = useAuth();
  const [emergencies, setEmergencies] = useState<Emergency[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCitizenEmergencies = useCallback(async () => {
    if (!profile?.id) return;
    const { data } = await supabase
      .from('emergencies')
      .select('*')
      .eq('citizen_id', profile.id)
      .order('created_at', { ascending: false });
    setEmergencies((data as Emergency[]) || []);
    setLoading(false);
  }, [profile?.id]);

  useFocusEffect(
    useCallback(() => {
      if (!isResponder) fetchCitizenEmergencies();
    }, [isResponder, fetchCitizenEmergencies])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCitizenEmergencies();
    setRefreshing(false);
  };

  if (isResponder) {
    return <ResponderView profile={profile} />;
  }

  return (
    <CitizenView
      emergencies={emergencies}
      refreshing={refreshing}
      onRefresh={onRefresh}
      loading={loading}
    />
  );
}
