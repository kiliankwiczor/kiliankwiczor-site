import { Tabs, Redirect } from 'expo-router';
import { useApi } from '../../src/client';
import { Loading, useTheme } from '../../src/ui';
import { View } from 'react-native';
export default function Layout() {
  const api = useApi(),
    t = useTheme();
  if (!api.ready) return <Loading />;
  if (!api.token) return <Redirect href="/" />;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: t.active,
        tabBarInactiveTintColor: t.muted,
        tabBarStyle: { backgroundColor: t.white, height: 76, paddingBottom: 12, paddingTop: 8 },
        tabBarLabelStyle: { fontSize: 11 },
      }}
    >
      {[
        ['home', 'Accueil'],
        ['training', 'Séances'],
        ['community', 'Communauté'],
        ['challenges', 'Défis'],
        ['profile', 'Profil'],
      ].map(([name, title]) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarIcon: ({ color }) => (
              <TabIcon name={name!} color={typeof color === 'string' ? color : t.muted} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}

function TabIcon({ name, color }: { name: string; color: string }) {
  return (
    <View
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}
    >
      {name === 'home' && (
        <View
          style={{
            width: 19,
            height: 19,
            borderRadius: 10,
            borderWidth: 2,
            borderColor: color,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: color }} />
        </View>
      )}
      {name === 'training' && (
        <>
          <View style={{ position: 'absolute', width: 22, height: 3, backgroundColor: color }} />
          <View
            style={{
              position: 'absolute',
              left: 2,
              width: 5,
              height: 18,
              borderRadius: 2,
              backgroundColor: color,
            }}
          />
          <View
            style={{
              position: 'absolute',
              right: 2,
              width: 5,
              height: 18,
              borderRadius: 2,
              backgroundColor: color,
            }}
          />
        </>
      )}
      {name === 'community' && (
        <>
          <View
            style={{
              position: 'absolute',
              left: 1,
              top: 2,
              width: 12,
              height: 12,
              borderRadius: 7,
              borderWidth: 2,
              borderColor: color,
            }}
          />
          <View
            style={{
              position: 'absolute',
              right: 1,
              bottom: 2,
              width: 12,
              height: 12,
              borderRadius: 7,
              borderWidth: 2,
              borderColor: color,
            }}
          />
        </>
      )}
      {name === 'challenges' && (
        <View
          style={{
            width: 16,
            height: 16,
            borderWidth: 2,
            borderColor: color,
            transform: [{ rotate: '45deg' }],
            borderRadius: 3,
          }}
        />
      )}
      {name === 'profile' && (
        <>
          <View
            style={{ width: 10, height: 10, borderRadius: 6, borderWidth: 2, borderColor: color }}
          />
          <View
            style={{
              marginTop: 3,
              width: 19,
              height: 9,
              borderTopLeftRadius: 9,
              borderTopRightRadius: 9,
              borderWidth: 2,
              borderColor: color,
            }}
          />
        </>
      )}
    </View>
  );
}
