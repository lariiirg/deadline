import React, { useCallback, useState } from "react";
import { Text, View, Pressable } from "react-native";
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
  styles,
} from "../components/UI";
import { colors as c } from "../theme";
const key = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export default function CalendarScreen({ navigation }) {
  const { api } = useAuth();
  const [month, setMonth] = useState(
      new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    ),
    [day, setDay] = useState(key(new Date())),
    [events, setEvents] = useState([]),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  async function load() {
    try {
      setEvents(await api("/calendar"));
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
  const start = (month.getDay() + 6) % 7;
  const count = new Date(
    month.getFullYear(),
    month.getMonth() + 1,
    0,
  ).getDate();
  const cells = Array.from({ length: 42 }, (_, i) => {
    const n = i - start + 1;
    return n > 0 && n <= count
      ? key(new Date(month.getFullYear(), month.getMonth(), n))
      : null;
  });
  const today = key(new Date());
  const selected = events.filter((e) => e.due_date === day);
  return (
    <Page>
      <Heading
        eyebrow="CADA DIA CONTA"
        title="Calendário"
        subtitle="Veja os prazos e planeje a semana da sua equipe."
      />
      <ErrorBox message={error} />
      {error ? (
        <Button title="Tentar novamente" secondary onPress={load} />
      ) : null}
      {loading ? (
        <Loading />
      ) : (
        <>
          <Card>
            <View style={[styles.row, { justifyContent: "space-between" }]}>
              <Button
                title="Anterior"
                secondary
                icon="chevron-back"
                onPress={() =>
                  setMonth(
                    new Date(month.getFullYear(), month.getMonth() - 1, 1),
                  )
                }
              />
              <Text style={styles.h2}>
                {month.toLocaleDateString("pt-BR", {
                  month: "long",
                  year: "numeric",
                })}
              </Text>
              <Button
                title="Próximo"
                secondary
                icon="chevron-forward"
                onPress={() =>
                  setMonth(
                    new Date(month.getFullYear(), month.getMonth() + 1, 1),
                  )
                }
              />
            </View>
            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
              {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((d) => (
                <View
                  key={d}
                  style={{
                    width: "14.2857%",
                    paddingVertical: 14,
                    alignItems: "center",
                  }}
                >
                  <Text style={styles.small}>{d}</Text>
                </View>
              ))}
              {cells.map((d, i) => (
                <Pressable
                  key={i}
                  disabled={!d}
                  accessibilityLabel={d || "Dia fora do mês"}
                  onPress={() => setDay(d)}
                  style={{ width: "14.2857%", height: 65, padding: 4 }}
                >
                  <View
                    style={{
                      flex: 1,
                      borderRadius: 10,
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 5,
                      backgroundColor:
                        d === day ? c.red : d === today ? c.pink : c.white,
                      borderWidth: d === today ? 1 : 0,
                      borderColor: c.red,
                    }}
                  >
                    <Text
                      style={{
                        color: d === day ? c.white : c.text,
                        fontWeight: d === today ? "800" : "500",
                      }}
                    >
                      {d ? Number(d.slice(-2)) : ""}
                    </Text>
                    {d && events.some((e) => e.due_date === d) ? (
                      <View
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: 5,
                          backgroundColor: d === day ? c.white : c.red,
                        }}
                      />
                    ) : null}
                  </View>
                </Pressable>
              ))}
            </View>
          </Card>
          <Heading
            title="Compromissos do dia"
            subtitle={new Date(day + "T12:00:00").toLocaleDateString("pt-BR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          />
          {selected.length ? (
            selected.map((e) => (
              <Card key={e.id}>
                <View style={[styles.row, { justifyContent: "space-between" }]}>
                  <View>
                    <Text style={styles.h2}>{e.title}</Text>
                    <Text style={styles.muted}>
                      {e.type}
                      {e.project_name ? " · " + e.project_name : ""}
                    </Text>
                  </View>
                  <Badge status={e.status} />
                </View>
                <Button
                  title="Abrir projeto"
                  secondary
                  onPress={() =>
                    navigation.navigate("Detalhes", { id: e.project_id })
                  }
                />
              </Card>
            ))
          ) : (
            <Empty
              title="Um respiro na agenda"
              message="Nenhuma entrega marcada para este dia."
            />
          )}
        </>
      )}
    </Page>
  );
}
