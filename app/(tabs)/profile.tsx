import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/lib/auth-context';
import { Colors, Fonts } from '@/constants/theme';
import {
  User,
  Mail,
  Phone,
  Shield,
  LogOut,
  ChevronRight,
  HelpCircle,
  FileText,
  Bell,
  Lock,
  MapPin,
  Camera,
  AlertTriangle,
  ExternalLink,
  Siren,
} from 'lucide-react-native';

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, signOut, updateProfile, refreshProfile } = useAuth();
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'responder': return 'Emergency Responder';
      default: return 'Citizen';
    }
  };

  const handleAvatarPress = () => {
    Alert.alert('Change Profile Photo', '', [
      { text: 'Take Photo', onPress: handleTakePhoto },
      { text: 'Choose from Library', onPress: handlePickPhoto },
      profile?.avatar_url ? { text: 'Remove Photo', style: 'destructive', onPress: removePhoto } : null,
      { text: 'Cancel', style: 'cancel' },
    ].filter(Boolean) as any[]);
  };

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow photo library access in Settings.', [{ text: 'OK' }]);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.75,
    });
    if (!result.canceled && result.assets[0]) {
      await saveAvatar(result.assets[0].uri);
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow camera access in Settings.', [{ text: 'OK' }]);
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.75,
    });
    if (!result.canceled && result.assets[0]) {
      await saveAvatar(result.assets[0].uri);
    }
  };

  const removePhoto = async () => {
    await updateProfile({ avatar_url: null });
    await refreshProfile();
  };

  const saveAvatar = async (uri: string) => {
    setUploadingAvatar(true);
    try {
      // Store local URI immediately for instant feedback
      await updateProfile({ avatar_url: uri });
      await refreshProfile();
    } catch {
      Alert.alert('Error', 'Failed to update profile photo.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const initials = (profile?.full_name || 'U').split(' ').map((w: string) => w[0]).join('').substring(0, 2).toUpperCase();

  return (
    <LinearGradient colors={[Colors.background, Colors.backgroundSecondary]} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <TouchableOpacity style={styles.avatarContainer} onPress={handleAvatarPress} activeOpacity={0.8}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
            ) : (
              <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.avatar}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </LinearGradient>
            )}
            <View style={styles.cameraBtn}>
              {uploadingAvatar ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Camera color="#fff" size={14} />
              )}
            </View>
          </TouchableOpacity>

          <Text style={styles.profileName}>{profile?.full_name || 'User'}</Text>

          {profile?.email && (
            <View style={styles.infoRow}>
              <Mail color={Colors.textMuted} size={14} />
              <Text style={styles.infoText}>{profile.email}</Text>
            </View>
          )}
          {profile?.phone && (
            <View style={styles.infoRow}>
              <Phone color={Colors.textMuted} size={14} />
              <Text style={styles.infoText}>{profile.phone}</Text>
            </View>
          )}
          <View style={styles.roleBadge}>
            <Shield color={Colors.primary} size={14} />
            <Text style={styles.roleText}>{getRoleLabel(profile?.role || 'citizen')}</Text>
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          <MenuItem
            icon={<User color={Colors.info} size={20} />}
            iconBg={Colors.info + '20'}
            label="Edit Profile"
            sublabel="Name, phone, photo"
            onPress={() => router.push('/profile/edit')}
          />
          <MenuItem
            icon={<Lock color={Colors.warning} size={20} />}
            iconBg={Colors.warning + '20'}
            label="Change Password"
            sublabel="Update your login credentials"
            onPress={() => router.push('/profile/change-password')}
          />
          <MenuItem
            icon={<Bell color={Colors.success} size={20} />}
            iconBg={Colors.success + '20'}
            label="Notifications"
            sublabel="Manage alert preferences"
            onPress={() => router.push('/profile/notifications')}
          />
          <MenuItem
            icon={<MapPin color={Colors.primary} size={20} />}
            iconBg={Colors.primary + '20'}
            label="My Reports"
            sublabel="View your emergency history"
            onPress={() => router.push('/(tabs)/emergencies')}
          />
        </View>

        {/* Emergency Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency</Text>

          <MenuItem
            icon={<Siren color={Colors.error} size={20} />}
            iconBg={Colors.error + '20'}
            label="Emergency Contacts"
            sublabel="Quick-dial emergency numbers"
            onPress={() => router.push('/(tabs)/contacts')}
          />
          <MenuItem
            icon={<AlertTriangle color={Colors.warning} size={20} />}
            iconBg={Colors.warning + '15'}
            label="First Aid Guides"
            sublabel="Offline emergency guides"
            onPress={() => router.push('/(tabs)/first-aid')}
          />
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>

          <MenuItem
            icon={<HelpCircle color={Colors.textSecondary} size={20} />}
            iconBg={Colors.textSecondary + '20'}
            label="Help & Support"
            sublabel="FAQs and guides"
            onPress={() => Linking.openURL('https://support.example.com').catch(() => Alert.alert('', 'Help center not available.'))}
          />
          <MenuItem
            icon={<FileText color={Colors.textSecondary} size={20} />}
            iconBg={Colors.textSecondary + '20'}
            label="Privacy Policy"
            sublabel="How we handle your data"
            onPress={() => Linking.openURL('https://example.com/privacy').catch(() => Alert.alert('', 'Privacy policy not available.'))}
            rightIcon={<ExternalLink color={Colors.textMuted} size={16} />}
          />
          <MenuItem
            icon={<FileText color={Colors.textSecondary} size={20} />}
            iconBg={Colors.textSecondary + '20'}
            label="Terms of Service"
            sublabel="Our terms and conditions"
            onPress={() => Linking.openURL('https://example.com/terms').catch(() => Alert.alert('', 'Terms not available.'))}
            rightIcon={<ExternalLink color={Colors.textMuted} size={16} />}
          />
        </View>

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut} activeOpacity={0.8}>
          <LogOut color={Colors.error} size={20} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={styles.appInfo}>
          <Text style={styles.appName}>SafetyFirst Medical</Text>
          <Text style={styles.appVersion}>Version 1.0.0 • Emergency Response Uganda</Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </LinearGradient>
  );
}

function MenuItem({
  icon,
  iconBg,
  label,
  sublabel,
  onPress,
  rightIcon,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  sublabel?: string;
  onPress: () => void;
  rightIcon?: React.ReactNode;
}) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.menuLeft}>
        <View style={[styles.menuIcon, { backgroundColor: iconBg }]}>{icon}</View>
        <View style={{ flex: 1 }}>
          <Text style={styles.menuText}>{label}</Text>
          {sublabel && <Text style={styles.menuSub}>{sublabel}</Text>}
        </View>
      </View>
      {rightIcon || <ChevronRight color={Colors.textMuted} size={20} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
  },
  title: {
    fontFamily: Fonts.heading,
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: 1,
  },
  profileCard: {
    marginHorizontal: 24,
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatarContainer: {
    marginBottom: 14,
    position: 'relative',
  },
  avatarImage: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  avatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontFamily: Fonts.heading,
    fontSize: 30,
    fontWeight: '700',
    color: '#fff',
  },
  cameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
  },
  profileName: {
    fontFamily: Fonts.heading,
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  infoText: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 7,
    backgroundColor: Colors.primary + '15',
    borderRadius: 20,
    gap: 6,
  },
  roleText: {
    fontFamily: Fonts.heading,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: Fonts.heading,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  menuText: {
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.text,
    fontWeight: '500',
  },
  menuSub: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: Colors.error + '15',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.error + '30',
    marginBottom: 20,
  },
  signOutText: {
    fontFamily: Fonts.heading,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.error,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  appName: {
    fontFamily: Fonts.heading,
    fontSize: 14,
    color: Colors.textMuted,
    letterSpacing: 2,
  },
  appVersion: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 4,
  },
});
