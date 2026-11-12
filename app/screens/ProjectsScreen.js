import React, { useState, useCallback } from "react";
import { View, Text } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import {
  Page,
  Heading,
  Button,
  Field,
  Select,
  Dialog,
  ErrorBox,
  Empty,
  Loading,
  styles,
} from "../components/UI";
import ProjectCard from "../components/ProjectCard";
export function JoinDialog({ visible, onClose, onJoined, initialCode = "" }) {
  const { api, clearInvite } = useAuth();
  const [code, setCode] = useState(initialCode),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <Dialog visible={visible} onClose={onClose} title="Entre para a equipe">
      <Text style={styles.muted}>
        Cole o código de 16 caracteres que o criador compartilhou.
      </Text>
      <Field
        label="Código do convite"
        value={code}
        onChangeText={(v) => setCode(v.toUpperCase().trim())}
        autoCapitalize="characters"
        maxLength={16}
      />
      <ErrorBox message={error} />
      <Button
        title="Entrar no projeto"
        loading={busy}
        onPress={async () => {
          setBusy(true);
          setError("");
          try {
            const p = await api("/invitations/join", {
              method: "POST",
              body: { code },
            });
            await clearInvite();
            onJoined(p);
          } catch (e) {
            setError(e.message);
          } finally {
            setBusy(false);
          }
        }}
      />
    </Dialog>
  );
}
export default function ProjectsScreen({ navigation }) {
  const { api } = useAuth();
  const [projects, setProjects] = useState([]),
    [query, setQuery] = useState(""),
    [status, setStatus] = useState("todos"),
    [subject, setSubject] = useState("Todas"),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [join, setJoin] = useState(false);
  async function load() {
    setLoading(true);
    try {
      setProjects(await api("/projects"));
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  useFocusEffect(
    useCallback(() => {
      load();
    }, []),
  );
  const filtered = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) &&
      (status === "todos" || p.status === status) &&
      (subject === "Todas" || p.subject === subject),
  );
  return (
    <Page>
      <Heading
        eyebrow="COLABORAÇÃO QUE ACONTECE"
        title="Meus projetos"
        subtitle="Suas ideias, sua equipe e cada etapa do caminho."
        action={
          <View style={styles.row}>
            <Button
              title="Entrar em um projeto"
              secondary
              icon="people-outline"
              onPress={() => setJoin(true)}
            />
            <Button
              title="Criar projeto"
              icon="add"
              onPress={() => navigation.navigate("Formulario")}
            />
          </View>
        }
      />
      <ErrorBox message={error} />
      {error ? <Button title="Tentar novamente" onPress={load} /> : null}
      <Field
        label="Pesquisar projetos"
        placeholder="Busque pelo nome do projeto…"
        value={query}
        onChangeText={setQuery}
      />
      <Select
        label="Status"
        value={status}
        onChange={setStatus}
        options={["todos", "pendente", "em andamento", "concluído"]}
      />
      <Select
        label="Matéria"
        value={subject}
        onChange={setSubject}
        options={["Todas", ...new Set(projects.map((p) => p.subject))]}
      />
      {loading ? (
        <Loading />
      ) : filtered.length ? (
        <View style={styles.grid}>
          {filtered.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              onPress={() => navigation.navigate("Detalhes", { id: p.id })}
            />
          ))}
        </View>
      ) : (
        <Empty
          title={
            projects.length
              ? "Nenhum projeto encontrado"
              : "Sua próxima conquista começa aqui"
          }
          message={
            projects.length
              ? "Experimente outros filtros."
              : "Crie um projeto ou entre na equipe com um convite."
          }
        />
      )}
      <JoinDialog
        visible={join}
        onClose={() => setJoin(false)}
        onJoined={(p) => {
          setJoin(false);
          navigation.navigate("Detalhes", { id: p.id });
        }}
      />
    </Page>
  );
}
