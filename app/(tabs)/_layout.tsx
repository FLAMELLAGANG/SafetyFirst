import { Tabs } from 'expo-router';
import { Home, AlertCircle, BookOpen, Phone, User, Siren, History } from 'lucide-react-native';
import { Colors, Fonts } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';

export default function TabLayout() {
  const { isResponder } = useAuth();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.background,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 80,
          paddingBottom: 20,
          paddingTop: 12,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: Fonts.body,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarButton: isResponder ? () => null : undefined,
          tabBarIcon: ({ size, color }) => (
            <Home size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="emergencies"
        options={{
          title: isResponder ? 'Alerts' : 'My Reports',
          tabBarIcon: ({ size, color }) => (
            isResponder ? <Siren size={size} color={color} /> : <AlertCircle size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="first-aid"
        options={{
          title: 'First Aid',
          tabBarIcon: ({ size, color }) => (
            <BookOpen size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="contacts"
        options={{
          title: isResponder ? 'History' : 'Emergency',
          tabBarIcon: ({ size, color }) =>
            isResponder ? <History size={size} color={color} /> : <Phone size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ size, color }) => (
            <User size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
