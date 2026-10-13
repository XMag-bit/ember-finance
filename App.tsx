import React, { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts } from "./src/theme";
import { HomeScreen } from "./src/screens/HomeScreen";
import { TransactionsScreen } from "./src/screens/TransactionsScreen";
import { AddTransactionScreen } from "./src/screens/AddTransactionScreen";
import { BudgetsScreen } from "./src/screens/BudgetsScreen";
import { NewBudgetScreen } from "./src/screens/NewBudgetScreen";
import { NewGoalScreen } from "./src/screens/NewGoalScreen";
import { GoalsScreen } from "./src/screens/GoalsScreen";
import { InsightScreen } from "./src/screens/InsightScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import { AlertsScreen } from "./src/screens/AlertsScreen";
import { UserProvider, useProfile } from "./src/store/UserContext";
import { TxProvider, useTxs } from "./src/store/TxContext";
import { GoalsProvider, useGoals } from "./src/store/GoalsContext";
import { BudgetsProvider, useBudgets } from "./src/store/BudgetsContext";
import { SubsProvider, useSubs } from "./src/store/SubsContext";
import { navigationRef, navigate } from "./src/navigation";
import { hasPermission, rescheduleAll } from "./src/data/notifications";
import * as Notifications from "expo-notifications";
import { OnboardingScreen } from "./src/screens/OnboardingScreen";
import { SubscriptionsScreen } from "./src/screens/SubscriptionsScreen";
import { NewSubscriptionScreen } from "./src/screens/NewSubscriptionScreen";
import { ScanScreen } from "./src/screens/ScanScreen";
import { PayConfirmScreen } from "./src/screens/PayConfirmScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

type IonName = React.ComponentProps<typeof Ionicons>["name"];

const ICONS: Record<string, IonName> = {
  Home: "home-outline",
  Transactions: "receipt-outline",
  Budgets: "pie-chart-outline",
  Goals: "trophy-outline",
};

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          bottom: 16,
          left: 16,
          right: 16,
          borderRadius: 24,
          height: 68,
          backgroundColor: "#1E1A16",
          borderTopWidth: 0,
          paddingBottom: 10,
          paddingTop: 10,
          elevation: 8,
        },
        tabBarActiveTintColor: "#fff",
        tabBarInactiveTintColor: "#8A8178",
        tabBarIcon: ({ focused, color }) => (
          <View
            style={{
              width: 48,
              height: 32,
              borderRadius: 16,
              backgroundColor: focused ? "#C86E4B" : "transparent",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name={ICONS[route.name] ?? "ellipse-outline"} size={21} color={focused ? "#fff" : color} />
          </View>
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Transactions" component={TransactionsScreen} />
      <Tab.Screen
        name="Add"
        component={AddTransactionScreen}
        options={({ navigation }) => ({
          tabBarButton: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate("AddModal", { id: undefined })}
              style={{ top: -18, alignItems: "center", justifyContent: "center", flex: 1 }}
              accessibilityLabel="Add transaction"
            >
              <View
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  backgroundColor: colors.accent,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 4,
                  borderColor: "#FAF7F2",
                }}
              >
                <Ionicons name="add-outline" size={30} color="#fff" />
              </View>
              <Text style={{ color: "#8A8178", fontSize: 11, fontWeight: "600", fontFamily: fonts.bodyMedium, marginTop: 2 }}>Add</Text>
            </TouchableOpacity>
          ),
        })}
      />
      <Tab.Screen name="Budgets" component={BudgetsScreen} />
      <Tab.Screen name="Goals" component={GoalsScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <UserProvider>
      <TxProvider>
      <GoalsProvider>
      <BudgetsProvider>
      <SubsProvider>
      <Root />
      </SubsProvider>
      </BudgetsProvider>
      </GoalsProvider>
      </TxProvider>
      </UserProvider>
    </SafeAreaProvider>
  );
}

function Root() {
  const { onboarded, ready: userReady } = useProfile();
  const { ready: txReady } = useTxs();
  const { ready: goalsReady } = useGoals();
  const { ready: budgetsReady } = useBudgets();
  const { ready: subsReady } = useSubs();
  const [fontsLoaded] = useFonts({
    Inter_400Regular: require("./assets/fonts/Inter_400Regular.ttf"),
    Inter_600SemiBold: require("./assets/fonts/Inter_600SemiBold.ttf"),
    Inter_700Bold: require("./assets/fonts/Inter_700Bold.ttf"),
    Inter_800ExtraBold: require("./assets/fonts/Inter_800ExtraBold.ttf"),
    Fraunces_700Bold: require("./assets/fonts/Fraunces_700Bold.ttf"),
    Fraunces_800ExtraBold: require("./assets/fonts/Fraunces_800ExtraBold.ttf"),
    Inter_400Regular_Italic: require("./assets/fonts/Inter_400Regular_Italic.ttf"),
  });
  if (!fontsLoaded || !userReady || !txReady || !goalsReady || !budgetsReady || !subsReady) {
    return (
      <View style={{ flex: 1, backgroundColor: "#FAF7F2", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#C86E4B" />
      </View>
    );
  }
  if (!onboarded) return <OnboardingScreen />;
  return (
      <NavigationContainer ref={navigationRef}>
        <StatusBar style="dark" />
        <NotificationGate />
        <Stack.Navigator screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
          <Stack.Screen name="Main" component={Tabs} />
          <Stack.Screen name="AddModal" component={AddTransactionScreen} options={{ presentation: "modal", animation: "slide_from_bottom" }} />
          <Stack.Screen name="Insight" component={InsightScreen} />
          <Stack.Screen name="NewBudget" component={NewBudgetScreen} />
          <Stack.Screen name="NewGoal" component={NewGoalScreen} />
          <Stack.Screen name="Subscriptions" component={SubscriptionsScreen} />
          <Stack.Screen name="NewSubscription" component={NewSubscriptionScreen} />
          <Stack.Screen name="Scan" component={ScanScreen} />
          <Stack.Screen name="PayConfirm" component={PayConfirmScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="Alerts" component={AlertsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
  );
}

/** Registers the notification tap handler and rebuilds reminder schedules on start. */
function NotificationGate() {
  const { profile } = useProfile();
  const { subs, setSubNotifIds } = useSubs();
  const started = useRef(false);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      if (response.notification.request.content.data?.screen === "Subscriptions") {
        navigate("Subscriptions");
      }
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    (async () => {
      if (!profile.remindersEnabled) return;
      if (!(await hasPermission())) return;
      const map = await rescheduleAll(subs, { time: profile.reminderTime, currency: profile.currency, overdueNow: false });
      for (const [id, ids] of Object.entries(map)) setSubNotifIds(id, ids);
    })();
  }, []);

  return null;
}
