import React, { useCallback, useState } from "react";
import { Text, View, RefreshControl } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import {
  Page,
  Heading,
  Button,
  Card,
  Icon,
  styles,
  Progress,
  Empty,
  ErrorBox,
  Loading,
  formatDate,
} from "../components/UI";
import ProjectCard from "../components/ProjectCard";
import { colors as c } from "../theme";
export default function DashboardScreen({ navigation }) {
  const { api, user } = useAuth();
  const [data, setData] = useState(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await api("/dashboard"));
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [api]);
  useFocusEffect(
    useCallback(() => {
      load();
    }, [user.id]),
  );
  return (
    <Page
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
    >
      <Heading
        eyebrow="SEU ESPAÇO DE ORGANIZAÇÃO"
        title={`Olá, ${user.name.split(" ")[0]} 👋`}
        subtitle={new Date().toLocaleDateString("pt-BR", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
        action={
          <Button
            title="Novo projeto"
            icon="add"
            onPress={() => navigation.navigate("Formulario")}
          />
        }
      />
      <ErrorBox message={error} />
      {error ? (
        <Button title="Tentar novamente" secondary onPress={load} />
      ) : null}
      {!data && loading ? (
        <Loading />
      ) : data ? (
        <>
          <Card
            style={{
              backgroundColor: "#FFF1F2",
              borderColor: "#FEE2E2",
              padding: 28,
            }}
          >
            <View style={[styles.row, { justifyContent: "space-between" }]}>
              <View style={{ gap: 8, flex: 1 }}>
                <Text style={[styles.h2, { fontSize: 23 }]}>
                  Menos correria. Mais conquistas.
                </Text>
                <Text style={styles.muted}>
                  Cada tarefa concluída é um passo mais perto da entrega.
                </Text>
              </View>
              <Icon name="school-outline" size={48} color={c.red} />
            </View>
          </Card>
          <View style={styles.grid}>
            {[
              {
                label: "Em andamento",
                value: data.active,
                icon: "folder-open-outline",
                color: c.red,
              },
              {
                label: "Trabalhos concluídos",
                value: data.completed,
                icon: "checkmark-circle-outline",
                color: c.green,
              },
              {
                label: "Entregas em até 7 dias",
                value: data.near,
                icon: "time-outline",
                color: "#D97706",
              },
            ].map((s) => (
              <Card key={s.label} style={{ flex: 1, minWidth: 210 }}>
                <View style={[styles.row, { justifyContent: "space-between" }]}>
                  <Text style={styles.muted}>{s.label}</Text>
                  <Icon name={s.icon} color={s.color} />
                </View>
                <Text style={[styles.title, { fontSize: 34 }]}>{s.value}</Text>
              </Card>
            ))}
          </View>
          <Card>
            <Text style={styles.h2}>Um passo de cada vez</Text>
            <Progress value={data.progress} />
          </Card>
          <View style={[styles.row, { justifyContent: "space-between" }]}>
            <Text style={styles.h2}>Projetos recentes</Text>
            <Button
              title="Ver todos"
              secondary
              onPress={() => navigation.navigate("Projetos")}
            />
          </View>
          {data.projects.length ? (
            <View style={styles.grid}>
              {data.projects.slice(0, 4).map((p) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  onPress={() => navigation.navigate("Detalhes", { id: p.id })}
                />
              ))}
            </View>
          ) : (
            <Empty
              action={
                <Button
                  title="Criar meu primeiro projeto"
                  onPress={() => navigation.navigate("Formulario")}
                />
              }
            />
          )}
          <Text style={styles.h2}>Próximas entregas</Text>
          <Card>
            {data.projects
              .filter((p) => p.status !== "concluído")
              .sort((a, b) => a.due_date.localeCompare(b.due_date))
              .slice(0, 5)
              .map((p) => (
                <View
                  key={p.id}
                  style={[
                    styles.row,
                    {
                      justifyContent: "space-between",
                      borderBottomWidth: 1,
                      borderColor: c.border,
                      paddingVertical: 10,
                    },
                  ]}
                >
                  <View>
                    <Text style={styles.label}>{p.name}</Text>
                    <Text style={styles.small}>
                      {p.subject} · {formatDate(p.due_date)}
                    </Text>
                  </View>
                  <Button
                    title="Abrir"
                    secondary
                    onPress={() =>
                      navigation.navigate("Detalhes", { id: p.id })
                    }
                  />
                </View>
              ))}
            {!data.projects.some((p) => p.status !== "concluído") ? (
              <Text style={styles.muted}>Nenhuma entrega pendente.</Text>
            ) : null}
          </Card>
        </>
      ) : null}
    </Page>
  );
}
