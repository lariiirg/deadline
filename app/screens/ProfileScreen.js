import React, { useCallback, useState } from "react";
import { Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import {
  Page,
  Heading,
  Card,
  Field,
  Button,
  ErrorBox,
  Loading,
  styles,
} from "../components/UI";
import { colors as c } from "../theme";
import ProjectCard from "../components/ProjectCard";
export default function ProfileScreen({ navigation }) {
  const { api, user, setUser, logout } = useAuth();
  const [p, setP] = useState(null),
    [projects, setProjects] = useState([]),
    [name, setName] = useState(user.name),
    [email, setEmail] = useState(user.email),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  async function load() {
    try {
      const [data, projectList] = await Promise.all([
        api("/profile"),
        api("/projects"),
      ]);
      setP(data);
      setProjects(projectList);
      setName(data.name);
      setEmail(data.email);
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }
  useFocusEffect(
    useCallback(() => {
      load();
    }, []),
  );
  return (
    <Page>
      <Heading
        eyebrow="DO SEU JEITO"
        title="Meu perfil"
        subtitle="Cuide das suas informações e acompanhe sua participação."
      />
      <ErrorBox message={error} />
      {!p ? (
        <>
          <Loading />
          {error ? <Button title="Tentar novamente" onPress={load} /> : null}
        </>
      ) : (
        <>
          <Card style={{ maxWidth: 720, width: "100%" }}>
            <View style={styles.row}>
              <View
                style={{
                  height: 64,
                  width: 64,
                  borderRadius: 20,
                  backgroundColor: c.pink,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 28, fontWeight: "800", color: c.red }}>
                  {p.name[0].toUpperCase()}
                </Text>
              </View>
              <View style={{ gap: 4 }}>
                <Text style={styles.h2}>{p.name}</Text>
                <Text style={styles.muted}>{p.email}</Text>
                <Text style={{ color: c.red, fontSize: 12, fontWeight: "600" }}>
                  Conta {p.account_type}
                </Text>
              </View>
            </View>
            <View style={styles.row}>
              <View
                style={{
                  flex: 1,
                  padding: 15,
                  backgroundColor: c.bg,
                  borderRadius: 10,
                }}
              >
                <Text style={styles.title}>{p.created}</Text>
                <Text style={styles.small}>Projetos criados</Text>
              </View>
              <View
                style={{
                  flex: 1,
                  padding: 15,
                  backgroundColor: c.bg,
                  borderRadius: 10,
                }}
              >
                <Text style={styles.title}>{p.participating}</Text>
                <Text style={styles.small}>Projetos em que participa</Text>
              </View>
            </View>
          </Card>
          <View style={{ gap: 16 }}>
            <Text style={styles.h2}>Meus projetos</Text>
            {projects.length ? (
              <View style={[styles.row, { alignItems: "stretch" }]}>
                {projects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onPress={() =>
                      navigation.navigate("Detalhes", { id: project.id })
                    }
                  />
                ))}
              </View>
            ) : (
              <Card>
                <Text style={styles.muted}>
                  Você ainda não participa de nenhum projeto.
                </Text>
              </Card>
            )}
          </View>
          <Button
            title="Sair da conta"
            secondary
            icon="log-out-outline"
            onPress={() => logout().catch((e) => setError(e.message))}
            style={{ alignSelf: "flex-start" }}
          />
          <Card style={{ maxWidth: 720, width: "100%" }}>
            <Text style={styles.h2}>Informações pessoais</Text>
            <Field label="Nome completo" value={name} onChangeText={setName} />
            <Field
              label="E-mail"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {notice ? <Text style={{ color: c.green }}>{notice}</Text> : null}
            <Button
              title="Salvar alterações"
              loading={busy}
              onPress={async () => {
                setBusy(true);
                setNotice("");
                try {
                  const updated = await api("/profile", {
                    method: "PUT",
                    body: { name, email: email.trim().toLowerCase() },
                  });
                  setUser(updated);
                  setP({ ...p, ...updated });
                  setNotice("Perfil atualizado.");
                  setError("");
                } catch (e) {
                  setError(e.message);
                } finally {
                  setBusy(false);
                }
              }}
            />
          </Card>
        </>
      )}
    </Page>
  );
}
