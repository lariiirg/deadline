import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Modal,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors as c } from "../theme";
export const styles = StyleSheet.create({
  page: {
    padding: 28,
    paddingBottom: 60,
    gap: 22,
    width: "100%",
    maxWidth: 1280,
    alignSelf: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  card: {
    backgroundColor: c.white,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 18,
    boxShadow: "0px 3px 12px rgba(17, 24, 39, 0.035)",
    padding: 22,
    gap: 12,
  },
  title: {
    fontSize: 29,
    fontWeight: "800",
    color: c.text,
    letterSpacing: -0.8,
  },
  h2: { fontSize: 19, fontWeight: "700", color: c.text },
  text: { fontSize: 14, color: c.text, lineHeight: 22 },
  muted: { fontSize: 13, color: c.muted, lineHeight: 21 },
  label: { fontSize: 13, fontWeight: "600", color: c.text },
  input: {
    backgroundColor: c.white,
    borderColor: c.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 14,
    color: c.text,
    minHeight: 46,
  },
  error: {
    backgroundColor: "#FFF1F2",
    borderRadius: 10,
    padding: 14,
    color: "#B91C1C",
    lineHeight: 21,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  small: { fontSize: 12, color: c.muted },
});
export function Icon({ name, size = 20, color = c.muted }) {
  return <Ionicons name={name} size={size} color={color} />;
}
export function Button({
  title,
  onPress,
  secondary = false,
  danger = false,
  loading = false,
  disabled = false,
  icon,
  style,
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        {
          backgroundColor: secondary ? c.white : danger ? c.darkRed : c.red,
          borderWidth: 1,
          borderColor: secondary ? c.border : c.red,
          borderRadius: 10,
          paddingHorizontal: 17,
          paddingVertical: 12,
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          gap: 8,
          opacity: disabled || loading ? 0.5 : pressed ? 0.8 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={secondary ? c.red : c.white} />
      ) : icon ? (
        <Icon name={icon} size={17} color={secondary ? c.text : c.white} />
      ) : null}
      <Text
        style={{
          fontSize: 13,
          fontWeight: "700",
          color: secondary ? c.text : c.white,
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}
export function Field({ label, error, ...props }) {
  return (
    <View style={{ gap: 7 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor="#94A3B8"
        style={[
          styles.input,
          props.multiline && { minHeight: 90, textAlignVertical: "top" },
        ]}
        {...props}
      />
      {error ? <Text style={{ color: c.red }}>{error}</Text> : null}
    </View>
  );
}
export function Select({ label, value, onChange, options }) {
  return (
    <View style={{ gap: 8 }}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.row}>
        {options.map((o) => {
          const item = typeof o === "string" ? { label: o, value: o } : o;
          const selected = value === item.value;
          return (
            <Pressable
              accessibilityRole="button"
              key={String(item.value)}
              onPress={() => onChange(item.value)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 9,
                borderRadius: 9,
                borderWidth: 1,
                borderColor: selected ? c.red : c.border,
                backgroundColor: selected ? c.pink : c.white,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: selected ? "700" : "400",
                  color: selected ? c.darkRed : c.muted,
                }}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
export function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}
export function Badge({ status }) {
  const done = status === "concluído" || status === "concluída";
  return (
    <View
      style={{
        alignSelf: "flex-start",
        backgroundColor: done
          ? "#F0FDF4"
          : status === "em andamento"
            ? "#EFF6FF"
            : "#FFF7ED",
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 7,
      }}
    >
      <Text
        style={{
          fontSize: 11,
          fontWeight: "600",
          color: done
            ? c.green
            : status === "em andamento"
              ? c.blue
              : "#C2410C",
        }}
      >
        {status}
      </Text>
    </View>
  );
}
export function Progress({ value = 0 }) {
  return (
    <View style={{ gap: 7 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={styles.small}>Progresso das tarefas</Text>
        <Text style={[styles.small, { fontWeight: "700", color: c.text }]}>
          {value}%
        </Text>
      </View>
      <View
        style={{
          height: 6,
          borderRadius: 8,
          backgroundColor: "#F1F5F9",
          overflow: "hidden",
        }}
      >
        <View
          style={{
            height: 6,
            width: `${value}%`,
            borderRadius: 8,
            backgroundColor: c.red,
          }}
        />
      </View>
    </View>
  );
}
export function Empty({
  title = "Tudo pronto para começar",
  message = "Crie seu primeiro projeto ou entre no grupo dos seus colegas.",
  action,
}) {
  return (
    <Card style={{ alignItems: "center", padding: 35 }}>
      <View style={{ padding: 17, borderRadius: 20, backgroundColor: c.pink }}>
        <Icon name="albums-outline" color={c.red} size={30} />
      </View>
      <Text style={styles.h2}>{title}</Text>
      <Text style={[styles.muted, { textAlign: "center" }]}>{message}</Text>
      {action}
    </Card>
  );
}
export function ErrorBox({ message }) {
  return message ? (
    <Text accessibilityRole="alert" style={styles.error}>
      {message}
    </Text>
  ) : null;
}
export function Loading() {
  return (
    <View style={{ padding: 60, alignItems: "center", gap: 14 }}>
      <ActivityIndicator color={c.red} />
      <Text style={styles.muted}>Carregando Deadline…</Text>
    </View>
  );
}
export function Page({ children, refreshControl }) {
  const { width } = useWindowDimensions();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.bg }}
      refreshControl={refreshControl}
      contentContainerStyle={[styles.page, width < 650 && { padding: 18 }]}
    >
      {children}
    </ScrollView>
  );
}
export function Heading({ eyebrow, title, subtitle, action }) {
  return (
    <View
      style={[styles.row, { justifyContent: "space-between", marginBottom: 3 }]}
    >
      <View style={{ gap: 5, flex: 1, minWidth: 180 }}>
        {eyebrow ? (
          <Text
            style={{
              fontSize: 11,
              color: c.red,
              fontWeight: "800",
              letterSpacing: 1.5,
            }}
          >
            {eyebrow}
          </Text>
        ) : null}
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.muted}>{subtitle}</Text> : null}
      </View>
      {action}
    </View>
  );
}
export function Dialog({ visible, title, onClose, children }) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "#11182788",
          justifyContent: "center",
          alignItems: "center",
          padding: 18,
        }}
      >
        <View
          style={{
            maxWidth: 600,
            width: "100%",
            maxHeight: "90%",
            backgroundColor: c.white,
            borderRadius: 22,
            overflow: "hidden",
          }}
        >
          <ScrollView contentContainerStyle={{ padding: 24, gap: 18 }}>
            <View style={[styles.row, { justifyContent: "space-between" }]}>
              <Text style={styles.h2}>{title}</Text>
              <Pressable onPress={onClose} accessibilityLabel="Fechar">
                <Icon name="close" />
              </Pressable>
            </View>
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
export function ConfirmButton({ title, onConfirm }) {
  const [open, setOpen] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <>
      <Button title={title} secondary onPress={() => setOpen(true)} />
      <Dialog visible={open} title={title + "?"} onClose={() => setOpen(false)}>
        <Text style={styles.text}>
          Essa ação é permanente e remove os dados relacionados.
        </Text>
        <ErrorBox message={error} />
        <Button
          title="Confirmar exclusão"
          danger
          loading={busy}
          onPress={async () => {
            setBusy(true);
            try {
              await onConfirm();
              setOpen(false);
            } catch (e) {
              setError(e.message);
            } finally {
              setBusy(false);
            }
          }}
        />
      </Dialog>
    </>
  );
}
export function formatDate(value) {
  return value
    ? new Date(value.slice(0, 10) + "T12:00:00").toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "";
}
