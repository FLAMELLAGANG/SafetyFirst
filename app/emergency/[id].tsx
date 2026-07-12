import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Animated,
  Platform,
  Alert,
  Image,
  Linking,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import WebView from 'react-native-webview';
import * as Location from 'expo-location';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Colors, Fonts } from '@/constants/theme';
import type { Emergency, Profile } from '@/types/database';
import {
  ArrowLeft,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  Phone,
  Navigation,
  RefreshCw,
  Loader,
  XCircle,
  Radio,
  MessageCircle,
  Map,
  UserCircle,
  Droplets,
  AlertTriangle,
} from 'lucide-react-native';

// ─── Types ──────────────────────────────────────────────────────────────
type LatLng = { lat: number; lng: number };
type StatusPhase = 'searching' | 'found' | 'on_scene' | 'resolved' | 'cancelled';

// ─── Helpers ─────────────────────────────────────────────────────────────
function getPhase(status: string): StatusPhase {
  if (status === 'pending' || status === 'accepted') return 'searching';
  if (status === 'dispatched') return 'found';
  if (status === 'on_scene') return 'on_scene';
  if (status === 'resolved') return 'resolved';
  return 'cancelled';
}

function getStatusColor(phase: StatusPhase) {
  switch (phase) {
    case 'searching': return '#F59E0B';
    case 'found': return '#3B82F6';
    case 'on_scene': return '#22C55E';
    case 'resolved': return '#22C55E';
    case 'cancelled': return Colors.textMuted;
  }
}

function getStatusLabel(phase: StatusPhase) {
  switch (phase) {
    case 'searching': return 'Searching for Responder';
    case 'found': return 'Responder En Route';
    case 'on_scene': return 'Responder On Scene';
    case 'resolved': return 'Emergency Resolved';
    case 'cancelled': return 'Cancelled';
  }
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
}

function getAge(dob: string | null): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function getTimeAgo(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(mins / 60);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  return `${hours}h ago`;
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getEmergencyTypeLabel(description: string | null): string {
  if (!description) return 'EMERGENCY';
  const colon = description.indexOf(':');
  if (colon > 0) return description.substring(0, colon).trim().toUpperCase();
  return description.length > 20 ? 'EMERGENCY' : description.toUpperCase();
}

// ─── Leaflet HTML builder ─────────────────────────────────────────────
function buildMapHtml(initLat: number, initLng: number): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #050000; overflow: hidden; font-family: sans-serif; }
    #map { width: 100vw; height: 100vh; }
    .leaflet-control-attribution { display: none; }
    .leaflet-control-zoom { display: none; }
    .c-pin { width: 40px; height: 40px; border-radius: 50%; background: rgba(220,20,60,0.2); border: 2.5px solid #DC143C; display: flex; align-items: center; justify-content: center; font-size: 17px; box-shadow: 0 0 18px rgba(220,20,60,0.55); }
    .r-pin { width: 44px; height: 44px; border-radius: 50%; background: linear-gradient(135deg,#1a3a6b,#2980B9); border: 2.5px solid #fff; display: flex; align-items: center; justify-content: center; font-size: 19px; box-shadow: 0 0 18px rgba(41,128,185,0.7); }
    .pin-label { position: absolute; top: 46px; left: 50%; transform: translateX(-50%); white-space: nowrap; background: rgba(5,0,0,0.9); font-size: 9px; font-weight: 700; letter-spacing: 0.8px; padding: 2px 7px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.12); }
    .c-label { color: #DC143C; }
    .r-label { color: #3B82F6; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var initLat = ${initLat};
    var initLng = ${initLng};
    var map, cMarker, rMarker, routeLine;
    try {
      map = L.map('map', { zoomControl: false, attributionControl: false }).setView([initLat, initLng], 16);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { subdomains: 'abcd', maxZoom: 20 }).addTo(map);
      var cIcon = L.divIcon({ html: '<div class="c-pin">📍</div><div class="pin-label c-label">SOS</div>', className: '', iconSize: [40,40], iconAnchor: [20,20] });
      var rIcon = L.divIcon({ html: '<div class="r-pin">🚑</div><div class="pin-label r-label">RESPONDER</div>', className: '', iconSize: [44,44], iconAnchor: [22,22] });
      cMarker = L.marker([initLat, initLng], { icon: cIcon }).addTo(map);
    } catch(e) {}
    window.updateMarkers = function(data) {
      if (!map) return;
      try {
        if (data.citizen) { cMarker.setLatLng([data.citizen.lat, data.citizen.lng]); }
        if (data.responder) {
          if (!rMarker) { rMarker = L.marker([data.responder.lat, data.responder.lng], { icon: rIcon }).addTo(map); }
          else { rMarker.setLatLng([data.responder.lat, data.responder.lng]); }
          if (routeLine) { map.removeLayer(routeLine); }
          routeLine = L.polyline([cMarker.getLatLng(), rMarker.getLatLng()], { color: '#74070E', weight: 2.5, dashArray: '7,9', opacity: 0.8 }).addTo(map);
          map.fitBounds([cMarker.getLatLng(), rMarker.getLatLng()], { padding: [70,70] });
        } else if (data.citizen) { map.panTo([data.citizen.lat, data.citizen.lng]); }
      } catch(e) {}
    };
  </script>
</body>
</html>`;
}

// ─── Real Live Map ─────────────────────────────────────────────────────
function RealLiveMap({
  emergency,
  profile,
  isResponder,
  responderProfile,
  onClose,
}: {
  emergency: Emergency;
  profile: Profile;
  isResponder: boolean;
  responderProfile: Profile | null;
  onClose: () => void;
}) {
  const webViewRef = useRef<WebView>(null);
  const [mapReady, setMapReady] = useState(false);
  const [citizenLoc, setCitizenLoc] = useState<LatLng | null>(
    emergency.latitude && emergency.longitude
      ? { lat: emergency.latitude, lng: emergency.longitude }
      : null
  );
  const [responderLoc, setResponderLoc] = useState<LatLng | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const locationSubRef = useRef<Location.LocationSubscription | null>(null);
  const lastUpsertRef = useRef<number>(0);

  useEffect(() => {
    if (!mapReady || !webViewRef.current) return;
    webViewRef.current.injectJavaScript(`
      if (window.updateMarkers) window.updateMarkers(${JSON.stringify({ citizen: citizenLoc, responder: responderLoc })});
      true;
    `);
  }, [citizenLoc, responderLoc, mapReady]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('live_locations').select('*').eq('emergency_id', emergency.id);
      if (!data) return;
      data.forEach((loc: any) => {
        if (loc.role === 'citizen') setCitizenLoc({ lat: loc.latitude, lng: loc.longitude });
        if (loc.role === 'responder') setResponderLoc({ lat: loc.latitude, lng: loc.longitude });
      });
    })();
  }, [emergency.id]);

  useEffect(() => {
    const channel = supabase
      .channel(`live_loc_${emergency.id}`)
      .on('postgres_changes' as any, { event: '*', schema: 'public', table: 'live_locations', filter: `emergency_id=eq.${emergency.id}` }, (payload: any) => {
        const loc = payload.new;
        if (!loc) return;
        if (loc.role === 'citizen') setCitizenLoc({ lat: loc.latitude, lng: loc.longitude });
        if (loc.role === 'responder') setResponderLoc({ lat: loc.latitude, lng: loc.longitude });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [emergency.id]);

  useEffect(() => {
    let mounted = true;
    let webWatchId: number | null = null;
    const myRole = isResponder ? 'responder' : 'citizen';

    const handlePosition = async (lat: number, lng: number) => {
      if (!mounted) return;
      const now = Date.now();
      if (now - lastUpsertRef.current < 4000) return;
      lastUpsertRef.current = now;
      if (myRole === 'citizen') setCitizenLoc({ lat, lng });
      else setResponderLoc({ lat, lng });
      await supabase.from('live_locations').upsert(
        { emergency_id: emergency.id, user_id: profile.id, role: myRole, latitude: lat, longitude: lng, updated_at: new Date().toISOString() } as never,
        { onConflict: 'emergency_id,user_id' }
      );
    };

    if (Platform.OS === 'web') {
      if (!navigator.geolocation) {
        setLocationError('Geolocation is not supported by this browser.');
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => handlePosition(pos.coords.latitude, pos.coords.longitude),
        () => setLocationError('Location permission denied.'),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
      );
      webWatchId = navigator.geolocation.watchPosition(
        (pos) => handlePosition(pos.coords.latitude, pos.coords.longitude),
        () => {},
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
      );
    } else {
      (async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') { setLocationError('Location permission denied.'); return; }
        const sub = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, timeInterval: 4000, distanceInterval: 5 },
          async (loc) => handlePosition(loc.coords.latitude, loc.coords.longitude)
        );
        if (mounted) locationSubRef.current = sub;
      })();
    }

    return () => {
      mounted = false;
      if (webWatchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(webWatchId);
      }
      locationSubRef.current?.remove();
    };
  }, [emergency.id, profile.id, isResponder]);

  const mapHtml = buildMapHtml(emergency.latitude ?? 0, emergency.longitude ?? 0);

  return (
    <View style={{ flex: 1, backgroundColor: '#050000' }}>
      <TouchableOpacity style={[styles.backBtn, { position: 'absolute', top: Platform.OS === 'ios' ? 56 : 40, left: 16, zIndex: 50 }]} onPress={onClose}>
        <ArrowLeft color={Colors.text} size={22} />
      </TouchableOpacity>
      <View style={mapStyles.liveChip}>
        <Radio color={Colors.success} size={11} />
        <Text style={mapStyles.liveText}>LIVE</Text>
      </View>
      <WebView ref={webViewRef} source={{ html: mapHtml }} style={{ flex: 1 }} onLoad={() => setMapReady(true)} javaScriptEnabled domStorageEnabled originWhitelist={['*']} scrollEnabled={false} />
      <LinearGradient colors={['#000000', '#0a0000']} style={mapStyles.bottomCard}>
        {locationError ? <Text style={mapStyles.errorText}>{locationError}</Text> : null}
        <Text style={mapStyles.cardTitle}>{isResponder ? '📍 Citizen Location' : '🚑 Responder Tracking'}</Text>
        {!isResponder && emergency.responder_id && (
          <View style={mapStyles.partyRow}>
            <View style={mapStyles.partyAvatar}><Text style={mapStyles.partyInitials}>{responderProfile ? getInitials(responderProfile.full_name) : 'R'}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={mapStyles.partyName}>{responderProfile?.full_name || 'Responder'}</Text>
              <Text style={mapStyles.partySub}>{responderLoc ? 'Location live' : 'Waiting for location…'}</Text>
            </View>
            {responderLoc && <View style={mapStyles.activeDot}><Text style={mapStyles.activeDotText}>●</Text></View>}
          </View>
        )}
        {isResponder && (
          <View style={mapStyles.partyRow}>
            <View style={[mapStyles.partyAvatar, { backgroundColor: '#3a0005', borderColor: Colors.primary }]}><Text style={{ fontSize: 18 }}>📍</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={mapStyles.partyName}>Citizen SOS Location</Text>
              <Text style={mapStyles.partySub}>{citizenLoc ? 'Location live' : 'Waiting for location…'}</Text>
            </View>
            {citizenLoc && <View style={mapStyles.activeDot}><Text style={mapStyles.activeDotText}>●</Text></View>}
          </View>
        )}
        <View style={mapStyles.locRow}>
          <View style={mapStyles.locItem}>
            <Text style={mapStyles.locLabel}>YOUR LOCATION</Text>
            <Text style={mapStyles.locValue}>{isResponder ? (responderLoc ? `${responderLoc.lat.toFixed(4)}, ${responderLoc.lng.toFixed(4)}` : 'Acquiring…') : (citizenLoc ? `${citizenLoc.lat.toFixed(4)}, ${citizenLoc.lng.toFixed(4)}` : 'Acquiring…')}</Text>
          </View>
          <View style={mapStyles.locItem}>
            <Text style={mapStyles.locLabel}>OTHER PARTY</Text>
            <Text style={mapStyles.locValue}>{isResponder ? (citizenLoc ? `${citizenLoc.lat.toFixed(4)}, ${citizenLoc.lng.toFixed(4)}` : 'Waiting…') : (responderLoc ? `${responderLoc.lat.toFixed(4)}, ${responderLoc.lng.toFixed(4)}` : 'Waiting…')}</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const mapStyles = StyleSheet.create({
  liveChip: { position: 'absolute', top: Platform.OS === 'ios' ? 56 : 40, right: 16, zIndex: 50, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(10,10,10,0.9)', borderWidth: 1, borderColor: Colors.success + '60', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  liveText: { fontFamily: Fonts.heading, fontSize: 10, fontWeight: '700', color: Colors.success, letterSpacing: 1 },
  bottomCard: { padding: 20, paddingBottom: Platform.OS === 'ios' ? 36 : 20, borderTopWidth: 1, borderTopColor: Colors.border },
  cardTitle: { fontFamily: Fonts.heading, fontSize: 13, fontWeight: '700', color: Colors.text, letterSpacing: 0.5, marginBottom: 12 },
  errorText: { fontFamily: Fonts.body, fontSize: 12, color: Colors.error, marginBottom: 10, textAlign: 'center' },
  partyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  partyAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1a3a6b', borderWidth: 2, borderColor: '#2980B9', justifyContent: 'center', alignItems: 'center' },
  partyInitials: { fontFamily: Fonts.heading, fontSize: 15, fontWeight: '700', color: '#fff' },
  partyName: { fontFamily: Fonts.heading, fontSize: 14, fontWeight: '700', color: Colors.text },
  partySub: { fontFamily: Fonts.body, fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  activeDot: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, backgroundColor: Colors.success + '15', borderWidth: 1, borderColor: Colors.success + '40' },
  activeDotText: { color: Colors.success, fontSize: 14 },
  locRow: { flexDirection: 'row', gap: 10 },
  locItem: { flex: 1, backgroundColor: Colors.surface, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: Colors.border, gap: 4 },
  locLabel: { fontFamily: Fonts.heading, fontSize: 8, fontWeight: '700', color: Colors.textMuted, letterSpacing: 1 },
  locValue: { fontFamily: Fonts.body, fontSize: 11, color: Colors.textSecondary },
});

// ─── Status Timeline (citizen view) ───────────────────────────────────
function StatusTimeline({ phase }: { phase: StatusPhase }) {
  const steps = [{ key: 'sent', label: 'Sent' }, { key: 'searching', label: 'Matching' }, { key: 'found', label: 'En Route' }, { key: 'on_scene', label: 'On Scene' }, { key: 'resolved', label: 'Resolved' }];
  const phaseIndex: Record<string, number> = { sent: 0, searching: 1, found: 2, on_scene: 3, resolved: 4, cancelled: 4 };
  const current = phaseIndex[phase];
  return (
    <View style={tl.row}>
      {steps.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <React.Fragment key={step.key}>
            <View style={tl.step}>
              <View style={[tl.dot, done && tl.dotDone, active && tl.dotActive]}>
                {done ? <CheckCircle color="#fff" size={10} /> : <Text style={tl.dotText}>{i + 1}</Text>}
              </View>
              <Text style={[tl.label, active && tl.labelActive]}>{step.label}</Text>
            </View>
            {i < steps.length - 1 && <View style={[tl.line, done && tl.lineDone]} />}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const tl = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', paddingHorizontal: 8, paddingVertical: 12 },
  step: { alignItems: 'center', gap: 4 },
  dot: { width: 26, height: 26, borderRadius: 13, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
  dotDone: { backgroundColor: Colors.success, borderColor: Colors.success },
  dotActive: { backgroundColor: '#F59E0B', borderColor: '#F59E0B' },
  dotText: { color: Colors.textMuted, fontSize: 9, fontWeight: '700' },
  label: { color: Colors.textMuted, fontSize: 8, fontWeight: '600', letterSpacing: 0.3, textAlign: 'center', maxWidth: 44 },
  labelActive: { color: '#F59E0B' },
  line: { flex: 1, height: 1, backgroundColor: Colors.border, marginTop: 13, marginHorizontal: 2 },
  lineDone: { backgroundColor: Colors.success },
});

// ─── Responder Emergency View ──────────────────────────────────────────
function ResponderEmergencyView({
  emergency,
  citizenProfile,
  profile,
  onBack,
  onOpenMap,
  onResolved,
}: {
  emergency: Emergency;
  citizenProfile: Profile | null;
  profile: Profile;
  onBack: () => void;
  onOpenMap: () => void;
  onResolved: () => void;
}) {
  const [distance, setDistance] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);
  const [resolved, setResolved] = useState(emergency.status === 'resolved');
  const [markingOnScene, setMarkingOnScene] = useState(false);

  const isActive = emergency.status !== 'resolved' && emergency.status !== 'cancelled';

  // Compute distance from responder's current position to emergency
  useEffect(() => {
    if (!emergency.latitude || !emergency.longitude) return;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') { setDistance('-- km'); return; }
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const km = haversineKm(pos.coords.latitude, pos.coords.longitude, emergency.latitude!, emergency.longitude!);
        setDistance(km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`);
      } catch {
        setDistance('-- km');
      }
    })();
  }, [emergency.latitude, emergency.longitude]);

  const handleMarkOnScene = async () => {
    if (emergency.status !== 'dispatched') return;
    setMarkingOnScene(true);
    await supabase.from('emergencies').update({ status: 'on_scene' } as never).eq('id', emergency.id);
    setMarkingOnScene(false);
  };

  const handleMarkResolved = () => {
    Alert.alert(
      'Mark as Resolved',
      'Confirm the emergency has been handled and the situation is resolved.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Resolved',
          onPress: async () => {
            setResolving(true);
            try {
              await supabase.from('emergencies')
                .update({ status: 'resolved', resolved_at: new Date().toISOString() } as never)
                .eq('id', emergency.id);
              setResolved(true);
              onResolved();
            } catch {
              Alert.alert('Error', 'Failed to mark as resolved.');
            } finally {
              setResolving(false);
            }
          },
        },
      ]
    );
  };

  const handleNavigate = () => {
    if (!emergency.latitude || !emergency.longitude) {
      Alert.alert('No Location', 'This emergency has no GPS coordinates.');
      return;
    }
    const lat = emergency.latitude;
    const lng = emergency.longitude;
    const url = Platform.OS === 'ios'
      ? `maps://?daddr=${lat},${lng}`
      : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://maps.google.com/?daddr=${lat},${lng}`);
    });
  };

  const handleCall = () => {
    const phone = citizenProfile?.phone;
    if (!phone) { Alert.alert('No Phone', 'Citizen has not provided a phone number.'); return; }
    Linking.openURL(`tel:${phone}`);
  };

  const allergies = citizenProfile?.allergies
    ? citizenProfile.allergies.split(',').map(a => a.trim()).filter(Boolean)
    : [];

  const age = getAge(citizenProfile?.date_of_birth ?? null);
  const initials = citizenProfile ? getInitials(citizenProfile.full_name) : '?';
  const typeLabel = getEmergencyTypeLabel(emergency.description);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* Alert accepted banner */}
      <View style={rv.alertBanner}>
        <CheckCircle color="#fff" size={16} strokeWidth={2.5} />
        <Text style={rv.alertBannerText}>ALERT ACCEPTED</Text>
        <Text style={rv.alertBannerTime}>{getTimeAgo(emergency.updated_at)}</Text>
      </View>

      {/* Header */}
      <View style={rv.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <ArrowLeft color={Colors.text} size={22} />
        </TouchableOpacity>
        <Text style={rv.headerTitle}>EMERGENCY</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={rv.scroll}>

        {/* Citizen Card */}
        <View style={rv.card}>
          {/* Name row */}
          <View style={rv.nameRow}>
            <LinearGradient colors={['#5a0010', '#2a0005']} style={rv.avatar}>
              <Text style={rv.avatarInitials}>{initials}</Text>
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <View style={rv.nameBadgeRow}>
                <Text style={rv.name}>{citizenProfile?.full_name || 'Unknown Citizen'}</Text>
                <View style={rv.typeBadge}>
                  <Text style={rv.typeBadgeText}>{typeLabel.length > 10 ? typeLabel.substring(0, 10) : typeLabel}</Text>
                </View>
              </View>
              <Text style={rv.ageLine}>
                {age !== null ? `${age} years` : null}
                {age !== null && citizenProfile?.gender ? ' · ' : null}
                {citizenProfile?.gender ?? null}
              </Text>
            </View>
          </View>

          {/* Medical chips */}
          {(citizenProfile?.blood_type || allergies.length > 0) && (
            <View style={rv.chipsRow}>
              {citizenProfile?.blood_type && (
                <View style={rv.chip}>
                  <Droplets color={Colors.primary} size={11} />
                  <Text style={rv.chipText}>Blood: {citizenProfile.blood_type}</Text>
                </View>
              )}
              {allergies.map((a, i) => (
                <View key={i} style={[rv.chip, rv.allergyChip]}>
                  <AlertTriangle color={Colors.warning} size={10} />
                  <Text style={[rv.chipText, { color: Colors.warning }]}>Allergy: {a}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Emergency contact */}
          {(citizenProfile?.emergency_contact_name || citizenProfile?.emergency_contact_phone) && (
            <View style={rv.contactSection}>
              <Text style={rv.contactLabel}>EMERGENCY CONTACT</Text>
              <Text style={rv.contactValue}>
                {citizenProfile.emergency_contact_name}
                {citizenProfile.emergency_contact_name && citizenProfile.emergency_contact_phone ? ' – ' : ''}
                {citizenProfile.emergency_contact_phone}
              </Text>
            </View>
          )}
        </View>

        {/* Location Card */}
        <View style={rv.card}>
          <View style={rv.locationRow}>
            <View style={rv.pinWrap}>
              <MapPin color={Colors.primary} size={20} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={rv.locationName} numberOfLines={2}>
                {emergency.address || 'Location not available'}
              </Text>
              {emergency.latitude && emergency.longitude && (
                <Text style={rv.locationCoords}>
                  {emergency.latitude.toFixed(4)}, {emergency.longitude.toFixed(4)}
                </Text>
              )}
              {distance && (
                <Text style={rv.locationDistance}>{distance} from your location</Text>
              )}
            </View>
          </View>
        </View>

        {/* Navigate button */}
        {isActive && (
          <TouchableOpacity style={rv.navigateBtn} onPress={handleNavigate} activeOpacity={0.85}>
            <LinearGradient colors={[Colors.primaryDark, Colors.primary]} style={rv.navigateBtnInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Navigation color="#fff" size={18} />
              <Text style={rv.navigateBtnText}>NAVIGATE TO LOCATION</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Message + Call */}
        <View style={rv.actionRow}>
          <TouchableOpacity style={rv.actionBtn} activeOpacity={0.8}
            onPress={() => Alert.alert('Message', 'Messaging feature coming soon.')}
          >
            <MessageCircle color={Colors.textSecondary} size={18} />
            <Text style={rv.actionBtnText}>Message</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[rv.actionBtn, { borderColor: Colors.success + '40' }]} activeOpacity={0.8} onPress={handleCall}>
            <Phone color={Colors.success} size={18} />
            <Text style={[rv.actionBtnText, { color: Colors.success }]}>Call</Text>
          </TouchableOpacity>
        </View>

        {/* Track live location */}
        {isActive && (
          <TouchableOpacity style={rv.trackBtn} onPress={onOpenMap} activeOpacity={0.8}>
            <Map color={Colors.info} size={16} />
            <Text style={rv.trackBtnText}>Track Live Location</Text>
          </TouchableOpacity>
        )}

        {/* Injury Photo */}
        <View style={rv.sectionHeader}>
          <Text style={rv.sectionHeaderText}>INJURY PHOTO</Text>
        </View>
        {emergency.photo_url ? (
          <View style={rv.photoCard}>
            <Image source={{ uri: emergency.photo_url }} style={rv.injuryPhoto} resizeMode="cover" />
          </View>
        ) : (
          <View style={rv.noPhotoCard}>
            <UserCircle color={Colors.textMuted} size={36} />
            <Text style={rv.noPhotoText}>No injury photo was uploaded</Text>
          </View>
        )}

        {/* Resolved / Cancelled state */}
        {emergency.status === 'resolved' && (
          <View style={[rv.card, { borderColor: Colors.success + '40', backgroundColor: Colors.success + '08', marginTop: 12 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <CheckCircle color={Colors.success} size={20} />
              <Text style={{ fontFamily: Fonts.body, fontSize: 14, color: Colors.success, flex: 1 }}>Emergency resolved successfully.</Text>
            </View>
          </View>
        )}

        {/* Mark Resolved button */}
        {isActive && (
          <TouchableOpacity
            style={[rv.resolveBtn, resolving && { opacity: 0.6 }]}
            onPress={handleMarkResolved}
            disabled={resolving}
            activeOpacity={0.85}
          >
            <LinearGradient colors={['#166534', Colors.success]} style={rv.resolveBtnInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              {resolving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <CheckCircle color="#fff" size={18} strokeWidth={2.5} />
                  <Text style={rv.resolveBtnText}>MARK RESOLVED</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const rv = StyleSheet.create({
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 54 : 36,
    paddingBottom: 10,
    gap: 8,
  },
  alertBannerText: {
    fontFamily: Fonts.heading,
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 1,
    flex: 1,
  },
  alertBannerTime: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    flex: 1,
    fontFamily: Fonts.heading,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: 2,
    textAlign: 'center',
  },
  scroll: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 40 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
  },
  nameRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontFamily: Fonts.heading,
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  nameBadgeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap', flex: 1 },
  name: {
    fontFamily: Fonts.heading,
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary + '70',
    backgroundColor: Colors.primary + '15',
  },
  typeBadgeText: {
    fontFamily: Fonts.heading,
    fontSize: 9,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 0.8,
  },
  ageLine: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 3,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginBottom: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.primary + '12',
    borderWidth: 1,
    borderColor: Colors.primary + '30',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  allergyChip: {
    backgroundColor: Colors.warning + '12',
    borderColor: Colors.warning + '30',
  },
  chipText: {
    fontFamily: Fonts.heading,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 0.3,
  },
  contactSection: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 10,
  },
  contactLabel: {
    fontFamily: Fonts.heading,
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  contactValue: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.text,
    fontWeight: '500',
  },
  locationRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  pinWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primary + '18',
    borderWidth: 1,
    borderColor: Colors.primary + '35',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  locationName: {
    fontFamily: Fonts.heading,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  locationCoords: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.textMuted,
    marginBottom: 3,
  },
  locationDistance: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.info,
    fontWeight: '600',
  },
  navigateBtn: { borderRadius: 14, overflow: 'hidden', marginBottom: 10 },
  navigateBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  navigateBtnText: {
    fontFamily: Fonts.heading,
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 1.5,
  },
  actionRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionBtnText: {
    fontFamily: Fonts.heading,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  trackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.info + '12',
    borderWidth: 1,
    borderColor: Colors.info + '35',
    marginBottom: 16,
  },
  trackBtnText: {
    fontFamily: Fonts.heading,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.info,
    letterSpacing: 0.5,
  },
  sectionHeader: {
    marginBottom: 8,
  },
  sectionHeaderText: {
    fontFamily: Fonts.heading,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 2,
  },
  photoCard: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  injuryPhoto: {
    width: '100%',
    height: 200,
  },
  noPhotoCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    paddingVertical: 28,
    gap: 8,
    marginBottom: 12,
  },
  noPhotoText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.textMuted,
  },
  resolveBtn: { borderRadius: 14, overflow: 'hidden', marginTop: 4 },
  resolveBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 17,
    gap: 10,
  },
  resolveBtnText: {
    fontFamily: Fonts.heading,
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 2,
  },
});

// ─── Main Screen ──────────────────────────────────────────────────────
export default function EmergencyDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile, isResponder } = useAuth();
  const [emergency, setEmergency] = useState<Emergency | null>(null);
  const [citizenProfile, setCitizenProfile] = useState<Profile | null>(null);
  const [responderProfile, setResponderProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMap, setShowMap] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const dotAnim = useRef(new Animated.Value(0)).current;

  const fetchEmergency = useCallback(async () => {
    if (!id) return;
    const { data, error } = await supabase.from('emergencies').select('*').eq('id', id).maybeSingle();
    if (!error && data) setEmergency(data as Emergency);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchEmergency();
    const interval = setInterval(fetchEmergency, 8000);
    return () => clearInterval(interval);
  }, [fetchEmergency]);

  // Fetch citizen profile (for responder view medical card)
  useEffect(() => {
    if (!emergency?.citizen_id) return;
    supabase.from('profiles').select('*').eq('id', emergency.citizen_id).maybeSingle()
      .then(({ data }) => setCitizenProfile(data as Profile | null));
  }, [emergency?.citizen_id]);

  // Fetch responder profile (for citizen view / live map)
  useEffect(() => {
    if (!emergency?.responder_id) { setResponderProfile(null); return; }
    supabase.from('profiles').select('*').eq('id', emergency.responder_id).maybeSingle()
      .then(({ data }) => setResponderProfile(data as Profile | null));
  }, [emergency?.responder_id]);

  useEffect(() => {
    const pulse = Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
    ]));
    pulse.start();
    const dot = Animated.loop(Animated.sequence([
      Animated.timing(dotAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(dotAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]));
    dot.start();
    return () => { pulse.stop(); dot.stop(); };
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  if (!emergency) {
    return (
      <LinearGradient colors={['#000', '#0D0000']} style={styles.container}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft color={Colors.text} size={22} />
        </TouchableOpacity>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <AlertCircle color={Colors.textMuted} size={48} />
          <Text style={styles.notFoundText}>Emergency not found</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()}>
            <Text style={styles.retryText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  // Live map view
  if (showMap && profile) {
    return (
      <RealLiveMap
        emergency={emergency}
        profile={profile}
        isResponder={isResponder}
        responderProfile={responderProfile}
        onClose={() => setShowMap(false)}
      />
    );
  }

  // Responder view: show when user is the assigned responder
  const isAssignedResponder = isResponder && emergency.responder_id === profile?.id;
  if (isAssignedResponder && profile) {
    return (
      <ResponderEmergencyView
        emergency={emergency}
        citizenProfile={citizenProfile}
        profile={profile}
        onBack={() => router.back()}
        onOpenMap={() => setShowMap(true)}
        onResolved={fetchEmergency}
      />
    );
  }

  // ─── Citizen view ──────────────────────────────────────────────────
  const phase = getPhase(emergency.status);
  const statusColor = getStatusColor(phase);
  const hasResponder = phase === 'found' || phase === 'on_scene' || phase === 'resolved';
  const isSearching = phase === 'searching';
  const isActive = phase !== 'resolved' && phase !== 'cancelled';

  const formatTime = (s: string) => new Date(s).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formatDate = (s: string) => new Date(s).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });

  const handleCancelRequest = () => {
    Alert.alert('Cancel Emergency Request', 'Are you sure you want to cancel?', [
      { text: 'Keep Active', style: 'cancel' },
      {
        text: 'Cancel Request', style: 'destructive',
        onPress: async () => {
          setCancelling(true);
          try {
            await supabase.from('emergencies').update({ status: 'cancelled' } as never).eq('id', emergency.id);
            await fetchEmergency();
          } catch { Alert.alert('Error', 'Failed to cancel.'); }
          finally { setCancelling(false); }
        },
      },
    ]);
  };

  return (
    <LinearGradient colors={['#000000', '#0D0000', '#000000']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft color={Colors.text} size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Emergency Report</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchEmergency}>
          <RefreshCw color={Colors.textMuted} size={18} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={[styles.statusBanner, { borderColor: statusColor + '50', backgroundColor: statusColor + '12' }]}>
          {isSearching ? (
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <Loader color={statusColor} size={26} />
            </Animated.View>
          ) : (
            <CheckCircle color={statusColor} size={26} />
          )}
          <View style={{ flex: 1 }}>
            <Text style={[styles.statusLabel, { color: statusColor }]}>{getStatusLabel(phase)}</Text>
            {isSearching && <Text style={styles.statusSubtext}>Looking for the nearest available responder…</Text>}
            {phase === 'found' && <Text style={styles.statusSubtext}>Responder is on the way to your location</Text>}
            {phase === 'on_scene' && <Text style={styles.statusSubtext}>Responder has arrived at your location</Text>}
            {phase === 'resolved' && <Text style={styles.statusSubtext}>Your emergency has been successfully resolved</Text>}
          </View>
          <Animated.View style={[styles.statusDot, { backgroundColor: statusColor, opacity: dotAnim }]} />
        </View>

        <View style={styles.card}>
          <StatusTimeline phase={phase} />
        </View>

        {isSearching && (
          <View style={styles.searchingCard}>
            <View style={styles.searchingOuter}>
              {[0, 1, 2].map((i) => (
                <Animated.View key={i} style={[styles.searchingRing, { width: 80 + i * 40, height: 80 + i * 40, borderRadius: (80 + i * 40) / 2 }]} />
              ))}
              <View style={styles.searchingCore}><Text style={{ fontSize: 28 }}>🔍</Text></View>
            </View>
            <Text style={styles.searchingText}>Contacting nearby responders</Text>
            <Text style={styles.searchingSubtext}>This usually takes less than 60 seconds</Text>
          </View>
        )}

        {hasResponder && (
          <View style={styles.responderCard}>
            <View style={styles.responderHeader}>
              <View style={styles.responderAvatar}>
                <Text style={styles.responderInitials}>{responderProfile ? getInitials(responderProfile.full_name) : 'R'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.responderName}>{responderProfile?.full_name || 'Responder'}</Text>
                <Text style={styles.responderRole}>{responderProfile?.department || 'Emergency Responder'}</Text>
              </View>
              {phase === 'found' && (
                <View style={styles.enRoutePill}><Text style={styles.enRouteText}>EN ROUTE</Text></View>
              )}
            </View>
            <View style={styles.responderActions}>
              <TouchableOpacity style={styles.responderActionBtn} onPress={() => Alert.alert('Call Responder', `Call ${responderProfile?.full_name || 'responder'}?`, [{ text: 'Cancel', style: 'cancel' }, { text: 'Call' }])}>
                <Phone color={Colors.success} size={18} />
                <Text style={styles.responderActionText}>Call</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.responderActionBtn, { backgroundColor: Colors.primary + '18', borderColor: Colors.primary + '40' }]} onPress={() => setShowMap(true)}>
                <Navigation color={Colors.primary} size={18} />
                <Text style={[styles.responderActionText, { color: Colors.primary }]}>Track Location</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {(hasResponder || isResponder) && isActive && (
          <TouchableOpacity style={styles.trackMapBtn} onPress={() => setShowMap(true)} activeOpacity={0.85}>
            <LinearGradient colors={['#1a3a6b', '#2980B9']} style={styles.trackMapBtnInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Navigation color="#fff" size={20} />
              <Text style={styles.trackMapBtnText}>TRACK RESPONDER ON MAP</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Emergency Details</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Type</Text>
            <Text style={styles.infoValue}>{emergency.emergency_type?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status</Text>
            <View style={[styles.statusPill, { backgroundColor: statusColor + '20' }]}>
              <Text style={[styles.statusPillText, { color: statusColor }]}>{emergency.status.toUpperCase()}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <View style={styles.infoRowLeft}><Clock color={Colors.textMuted} size={14} /><Text style={styles.infoLabel}>Time</Text></View>
            <Text style={styles.infoValue}>{formatTime(emergency.created_at)} • {formatDate(emergency.created_at)}</Text>
          </View>
          {emergency.address && (
            <>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <View style={styles.infoRowLeft}><MapPin color={Colors.textMuted} size={14} /><Text style={styles.infoLabel}>Location</Text></View>
                <Text style={[styles.infoValue, { maxWidth: '60%', textAlign: 'right' }]} numberOfLines={2}>{emergency.address}</Text>
              </View>
            </>
          )}
          {emergency.description && (
            <>
              <View style={styles.divider} />
              <View style={{ gap: 4 }}>
                <Text style={styles.infoLabel}>Description</Text>
                <Text style={styles.descText}>{emergency.description}</Text>
              </View>
            </>
          )}
        </View>

        {phase === 'resolved' && (
          <View style={[styles.card, { borderColor: Colors.success + '40', backgroundColor: Colors.success + '08' }]}>
            <View style={styles.resolvedRow}>
              <CheckCircle color={Colors.success} size={22} />
              <Text style={styles.resolvedText}>This emergency was successfully resolved. Stay safe!</Text>
            </View>
          </View>
        )}

        {phase === 'cancelled' && (
          <View style={[styles.card, { borderColor: Colors.textMuted + '40', backgroundColor: Colors.textMuted + '08' }]}>
            <View style={styles.resolvedRow}>
              <XCircle color={Colors.textMuted} size={22} />
              <Text style={[styles.resolvedText, { color: Colors.textMuted }]}>This emergency request was cancelled.</Text>
            </View>
          </View>
        )}

        {isSearching && !isResponder && (
          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelRequest} disabled={cancelling} activeOpacity={0.8}>
            {cancelling ? <ActivityIndicator color={Colors.error} size="small" /> : <XCircle color={Colors.error} size={18} />}
            <Text style={styles.cancelBtnText}>{cancelling ? 'Cancelling…' : 'Cancel Emergency Request'}</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 56 : 40, paddingBottom: 12, gap: 12,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { flex: 1, fontFamily: Fonts.heading, fontSize: 18, fontWeight: '700', color: Colors.text, letterSpacing: 1 },
  refreshBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingHorizontal: 16, paddingBottom: 80 },
  statusBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 12 },
  statusLabel: { fontFamily: Fonts.heading, fontSize: 15, fontWeight: '700', letterSpacing: 0.5 },
  statusSubtext: { fontFamily: Fonts.body, fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  statusDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  card: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.border, marginBottom: 12 },
  cardTitle: { fontFamily: Fonts.heading, fontSize: 13, fontWeight: '600', color: Colors.textSecondary, letterSpacing: 1, marginBottom: 12, textTransform: 'uppercase' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  infoRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoLabel: { fontFamily: Fonts.body, fontSize: 13, color: Colors.textMuted },
  infoValue: { fontFamily: Fonts.body, fontSize: 13, color: Colors.text, fontWeight: '600' },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 2 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusPillText: { fontFamily: Fonts.heading, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  descText: { fontFamily: Fonts.body, fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  searchingCard: { backgroundColor: Colors.surface, borderRadius: 16, padding: 24, borderWidth: 1, borderColor: '#F59E0B30', alignItems: 'center', marginBottom: 12 },
  searchingOuter: { width: 160, height: 160, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  searchingRing: { position: 'absolute', borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)' },
  searchingCore: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#F59E0B20', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#F59E0B40' },
  searchingText: { fontFamily: Fonts.heading, fontSize: 15, fontWeight: '700', color: '#F59E0B', letterSpacing: 0.5, textAlign: 'center' },
  searchingSubtext: { fontFamily: Fonts.body, fontSize: 12, color: Colors.textMuted, marginTop: 6, textAlign: 'center' },
  responderCard: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.success + '30', marginBottom: 12 },
  responderHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  responderAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#1a3a6b', borderWidth: 2, borderColor: '#2980B9', justifyContent: 'center', alignItems: 'center' },
  responderInitials: { fontFamily: Fonts.heading, fontSize: 16, fontWeight: '700', color: '#fff' },
  responderName: { fontFamily: Fonts.heading, fontSize: 15, fontWeight: '700', color: Colors.text },
  responderRole: { fontFamily: Fonts.body, fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  enRoutePill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, backgroundColor: '#F59E0B20', borderColor: '#F59E0B50' },
  enRouteText: { fontFamily: Fonts.heading, fontSize: 10, fontWeight: '700', color: '#F59E0B', letterSpacing: 0.5 },
  responderActions: { flexDirection: 'row', gap: 10 },
  responderActionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, backgroundColor: Colors.success + '15', borderWidth: 1, borderColor: Colors.success + '40' },
  responderActionText: { fontFamily: Fonts.heading, fontSize: 12, fontWeight: '700', color: Colors.success, letterSpacing: 0.5 },
  trackMapBtn: { borderRadius: 14, overflow: 'hidden', marginBottom: 12 },
  trackMapBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 10 },
  trackMapBtnText: { fontFamily: Fonts.heading, fontSize: 13, fontWeight: '700', color: '#FFFFFF', letterSpacing: 1.5 },
  resolvedRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  resolvedText: { fontFamily: Fonts.body, fontSize: 14, color: Colors.success, flex: 1, lineHeight: 20 },
  cancelBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.error + '50', backgroundColor: Colors.error + '10', marginBottom: 12 },
  cancelBtnText: { fontFamily: Fonts.heading, fontSize: 13, fontWeight: '700', color: Colors.error, letterSpacing: 0.5 },
  notFoundText: { fontFamily: Fonts.body, fontSize: 16, color: Colors.textMuted, marginTop: 16 },
  retryBtn: { marginTop: 20, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: Colors.surface, borderRadius: 12 },
  retryText: { fontFamily: Fonts.heading, fontSize: 14, color: Colors.primary, fontWeight: '700' },
});
