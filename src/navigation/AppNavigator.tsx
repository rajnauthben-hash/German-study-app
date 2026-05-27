import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator, DrawerContentScrollView, DrawerContentComponentProps } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList, TabParamList, DrawerParamList } from '../types';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';

// Existing screens
import HomeScreen from '../screens/HomeScreen';
import ScanScreen from '../screens/ScanScreen';
import SavedSetsScreen from '../screens/SavedSetsScreen';
import ProgressScreen from '../screens/ProgressScreen';
import StudySetScreen from '../screens/StudySetScreen';
import PracticeScreen from '../screens/PracticeScreen';
import FlashcardsScreen from '../screens/FlashcardsScreen';
import QuizScreen from '../screens/QuizScreen';
import FillBlankScreen from '../screens/FillBlankScreen';
import SentenceBuilderScreen from '../screens/SentenceBuilderScreen';
import HomeworkHelperScreen from '../screens/HomeworkHelperScreen';
import MistakeReviewScreen from '../screens/MistakeReviewScreen';

// New screens
import StudyHistoryScreen from '../screens/StudyHistoryScreen';
import VocabularyBankScreen from '../screens/VocabularyBankScreen';
import VerbTrainerScreen from '../screens/VerbTrainerScreen';
import GrammarHubScreen from '../screens/GrammarHubScreen';
import SettingsScreen from '../screens/SettingsScreen';
import SessionSummaryScreen from '../screens/SessionSummaryScreen';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();
const Drawer = createDrawerNavigator<DrawerParamList>();

// ─── Custom Drawer Content ────────────────────────────────────────────────────

function CustomDrawerContent(props: DrawerContentComponentProps) {
  const { navigation } = props;

  const sections = [
    {
      title: 'Study',
      items: [
        { label: 'Dashboard', icon: 'home-outline' as const, screen: 'MainTabs' as const },
        { label: 'Study History', icon: 'time-outline' as const, screen: 'StudyHistory' as const },
      ],
    },
    {
      title: 'Learn',
      items: [
        { label: 'Vocabulary Bank', icon: 'book-outline' as const, screen: 'VocabularyBank' as const },
        { label: 'Verb Trainer', icon: 'flash-outline' as const, screen: 'VerbTrainer' as const },
        { label: 'Grammar Hub', icon: 'school-outline' as const, screen: 'GrammarHub' as const },
      ],
    },
    {
      title: 'Account',
      items: [
        { label: 'Settings', icon: 'settings-outline' as const, screen: 'Settings' as const },
      ],
    },
  ];

  return (
    <DrawerContentScrollView {...props} style={styles.drawerContainer}>
      {/* Header */}
      <View style={styles.drawerHeader}>
        <Text style={styles.drawerAppName}>DeutschSnap</Text>
        <Text style={styles.drawerTagline}>German Study Companion</Text>
      </View>

      {sections.map((section) => (
        <View key={section.title} style={styles.drawerSection}>
          <Text style={styles.drawerSectionTitle}>{section.title.toUpperCase()}</Text>
          {section.items.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.drawerItem}
              onPress={() => {
                navigation.navigate(item.screen as keyof DrawerParamList);
                navigation.closeDrawer();
              }}
              activeOpacity={0.7}
            >
              <Ionicons name={item.icon} size={20} color={Colors.primary} style={styles.drawerItemIcon} />
              <Text style={styles.drawerItemLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}

      <View style={styles.drawerFooter}>
        <Text style={styles.drawerVersion}>Version 2.0</Text>
      </View>
    </DrawerContentScrollView>
  );
}

// ─── Bottom Tabs ──────────────────────────────────────────────────────────────

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textLight,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused, color }) => {
          const icons: Record<string, { focused: string; unfocused: string }> = {
            HomeTab: { focused: 'home', unfocused: 'home-outline' },
            ScanTab: { focused: 'camera', unfocused: 'camera-outline' },
            SavedTab: { focused: 'library', unfocused: 'library-outline' },
            ProgressTab: { focused: 'stats-chart', unfocused: 'stats-chart-outline' },
          };
          const iconSet = icons[route.name];
          const iconName = focused ? iconSet?.focused : iconSet?.unfocused;
          return <Ionicons name={(iconName || 'home-outline') as React.ComponentProps<typeof Ionicons>['name']} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="ScanTab" component={ScanScreen} options={{ tabBarLabel: 'Scan' }} />
      <Tab.Screen name="SavedTab" component={SavedSetsScreen} options={{ tabBarLabel: 'Saved' }} />
      <Tab.Screen name="ProgressTab" component={ProgressScreen} options={{ tabBarLabel: 'Progress' }} />
    </Tab.Navigator>
  );
}

// ─── Drawer Navigator ─────────────────────────────────────────────────────────

function DrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'slide',
        drawerStyle: { width: '75%', backgroundColor: Colors.card },
        overlayColor: 'rgba(0,0,0,0.5)',
        swipeEdgeWidth: 60,
      }}
    >
      <Drawer.Screen name="MainTabs" component={MainTabs} />
      <Drawer.Screen name="StudyHistory" component={StudyHistoryScreen} />
      <Drawer.Screen name="VocabularyBank" component={VocabularyBankScreen} />
      <Drawer.Screen name="VerbTrainer" component={VerbTrainerScreen} />
      <Drawer.Screen name="GrammarHub" component={GrammarHubScreen} />
      <Drawer.Screen name="Settings" component={SettingsScreen} />
    </Drawer.Navigator>
  );
}

// ─── Root Stack ───────────────────────────────────────────────────────────────

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: Colors.background },
          gestureEnabled: true,
        }}
      >
        <Stack.Screen name="Main" component={DrawerNavigator} />
        <Stack.Screen name="StudySet" component={StudySetScreen} />
        <Stack.Screen name="Practice" component={PracticeScreen} />
        <Stack.Screen name="Flashcards" component={FlashcardsScreen} />
        <Stack.Screen name="Quiz" component={QuizScreen} />
        <Stack.Screen name="FillBlank" component={FillBlankScreen} />
        <Stack.Screen name="SentenceBuilder" component={SentenceBuilderScreen} />
        <Stack.Screen name="HomeworkHelper" component={HomeworkHelperScreen} />
        <Stack.Screen name="MistakeReview" component={MistakeReviewScreen} />
        <Stack.Screen name="SessionSummary" component={SessionSummaryScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  drawerContainer: { flex: 1, backgroundColor: Colors.card },
  drawerHeader: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: Spacing.md,
  },
  drawerAppName: {
    fontSize: Typography.fontSizeXL,
    fontWeight: Typography.fontWeightExtraBold,
    color: Colors.text,
    marginBottom: 4,
  },
  drawerTagline: { fontSize: Typography.fontSizeSM, color: Colors.textSecondary },
  drawerSection: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg },
  drawerSectionTitle: {
    fontSize: Typography.fontSizeXS,
    fontWeight: Typography.fontWeightBold,
    color: Colors.textLight,
    letterSpacing: 1,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: 2,
  },
  drawerItemIcon: { marginRight: Spacing.md },
  drawerItemLabel: {
    fontSize: Typography.fontSizeMD,
    color: Colors.text,
    fontWeight: Typography.fontWeightMedium,
  },
  drawerFooter: {
    padding: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: Spacing.lg,
  },
  drawerVersion: { fontSize: Typography.fontSizeXS, color: Colors.textLight, textAlign: 'center' },
  tabBar: {
    backgroundColor: Colors.card,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    paddingTop: 4,
    paddingBottom: 8,
    height: 64,
  },
  tabLabel: {
    fontSize: Typography.fontSizeXS,
    fontWeight: Typography.fontWeightMedium,
    marginTop: 2,
  },
});
