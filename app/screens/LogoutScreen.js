import React, { useState } from "react";
import { Text } from "react-native";
import { useAuth } from "../context/AuthContext";
import {
  Page,
  Heading,
  Card,
  Button,
  ErrorBox,
  styles,
} from "../components/UI";

export default function LogoutScreen() {
  const { user, logout } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <Page>
      <Heading
        title="Sair da conta"
        subtitle="Encerre esta sessão para entrar com outra conta."
      />
      <Card style={{ maxWidth: 600, width: "100%" }}>
        <Text style={styles.h2}>{user.name}</Text>
        <Text style={styles.muted}>{user.email}</Text>
        <Text style={styles.text}>
          Seus projetos e tarefas continuarão salvos. Ao sair, você voltará à
          tela de login.
        </Text>
        <ErrorBox message={error} />
        <Button
          title="Sair e trocar de conta"
          icon="log-out-outline"
          loading={busy}
          onPress={async () => {
            setBusy(true);
            setError("");
            try {
              await logout();
            } catch (e) {
              setError(e.message);
              setBusy(false);
            }
          }}
        />
      </Card>
    </Page>
  );
}
