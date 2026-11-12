import React, { useState, useCallback } from "react";
import { Text } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import {
  Page,
  Heading,
  Card,
  Button,
  Badge,
  Empty,
  ErrorBox,
  Loading,
  Select,
  styles,
  formatDate,
} from "../components/UI";
export default function TasksScreen({ navigation }) {
  const { api } = useAuth();
  const [tasks, setTasks] = useState([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [filter, setFilter] = useState("todas");
  async function load() {
    setLoading(true);
    try {
      setTasks(
        (await api("/calendar"))
          .filter((e) => e.type === "Tarefa")
          .sort((a, b) => a.due_date.localeCompare(b.due_date)),
      );
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
  const filtered = tasks.filter(
    (t) => filter === "todas" || t.status === filter,
  );
  return (
    <Page>
      <Heading
        eyebrow="UM PASSO DE CADA VEZ"
        title="Tarefas"
        subtitle="Acompanhe as atividades de todos os seus grupos. Abra o projeto para gerenciar uma tarefa."
      />
      <ErrorBox message={error} />
      {error ? <Button title="Tentar novamente" onPress={load} /> : null}
      <Select
        label="Status"
        value={filter}
        onChange={setFilter}
        options={["todas", "pendente", "em andamento", "concluída"]}
      />
      {loading ? (
        <Loading />
      ) : filtered.length ? (
        filtered.map((t) => (
          <Card key={t.id}>
            <Badge status={t.status} />
            <Text style={styles.h2}>{t.title}</Text>
            <Text style={styles.muted}>
              {t.project_name} · {formatDate(t.due_date)}
            </Text>
            <Text style={styles.muted}>{t.description}</Text>
            <Button
              title="Abrir projeto"
              secondary
              onPress={() =>
                navigation.navigate("Detalhes", { id: t.project_id })
              }
            />
          </Card>
        ))
      ) : (
        <Empty
          title="Tudo organizado por aqui"
          message="As tarefas dos seus projetos aparecerão nesta página."
        />
      )}
    </Page>
  );
}
