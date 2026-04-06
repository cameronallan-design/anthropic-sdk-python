import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Text } from 'react-native';

import StashScreen from './src/screens/StashScreen';
import StatsScreen from './src/screens/StatsScreen';
import { COLORS } from './src/theme';

const Tab = createBottomTabNavigator();

const NavTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background:     COLORS.bg,
    card:           COLORS.bgHeader,
    border:         COLORS.border,
    text:           COLORS.textPrimary,
    notification:   COLORS.accent,
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer theme={NavTheme}>
        <StatusBar style="light" backgroundColor={COLORS.bgHeader} />
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: COLORS.bgHeader,
              borderTopColor: COLORS.border,
              borderTopWidth: 1,
            },
            tabBarActiveTintColor:   COLORS.accent,
            tabBarInactiveTintColor: COLORS.textMuted,
            tabBarLabelStyle: {
              fontSize: 11,
              fontWeight: '600',
              letterSpacing: 0.3,
            },
          }}
        >
          <Tab.Screen
            name="Stash"
            component={StashScreen}
            options={{
              tabBarLabel: 'My Stash',
              tabBarIcon: ({ color, size }) => (
                <Text style={{ fontSize: size - 2, color }}>📦</Text>
              ),
            }}
          />
          <Tab.Screen
            name="Stats"
            component={StatsScreen}
            options={{
              tabBarLabel: 'Dashboard',
              tabBarIcon: ({ color, size }) => (
                <Text style={{ fontSize: size - 2, color }}>📊</Text>
              ),
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
