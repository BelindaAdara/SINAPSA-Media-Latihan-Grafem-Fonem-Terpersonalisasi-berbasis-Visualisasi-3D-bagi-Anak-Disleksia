import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useChild } from '../context/ChildContext';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { LetterListScreen } from '../screens/LetterListScreen';
import { LetterDetailScreen } from '../screens/LetterDetailScreen';
import { ExerciseListScreen } from '../screens/ExerciseListScreen';
import { ExerciseDetailScreen } from '../screens/ExerciseDetailScreen';
import { ExerciseSessionScreen } from '../screens/ExerciseSessionScreen';
import { SessionSummaryScreen } from '../screens/SessionSummaryScreen';
import { ProgressScreen } from '../screens/ProgressScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { SessionDetailScreen } from '../screens/SessionDetailScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

const RootStack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();
const LetterStack = createNativeStackNavigator();
const ExerciseStack = createNativeStackNavigator();

function LettersNavigator() {
  return (
    <LetterStack.Navigator screenOptions={{ headerShown: false }}>
      <LetterStack.Screen name="LetterList" component={LetterListScreen} />
      <LetterStack.Screen name="LetterDetail" component={LetterDetailScreen} />
    </LetterStack.Navigator>
  );
}

function ExerciseNavigator() {
  return (
    <ExerciseStack.Navigator screenOptions={{ headerShown: false }}>
      <ExerciseStack.Screen name="ExerciseList" component={ExerciseListScreen} />
      <ExerciseStack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} />
    </ExerciseStack.Navigator>
  );
}

function MainTabs() {
  const { colors } = useTheme();
  const tabConfig = {
    Beranda: { component: HomeScreen, icon: '🏠' },
    Huruf: { component: LettersNavigator, icon: '🔤' },
    Latihan: { component: ExerciseNavigator, icon: '🎯' },
    Progres: { component: ProgressScreen, icon: '📈' },
    Profil: { component: ProfileScreen, icon: '🌟' },
  };
  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 66,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '700' },
        tabBarIcon: ({ focused }) => (
          <Text style={{ fontSize: 21, opacity: focused ? 1 : 0.6 }}>
            {tabConfig[route.name].icon}
          </Text>
        ),
      })}
    >
      {Object.entries(tabConfig).map(([name, config]) => (
        <Tabs.Screen key={name} name={name} component={config.component} />
      ))}
    </Tabs.Navigator>
  );
}

export function RootNavigator() {
  const { colors } = useTheme();
  const { status } = useChild();
  const navigationTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: colors.accent,
      background: colors.bg,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
    },
  };
  return (
    <NavigationContainer theme={navigationTheme}>
      <RootStack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        {status === 'onboarding' ? (
          <RootStack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : (
          <RootStack.Screen name="MainTabs" component={MainTabs} />
        )}
        <RootStack.Screen name="History" component={HistoryScreen} />
        <RootStack.Screen name="SessionDetail" component={SessionDetailScreen} />
        <RootStack.Screen name="ExerciseSession" component={ExerciseSessionScreen} />
        <RootStack.Screen name="SessionSummary" component={SessionSummaryScreen} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
