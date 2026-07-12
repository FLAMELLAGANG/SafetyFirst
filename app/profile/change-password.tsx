import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';
import { Colors, Fonts } from '@/constants/theme';
import { ArrowLeft, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react-native';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ current?: string; new?: string; confirm?: string }>({});

  const validate = (): boolean => {
    const errs: typeof errors = {};
    if (!currentPassword) errs.current = 'Current password is required';
    if (!newPassword || newPassword.length < 8) errs.new = 'New password must be at least 8 characters';
    if (newPassword !== confirmPassword) errs.confirm = 'Passwords do not match';
    if (newPassword === currentPassword) errs.new = 'New password must be different from current';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      // Re-authenticate by signing in with current password first
      const { data: userData } = await supabase.auth.getUser();
      const email = userData.user?.email;
      if (!email) throw new Error('User not found');

      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: currentPassword });
      if (signInError) {
        setErrors({ current: 'Current password is incorrect' });
        return;
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      Alert.alert('Password Changed', 'Your password has been updated successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to change password. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <LinearGradient colors={['#000000', '#0D0000', '#000000']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft color={Colors.text} size={22} />
        </TouchableOpacity>
        <Text style={styles.title}>Change Password</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Icon */}
        <View style={styles.iconWrap}>
          <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.iconCircle}>
            <ShieldCheck color="#fff" size={36} />
          </LinearGradient>
          <Text style={styles.iconSubtext}>Keep your account secure with a strong password</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Password</Text>
          <View style={[styles.inputWrap, errors.current && styles.inputError]}>
            <Lock color={Colors.textMuted} size={18} />
            <TextInput
              style={styles.input}
              value={currentPassword}
              onChangeText={(t) => { setCurrentPassword(t); setErrors(e => ({ ...e, current: undefined })); }}
              placeholder="Enter current password"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry={!showCurrent}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)}>
              {showCurrent ? <EyeOff color={Colors.textMuted} size={18} /> : <Eye color={Colors.textMuted} size={18} />}
            </TouchableOpacity>
          </View>
          {errors.current && <Text style={styles.errorText}>{errors.current}</Text>}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>New Password</Text>
          <View style={[styles.inputWrap, errors.new && styles.inputError]}>
            <Lock color={Colors.textMuted} size={18} />
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={(t) => { setNewPassword(t); setErrors(e => ({ ...e, new: undefined })); }}
              placeholder="Minimum 8 characters"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry={!showNew}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowNew(!showNew)}>
              {showNew ? <EyeOff color={Colors.textMuted} size={18} /> : <Eye color={Colors.textMuted} size={18} />}
            </TouchableOpacity>
          </View>
          {errors.new && <Text style={styles.errorText}>{errors.new}</Text>}
          {/* Strength bar */}
          {newPassword.length > 0 && (
            <View style={styles.strengthRow}>
              {[1, 2, 3, 4].map((i) => {
                const len = newPassword.length;
                const filled = i <= (len < 4 ? 1 : len < 7 ? 2 : len < 10 ? 3 : 4);
                const color = len < 4 ? Colors.error : len < 7 ? Colors.warning : len < 10 ? Colors.info : Colors.success;
                return <View key={i} style={[styles.strengthBar, { backgroundColor: filled ? color : Colors.surface }]} />;
              })}
              <Text style={styles.strengthLabel}>
                {newPassword.length < 4 ? 'Weak' : newPassword.length < 7 ? 'Fair' : newPassword.length < 10 ? 'Good' : 'Strong'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Confirm New Password</Text>
          <View style={[styles.inputWrap, errors.confirm && styles.inputError]}>
            <Lock color={Colors.textMuted} size={18} />
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={(t) => { setConfirmPassword(t); setErrors(e => ({ ...e, confirm: undefined })); }}
              placeholder="Repeat new password"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry={!showConfirm}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
              {showConfirm ? <EyeOff color={Colors.textMuted} size={18} /> : <Eye color={Colors.textMuted} size={18} />}
            </TouchableOpacity>
          </View>
          {errors.confirm && <Text style={styles.errorText}>{errors.confirm}</Text>}
        </View>

        <View style={styles.tipsBox}>
          <Text style={styles.tipsTitle}>Password Tips</Text>
          {['At least 8 characters', 'Mix of letters, numbers & symbols', 'Avoid common words or dates', 'Do not reuse old passwords'].map((tip, i) => (
            <Text key={i} style={styles.tipItem}>• {tip}</Text>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.saveBtnInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            {saving ? <ActivityIndicator color="#fff" size="small" /> : <ShieldCheck color="#fff" size={18} />}
            <Text style={styles.saveBtnText}>UPDATE PASSWORD</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 60 }} />
      </ScrollView>
    </LinearGradient>
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
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  iconWrap: { alignItems: 'center', paddingVertical: 28 },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconSubtext: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    maxWidth: 220,
    lineHeight: 20,
  },
  section: { marginBottom: 18 },
  sectionTitle: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginBottom: 8,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  inputError: { borderColor: Colors.error },
  input: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.text,
    paddingVertical: 13,
  },
  errorText: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.error,
    marginTop: 4,
  },
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  strengthBar: {
    flex: 1,
    height: 3,
    borderRadius: 2,
  },
  strengthLabel: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.textMuted,
    marginLeft: 4,
    minWidth: 40,
  },
  tipsBox: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
  },
  tipsTitle: {
    fontFamily: Fonts.heading,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: 1,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  tipItem: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 22,
  },
  saveBtn: { borderRadius: 14, overflow: 'hidden' },
  saveBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  saveBtnText: {
    fontFamily: Fonts.heading,
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 1.5,
  },
});
