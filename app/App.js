import React from "react";
import { View, Text, Pressable } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "./context/AuthContext";
import RootNavigator from "./navigation/RootNavigator";
import { colors as c } from "./theme";
class ErrorBoundary extends React.Component {
  state = { error: null };
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error)
      return (
        <View
          style={{
            flex: 1,
            padding: 35,
            justifyContent: "center",
            gap: 20,
            backgroundColor: c.bg,
          }}
        >
          <Text style={{ fontSize: 24, fontWeight: "700", color: c.text }}>
            Vamos tentar de novo?
          </Text>
          <Text style={{ color: c.muted }}>
            O aplicativo encontrou um erro inesperado. Sua equipe e seus dados
            continuam salvos no servidor.
          </Text>
          <Text selectable style={{ color: c.red }}>
            {this.state.error.message}
          </Text>
          <Pressable onPress={() => this.setState({ error: null })}>
            <Text style={{ color: c.red, fontWeight: "700" }}>
              Tentar novamente
            </Text>
          </Pressable>
        </View>
      );
    return this.props.children;
  }
}
export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView
        edges={["top", "left", "right"]}
        style={{ flex: 1, backgroundColor: c.bg }}
      >
        <StatusBar style="dark" />
        <ErrorBoundary>
          <AuthProvider>
            <RootNavigator />
          </AuthProvider>
        </ErrorBoundary>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
