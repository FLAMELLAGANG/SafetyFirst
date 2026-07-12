import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts } from '@/constants/theme';
import { ArrowLeft, Bell, MessageSquare, Siren, Volume2, Smartphone, Shield } from 'lucide-react-native';

type NotifSetting = {
  id: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  value: boolean;
  color: string;
};

export default function NotificationsScreen() {
  const router = useRouter();

  const [settings, setSettings] = useState<NotifSetting[]>([
    {
      id: 'sos_alerts',
      icon: <Siren color={Colors.error} size={20} />,
      title: 'SOS Alert Updates',
      subtitle: 'Get notified when a responder accepts your alert',
      value: true,
      color: Colors.error,
    },
    {
      id: 'responder_status',
      icon: <Shield color={Colors.info} size={20} />,
      title: 'Responder Status',
      subtitle: 'En route, arrived, and resolved notifications',
      value: true,
      color: Colors.info,
    },
    {
      id: 'messages',
      icon: <MessageSquare color={Colors.success} size={20} />,
      title: 'Messages',
      subtitle: 'In-app messages from your responder',
      value: true,
      color: Colors.success,
    },
    {
      id: 'push',
      icon: <Bell color={Colors.warning} size={20} />,
      title: 'Push Notifications',
      subtitle: 'Receive alerts even when the app is closed',
      value: true,
      color: Colors.warning,
    },
    {
      id: 'sound',
      icon: <Volume2 color='#8B5CF6' size={20} />,
      title: 'Notification Sound',
      subtitle: 'Play sound for emergency alerts',
      value: true,
      color: '#8B5CF6',
    },
    {
      id: 'vibration',
      icon: <Smartphone color={Colors.textSecondary} size={20} />,
      title: 'Vibration',
      subtitle: 'Vibrate device on alerts',
      value: false,
      color: Colors.textSecondary,
    },
  ]);

  const toggle = (id: string) => {
    setSettings(prev => prev.map(s => s.id === id ? { ...s, value: !s.value } : s));
  };

  return (
    <LinearGradient colors={['#000000', '#0D0000', '#000000']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft color={Colors.text} size={22} />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Summary badge */}
        <View style={styles.summaryCard}>
          <Bell color={Colors.warning} size={22} />
          <View style={{ flex: 1 }}>
            <Text style={styles.summaryTitle}>Notification Preferences</Text>
            <Text style={styles.summarySubtext}>
              {settings.filter(s => s.value).length} of {settings.length} notifications enabled
            </Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>EMERGENCY ALERTS</Text>
        {settings.slice(0, 3).map((s) => (
          <NotifRow key={s.id} setting={s} onToggle={() => toggle(s.id)} />
        ))}

        <Text style={styles.sectionLabel}>DEVICE</Text>
        {settings.slice(3).map((s) => (
          <NotifRow key={s.id} setting={s} onToggle={() => toggle(s.id)} />
        ))}

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>⚠ SOS alerts cannot be silenced</Text>
          <Text style={styles.infoText}>
            Emergency SOS alerts will always play at maximum volume regardless of your notification settings. This is for your safety.
          </Text>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </LinearGradient>
  );
}

function NotifRow({ setting, onToggle }: { setting: NotifSetting; onToggle: () => void }) {
  return (
    <View style={styles.row}>
      <View style={[styles.rowIcon, { backgroundColor: setting.color + '20' }]}>
        {setting.icon}
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowTitle}>{setting.title}</Text>
        <Text style={styles.rowSubtitle}>{setting.subtitle}</Text>
      </View>
      <Switch
        value={setting.value}
        onValueChange={onToggle}
        trackColor={{ false: Colors.border, true: setting.color + '60' }}
        thumbColor={setting.value ? setting.color : Colors.textMuted}
        ios_backgroundColor={Colors.border}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 12,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    fontFamily: Fonts.heading,
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: 0.5,
  },
  content: { paddingHorizontal: 16, paddingBottom: 40 },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.warning + '30',
    marginBottom: 20,
  },
  summaryTitle: {
    fontFamily: Fonts.heading,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  summarySubtext: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  sectionLabel: {
    fontFamily: Fonts.heading,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 2,
    marginBottom: 10,
    marginLeft: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
    gap: 12,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowBody: { flex: 1 },
  rowTitle: {
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.text,
    fontWeight: '600',
  },
  rowSubtitle: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
    lineHeight: 18,
  },
  infoBox: {
    backgroundColor: Colors.warning + '10',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.warning + '30',
    marginTop: 8,
  },
  infoTitle: {
    fontFamily: Fonts.heading,
    fontSize: 13,
    color: Colors.warning,
    fontWeight: '700',
    marginBottom: 8,
  },
  infoText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});
