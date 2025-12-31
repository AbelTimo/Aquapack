import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { View, ActivityIndicator } from 'react-native';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import ProjectsScreen from './src/screens/ProjectsScreen';
import SitesScreen from './src/screens/SitesScreen';
import SiteDetailScreen from './src/screens/SiteDetailScreen';
import CreateSiteScreen from './src/screens/CreateSiteScreen';
import BoreholeFormScreen from './src/screens/BoreholeFormScreen';
import WaterLevelFormScreen from './src/screens/WaterLevelFormScreen';
import PumpTestScreen from './src/screens/PumpTestScreen';
import WaterQualityFormScreen from './src/screens/WaterQualityFormScreen';
import SyncScreen from './src/screens/SyncScreen';

// Store
import { useAuthStore } from './src/store/authStore';
import { initDatabase } from './src/services/database';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          if (route.name === 'Projects') {
            iconName = focused ? 'folder' : 'folder-outline';
          } else if (route.name === 'Sites') {
            iconName = focused ? 'location' : 'location-outline';
          } else if (route.name === 'Sync') {
            iconName = focused ? 'cloud' : 'cloud-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#0891b2',
        tabBarInactiveTintColor: 'gray',
        headerStyle: {
          backgroundColor: '#0891b2',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen name="Projects" component={ProjectsScreen} />
      <Tab.Screen name="Sites" component={SitesScreen} />
      <Tab.Screen name="Sync" component={SyncScreen} />
    </Tab.Navigator>
  );
}

function AuthenticatedStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#0891b2',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="Main"
        component={TabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="SiteDetail" component={SiteDetailScreen} options={{ title: 'Site Details' }} />
      <Stack.Screen name="CreateSite" component={CreateSiteScreen} options={{ title: 'New Site' }} />
      <Stack.Screen name="BoreholeForm" component={BoreholeFormScreen} options={{ title: 'Borehole' }} />
      <Stack.Screen name="WaterLevelForm" component={WaterLevelFormScreen} options={{ title: 'Water Level' }} />
      <Stack.Screen name="PumpTest" component={PumpTestScreen} options={{ title: 'Pump Test' }} />
      <Stack.Screen name="WaterQualityForm" component={WaterQualityFormScreen} options={{ title: 'Water Quality' }} />
    </Stack.Navigator>
  );
}

export default function App() {
  const { isAuthenticated, isLoading, loadAuth } = useAuthStore();
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      await initDatabase();
      setDbReady(true);
      await loadAuth();
    };
    init();
  }, []);

  if (isLoading || !dbReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0891b2' }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        {isAuthenticated ? <AuthenticatedStack /> : (
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={LoginScreen} />
          </Stack.Navigator>
        )}
      </NavigationContainer>
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}
