import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Colors, Fonts, MedicalEmergencyTypes, MedicalEmergencyType } from '@/constants/theme';
import type { Emergency } from '@/types/database';
import { ArrowLeft, MapPin, Camera, Send, X, Image as ImageIcon } from 'lucide-react-native';

export default function EmergencyReportScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ medicalType: MedicalEmergencyType; label: string }>();
  const { profile } = useAuth();
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState<{ latitude: number; longitude: number; address: string } | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [photo, setPhoto] = useState<{ uri: string; base64?: string } | null>(null);

  const uploadPhoto = async (): Promise<string | null> => {
    if (!photo) return null;

    const fileExt = 'jpg';
    const fileName = `${profile.id}/${Date.now()}.${fileExt}`;
    const filePath = `incident-photos/${fileName}`;

    let uploadData: ArrayBuffer | Blob;
    if (Platform.OS === 'web') {
      const resp = await fetch(photo.uri);
      uploadData = await resp.blob();
    } else if (photo.base64) {
      uploadData = Uint8Array.from(atob(photo.base64), (c) => c.charCodeAt(0)).buffer;
    } else {
      // Fallback: fetch the file URI and convert
      const resp = await fetch(photo.uri);
      uploadData = await resp.blob();
    }

    const { error: uploadError } = await supabase.storage
      .from('incident-photos')
      .upload(filePath, uploadData, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from('incident-photos')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  };

  const medicalType = params.medicalType || 'cardiac_arrest';
  const typeInfo = MedicalEmergencyTypes[medicalType as MedicalEmergencyType] || MedicalEmergencyTypes.other;

  useEffect(() => {
    (async () => {
      try {
        if (Platform.OS === 'web') {
          if (!navigator.geolocation) {
            setLoadingLocation(false);
            return;
          }
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const { latitude, longitude } = pos.coords;
              setLocation({ latitude, longitude, address: 'Current location' });
              setLoadingLocation(false);
            },
            () => { setLoadingLocation(false); },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
          );
        } else {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') {
            setLoadingLocation(false);
            return;
          }
          const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
          const [geo] = await Location.reverseGeocodeAsync({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            address: geo
              ? [geo.street, geo.city, geo.region].filter(Boolean).join(', ')
              : 'Location found',
          });
        }
      } catch {
        // Silent — location not critical
      } finally {
        setLoadingLocation(false);
      }
    })();
  }, []);

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please allow access to your photo library in Settings to add a photo.',
        [{ text: 'OK' }]
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      setPhoto({ uri: result.assets[0].uri, base64: result.assets[0].base64 });
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please allow camera access in Settings to take a photo.',
        [{ text: 'OK' }]
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      setPhoto({ uri: result.assets[0].uri, base64: result.assets[0].base64 });
    }
  };

  const handleAddPhoto = async () => {
    if (Platform.OS === 'web') {
      // Alert.alert with buttons doesn't work on web — go straight to library picker
      await handlePickPhoto();
      return;
    }
    Alert.alert('Add Photo', 'Choose how to add a photo', [
      { text: 'Take Photo', onPress: handleTakePhoto },
      { text: 'Choose from Library', onPress: handlePickPhoto },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSubmit = async () => {
    if (!profile?.id) {
      Alert.alert('Error', 'You must be logged in to report an emergency');
      return;
    }
    setSubmitting(true);
    try {
      const photoUrl = await uploadPhoto();

      const { data, error } = await supabase
        .from('emergencies')
        .insert({
          citizen_id: profile.id,
          emergency_type: 'medical',
          description: `${typeInfo.label}${description ? ': ' + description : ''}`,
          latitude: location?.latitude || null,
          longitude: location?.longitude || null,
          address: location?.address || null,
          status: 'pending',
          photo_url: photoUrl,
        } as never)
        .select()
        .single();

      if (error) throw error;

      router.replace(`/emergency/${(data as Emergency).id}`);
    } catch (err) {
      console.error('Error submitting emergency:', err);
      Alert.alert('Error', 'Failed to submit emergency report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <LinearGradient colors={['#000000', '#0D0000', '#000000']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft color={Colors.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Emergency Report</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Type banner */}
        <LinearGradient
          colors={[typeInfo.gradientStart, typeInfo.gradientEnd]}
          style={styles.typeBanner}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text style={styles.typeEmoji}>{typeInfo.emoji}</Text>
          <View style={styles.typeInfo}>
            <Text style={styles.typeLabel}>{typeInfo.label}</Text>
            <Text style={styles.typeSubtext}>Emergency type selected</Text>
          </View>
        </LinearGradient>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Location</Text>
          <View style={styles.locationCard}>
            <MapPin color={Colors.primary} size={22} />
            <View style={styles.locationInfo}>
              {loadingLocation ? (
                <ActivityIndicator color={Colors.primary} size="small" />
              ) : location ? (
                <>
                  <Text style={styles.locationText}>{location.address}</Text>
                  <Text style={styles.coordsText}>
                    {location.latitude.toFixed(4)}°, {location.longitude.toFixed(4)}°
                  </Text>
                </>
              ) : (
                <Text style={styles.locationText}>Location unavailable — responders will contact you</Text>
              )}
            </View>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Details</Text>
          <TextInput
            style={styles.descriptionInput}
            placeholder="Describe what happened (optional)"
            placeholderTextColor={Colors.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Photo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photo Evidence</Text>
          {photo ? (
            <View style={styles.photoPreviewWrap}>
              <Image source={{ uri: photo.uri }} style={styles.photoPreview} resizeMode="cover" />
              <TouchableOpacity style={styles.removePhotoBtn} onPress={() => setPhoto(null)}>
                <X color="#fff" size={16} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.changePhotoBtn} onPress={handleAddPhoto}>
                <Camera color="#fff" size={16} />
                <Text style={styles.changePhotoText}>Change Photo</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.photoButton} onPress={handleAddPhoto} activeOpacity={0.7}>
              <LinearGradient
                colors={[Colors.surface, Colors.surfaceLight]}
                style={styles.photoButtonInner}
              >
                <Camera color={Colors.textSecondary} size={28} />
                <Text style={styles.photoButtonTitle}>Add Photo (optional)</Text>
                <Text style={styles.photoButtonSub}>Take photo or choose from library</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.warningCard}>
          <Text style={styles.warningText}>
            By submitting this report, emergency responders will be notified immediately. Stay calm and await assistance.
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.85}
        >
          <LinearGradient colors={[Colors.primary, '#A01028']} style={styles.submitGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            {submitting ? (
              <ActivityIndicator color={Colors.text} size="small" />
            ) : (
              <>
                <Send color={Colors.text} size={20} />
                <Text style={styles.submitText}>SEND EMERGENCY ALERT</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 16,
    gap: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: Fonts.heading,
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: 1,
  },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  typeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    gap: 14,
  },
  typeEmoji: { fontSize: 34 },
  typeInfo: { flex: 1 },
  typeLabel: {
    fontFamily: Fonts.heading,
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  typeSubtext: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontFamily: Fonts.heading,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  locationInfo: { flex: 1 },
  locationText: { fontFamily: Fonts.body, fontSize: 14, color: Colors.text },
  coordsText: { fontFamily: Fonts.body, fontSize: 11, color: Colors.textMuted, marginTop: 3 },
  descriptionInput: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 110,
    fontSize: 15,
    fontFamily: Fonts.body,
    color: Colors.text,
  },
  photoButton: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  photoButtonInner: {
    alignItems: 'center',
    paddingVertical: 28,
    gap: 8,
  },
  photoButtonTitle: {
    fontFamily: Fonts.heading,
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  photoButtonSub: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textMuted,
  },
  photoPreviewWrap: {
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 14,
  },
  removePhotoBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  changePhotoBtn: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  changePhotoText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  warningCard: {
    backgroundColor: Colors.warning + '12',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.warning + '30',
  },
  warningText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.warning,
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    backgroundColor: 'rgba(0,0,0,0.95)',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  submitButton: { borderRadius: 16, overflow: 'hidden' },
  submitButtonDisabled: { opacity: 0.6 },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 17,
    gap: 10,
  },
  submitText: {
    fontFamily: Fonts.heading,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: 1.5,
  },
});
