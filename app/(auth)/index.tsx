import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts } from '@/constants/theme';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <LinearGradient colors={[Colors.background, Colors.backgroundSecondary]} style={styles.container}>
      <View style={styles.logoContainer}>
        <Image
          source={require('@/assets/images/new.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
        <Text style={styles.logoText}>SafetyFirst</Text>
        <Text style={styles.tagline}>Your Safety, Our Priority</Text>
      </View>

      <View style={styles.contentContainer}>
        <Text style={styles.welcomeTitle}>Emergency Response</Text>
        <Text style={styles.welcomeDescription}>
          Fast, reliable emergency assistance at your fingertips. Get help when you need it most.
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.citizenButton}
          onPress={() => router.push('/(auth)/signup')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[Colors.primary, Colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>I am a Citizen</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.responderButton}
          onPress={() => router.push('/(auth)/signup-responder')}
          activeOpacity={0.8}
        >
          <Text style={styles.responderButtonText}>I am a Responder</Text>
        </TouchableOpacity>

        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Already have an account?</Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.loginLink}> Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: height * 0.15,
  },
  logoImage: {
    width: 120,
    height: 120,
    borderRadius: 24,
    marginBottom: 20,
  },
  logoText: {
    fontFamily: Fonts.heading,
    fontSize: 36,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: 2,
  },
  tagline: {
    fontFamily: Fonts.body,
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 8,
    letterSpacing: 1,
  },
  contentContainer: {
    alignItems: 'center',
    marginTop: height * 0.08,
    paddingHorizontal: 20,
  },
  welcomeTitle: {
    fontFamily: Fonts.heading,
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  welcomeDescription: {
    fontFamily: Fonts.body,
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 50,
    left: 24,
    right: 24,
  },
  citizenButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  buttonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontFamily: Fonts.heading,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    letterSpacing: 1,
  },
  responderButton: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  responderButtonText: {
    fontFamily: Fonts.heading,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    letterSpacing: 1,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  loginText: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  loginLink: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
});
