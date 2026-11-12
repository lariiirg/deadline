import React from "react";
import { View, Text, Pressable, useWindowDimensions } from "react-native";
import {
  NavigationContainer,
  createNavigationContainerRef,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { Icon, styles, Loading } from "../components/UI";
import AuthScreen from "../screens/AuthScreen";
import DashboardScreen from "../screens/DashboardScreen";
import ProjectsScreen, { JoinDialog } from "../screens/ProjectsScreen";
import CalendarScreen from "../screens/CalendarScreen";
import TasksScreen from "../screens/TasksScreen";
import ProfileScreen from "../screens/ProfileScreen";
import LogoutScreen from "../screens/LogoutScreen";
import ProjectForm from "../screens/ProjectForm";
import ProjectDetailScreen from "../screens/ProjectDetailScreen";
import { colors as c } from "../theme";
const Stack = createNativeStackNavigator(),
  Tab = createBottomTabNavigator();
const ref = createNavigationContainerRef();
const icons = {
  Início: "grid-outline",
  Projetos: "folder-open-outline",
  Tarefas: "checkbox-outline",
  Calendário: "calendar-outline",
  Perfil: "person-outline",
  Sair: "log-out-outline",
};
function TabBar({ state, navigation }) {
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const desktop = width >= 1000;
  return (
    <View
      style={
        desktop
          ? {
              width: 235,
              backgroundColor: c.white,
              borderRightWidth: 1,
              borderColor: c.border,
              padding: 22,
              paddingTop: 34,
              gap: 30,
            }
          : {
              flexDirection: "row",
              backgroundColor: c.white,
              borderTopWidth: 1,
              borderColor: c.border,
              paddingBottom: Math.max(insets.bottom, 10),
              paddingTop: 12,
            }
      }
    >
      {desktop ? (
        <View style={[styles.row, { gap: 8 }]}>
          <Icon name="hourglass" color={c.red} size={29} />
          <Text
            style={{
              fontSize: 26,
              fontWeight: "800",
              letterSpacing: -1,
              color: c.text,
            }}
          >
            Deadline<Text style={{ color: c.red }}>.</Text>
          </Text>
        </View>
      ) : null}
      <View
        style={
          desktop ? { gap: 9, flex: 1 } : { flexDirection: "row", flex: 1 }
        }
      >
        {desktop ? (
          <Text
            style={{
              color: "#94A3B8",
              fontSize: 10,
              fontWeight: "700",
              letterSpacing: 2,
              marginBottom: 9,
            }}
          >
            MEU ESPAÇO
          </Text>
        ) : null}
        {state.routes.map((r, i) => {
          const active = state.index === i;
          return (
            <Pressable
              accessibilityRole="tab"
              accessibilityLabel={r.name}
              accessibilityState={{ selected: active }}
              key={r.key}
              onPress={() => navigation.navigate(r.name)}
              style={
                desktop
                  ? {
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                      padding: 14,
                      borderRadius: 10,
                      backgroundColor: active ? c.pink : c.white,
                    }
                  : { flex: 1, alignItems: "center", gap: 5 }
              }
            >
              <Icon
                name={icons[r.name]}
                size={21}
                color={active ? c.red : c.muted}
              />
              <Text
                style={{
                  fontSize: desktop ? 13 : 10,
                  fontWeight: active ? "700" : "500",
                  color: active ? c.darkRed : c.muted,
                }}
              >
                {r.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {desktop ? (
        <>
          <View
            style={{
              backgroundColor: c.bg,
              padding: 16,
              borderRadius: 14,
              gap: 8,
            }}
          >
            <Icon name="sparkles-outline" color={c.red} />
            <Text style={styles.label}>Vai dar tempo.</Text>
            <Text style={styles.small}>Um bom plano faz toda a diferença.</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Meu perfil"
            onPress={() => navigation.navigate("Perfil")}
            style={[
              styles.row,
              { borderTopWidth: 1, borderColor: c.border, paddingTop: 20 },
            ]}
          >
            <View
              style={{
                height: 34,
                width: 34,
                borderRadius: 11,
                backgroundColor: c.pink,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: c.red, fontWeight: "700" }}>
                {user.name[0]}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text numberOfLines={1} style={styles.label}>
                {user.name}
              </Text>
              <Text style={styles.small}>{user.account_type}</Text>
            </View>
          </Pressable>
        </>
      ) : null}
    </View>
  );
}
function Tabs() {
  const { width } = useWindowDimensions();
  return (
    <Tab.Navigator
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarPosition: width >= 1000 ? "left" : "bottom",
        animation: "none",
        sceneStyle: { backgroundColor: c.bg },
      }}
    >
      <Tab.Screen name="Início" component={DashboardScreen} />
      <Tab.Screen name="Projetos" component={ProjectsScreen} />
      <Tab.Screen name="Tarefas" component={TasksScreen} />
      <Tab.Screen name="Calendário" component={CalendarScreen} />
      <Tab.Screen name="Perfil" component={ProfileScreen} />
      <Tab.Screen name="Sair" component={LogoutScreen} />
    </Tab.Navigator>
  );
}
export default function RootNavigator() {
  const { loading, user, invite, clearInvite } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <AuthScreen />;
  return (
    <>
      <NavigationContainer ref={ref}>
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: c.white },
            headerTintColor: c.text,
            headerShadowVisible: false,
            contentStyle: { backgroundColor: c.bg },
          }}
        >
          <Stack.Screen
            name="Principal"
            component={Tabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Formulario"
            component={ProjectForm}
            options={{ title: "Projeto" }}
          />
          <Stack.Screen
            name="Detalhes"
            component={ProjectDetailScreen}
            options={{ title: "Detalhes do projeto" }}
          />
        </Stack.Navigator>
      </NavigationContainer>
      {invite ? (
        <JoinDialog
          key={invite}
          visible
          initialCode={invite}
          onClose={() => clearInvite()}
          onJoined={(p) => {
            if (ref.isReady()) ref.navigate("Detalhes", { id: p.id });
          }}
        />
      ) : null}
    </>
  );
}
