import React from "react";
import { Pressable, View, Text } from "react-native";
import { Card, Icon, Badge, Progress, styles, formatDate } from "./UI";
import { colors as c } from "../theme";
export default function ProjectCard({ project: p, onPress }) {
  const progress = p.task_count
    ? Math.round((p.completed_tasks / p.task_count) * 100)
    : 0;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{ flexGrow: 1, flexBasis: 290, maxWidth: 520 }}
    >
      <Card style={{ height: 260 }}>
        <View style={[styles.row, { justifyContent: "space-between" }]}>
          <View
            style={{ backgroundColor: c.pink, padding: 10, borderRadius: 12 }}
          >
            <Icon name="folder-open-outline" color={c.red} />
          </View>
          <Badge status={p.status} />
        </View>
        <Text style={styles.h2} numberOfLines={1}>
          {p.name}
        </Text>
        <Text style={styles.muted}>
          {p.subject} · {p.role === "criador" ? "Seu projeto" : "Integrante"}
        </Text>
        <Progress value={progress} />
        <View
          style={[
            styles.row,
            { justifyContent: "space-between", marginTop: 8 },
          ]}
        >
          <View style={styles.row}>
            <Icon name="calendar-outline" size={15} />
            <Text style={styles.small}>{formatDate(p.due_date)}</Text>
          </View>
          <View style={styles.row}>
            <Icon name="people-outline" size={16} />
            <Text style={styles.small}>{p.member_count}</Text>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}
