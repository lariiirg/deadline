import React, { useState, useCallback } from "react";
import { Text, View, Share, Platform } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import {
  Page,
  Heading,
  Card,
  Button,
  Field,
  Select,
  Dialog,
  ConfirmButton,
  Progress,
  Badge,
  ErrorBox,
  Loading,
  styles,
  formatDate,
} from "../components/UI";
import { colors as c } from "../theme";
const statuses = ["pendente", "em andamento", "concluída"];
function MemberEditor({ project, onClose, onSaved, onShare }) {
  const { api } = useAuth();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <Dialog visible title="Adicionar integrantes" onClose={onClose}>
      <Text style={styles.muted}>
        Informe o e-mail de uma pessoa que já tem conta no Deadline.
      </Text>
      <Field
        label="E-mail do integrante"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <ErrorBox message={error} />
      <Button
        title="Adicionar ao grupo"
        loading={busy}
        onPress={async () => {
          setBusy(true);
          setError("");
          try {
            await api(`/projects/${project.id}/members`, {
              method: "POST",
              body: { email: email.trim().toLowerCase() },
            });
            onSaved();
          } catch (e) {
            setError(e.message);
          } finally {
            setBusy(false);
          }
        }}
      />
      <Text style={styles.muted}>
        Ainda não tem conta? Envie o link ou o código do convite para entrar
        após o cadastro.
      </Text>
      <Text selectable style={styles.label}>
        {project.invitation.code}
      </Text>
      <Text selectable style={styles.small}>
        {project.invitation.url}
      </Text>
      <Button
        title="Compartilhar convite"
        secondary
        icon="share-outline"
        onPress={onShare}
      />
    </Dialog>
  );
}
function TaskEditor({ project, task, onClose, onSaved }) {
  const { api } = useAuth();
  const [form, setForm] = useState({
      title: task?.title || "",
      description: task?.description || "",
      assignee_id: task?.assignee_id || null,
      due_date: task?.due_date || project.due_date,
      status: task?.status || "pendente",
    }),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const change = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  return (
    <Dialog
      visible
      title={task ? "Editar tarefa" : "Nova tarefa"}
      onClose={onClose}
    >
      <ErrorBox message={error} />
      <Field label="Título" value={form.title} onChangeText={change("title")} />
      <Field
        label="Descrição"
        multiline
        value={form.description}
        onChangeText={change("description")}
      />
      <Field
        label="Prazo (AAAA-MM-DD)"
        value={form.due_date}
        onChangeText={change("due_date")}
        maxLength={10}
      />
      <Select
        label="Responsável"
        value={form.assignee_id}
        onChange={change("assignee_id")}
        options={[
          { label: "Não atribuído", value: null },
          ...project.members.map((m) => ({ label: m.name, value: m.id })),
        ]}
      />
      <Select
        label="Status"
        value={form.status}
        onChange={change("status")}
        options={statuses}
      />
      <Button
        title="Salvar tarefa"
        loading={busy}
        onPress={async () => {
          setBusy(true);
          try {
            await api(
              `/projects/${project.id}/tasks${task ? "/" + task.id : ""}`,
              { method: task ? "PUT" : "POST", body: form },
            );
            onSaved();
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
export default function ProjectDetailScreen({ navigation, route }) {
  const { api, user } = useAuth();
  const [p, setP] = useState(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [editor, setEditor] = useState(undefined),
    [addingMember, setAddingMember] = useState(false),
    [notice, setNotice] = useState(""),
    [updating, setUpdating] = useState(null);
  const projectId = route.params.id;
  async function load() {
    try {
      setP(await api(`/projects/${projectId}`));
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [projectId]),
  );
  const admin = p?.owner_id === user.id;
  const canAddMembers = admin || user.account_type === "professor";
  async function share() {
    try {
      if (Platform.OS === "web" && globalThis.navigator?.clipboard) {
        await globalThis.navigator.clipboard.writeText(p.invitation.url);
        setNotice("Link copiado! Compartilhe com sua equipe.");
      } else
        await Share.share({
          message: `Entre no projeto ${p.name}: ${p.invitation.url}\nCódigo: ${p.invitation.code}`,
        });
    } catch (e) {
      setError("Não foi possível compartilhar. Copie o link exibido abaixo.");
    }
  }
  return (
    <Page>
      <ErrorBox message={error} />
      {error ? (
        <Button secondary title="Tentar novamente" onPress={load} />
      ) : null}
      {loading ? (
        <Loading />
      ) : p ? (
        <>
          <Heading
            eyebrow={p.subject.toUpperCase()}
            title={p.name}
            subtitle={p.topic}
            action={
              admin ? (
                <Button
                  title="Editar projeto"
                  secondary
                  icon="create-outline"
                  onPress={() =>
                    navigation.navigate("Formulario", { project: p })
                  }
                />
              ) : null
            }
          />
          <View style={styles.row}>
            <Badge status={p.status} />
            <Text style={styles.muted}>
              Entrega: {formatDate(p.due_date)} ·{" "}
              {admin ? "Você é o criador" : "Você é integrante"}
            </Text>
          </View>
          <Card>
            <Text style={styles.h2}>Sobre o projeto</Text>
            <Text style={styles.text}>
              {p.description || "O grupo ainda não adicionou uma descrição."}
            </Text>
            <Progress value={p.progress} />
          </Card>
          <Card>
            <View style={[styles.row, { justifyContent: "space-between" }]}>
              <View>
                <Text style={styles.h2}>Tarefas do grupo</Text>
                <Text style={styles.muted}>
                  {p.tasks.filter((t) => t.status === "concluída").length} de{" "}
                  {p.tasks.length} concluídas
                </Text>
              </View>
              {admin ? (
                <Button
                  title="Nova tarefa"
                  icon="add"
                  onPress={() => setEditor(null)}
                />
              ) : null}
            </View>
            {!p.tasks.length ? (
              <Text style={styles.muted}>
                As próximas etapas do projeto aparecerão aqui.
              </Text>
            ) : (
              p.tasks.map((t) => (
                <View
                  key={t.id}
                  style={{
                    borderTopWidth: 1,
                    borderColor: c.border,
                    paddingTop: 18,
                    paddingBottom: 8,
                    gap: 10,
                  }}
                >
                  <View
                    style={[styles.row, { justifyContent: "space-between" }]}
                  >
                    <Text style={[styles.h2, { fontSize: 16 }]}>{t.title}</Text>
                    <Badge status={t.status} />
                  </View>
                  {t.description ? (
                    <Text style={styles.muted}>{t.description}</Text>
                  ) : null}
                  <Text style={styles.small}>
                    {t.assignee_name || "Sem responsável"} · Prazo:{" "}
                    {formatDate(t.due_date)} · Criada:{" "}
                    {formatDate(t.created_at)}
                  </Text>
                  {admin || t.assignee_id === user.id ? (
                    <View
                      style={{ opacity: updating === t.id ? 0.45 : 1 }}
                      pointerEvents={updating === t.id ? "none" : "auto"}
                    >
                      <Select
                        value={t.status}
                        options={statuses}
                        onChange={async (status) => {
                          setUpdating(t.id);
                          try {
                            await api(
                              `/projects/${p.id}/tasks/${t.id}/status`,
                              { method: "PATCH", body: { status } },
                            );
                            await load();
                          } catch (e) {
                            setError(e.message);
                          } finally {
                            setUpdating(null);
                          }
                        }}
                      />
                    </View>
                  ) : null}
                  {admin ? (
                    <View style={styles.row}>
                      <Button
                        title="Editar"
                        secondary
                        onPress={() => setEditor(t)}
                      />
                      <ConfirmButton
                        title="Excluir tarefa"
                        onConfirm={async () => {
                          await api(`/projects/${p.id}/tasks/${t.id}`, {
                            method: "DELETE",
                          });
                          await load();
                        }}
                      />
                    </View>
                  ) : null}
                </View>
              ))
            )}
          </Card>
          <Card>
            <View style={[styles.row, { justifyContent: "space-between" }]}>
              <Text style={styles.h2}>Nossa equipe · {p.members.length}</Text>
              {canAddMembers ? (
                <Button
                  title="Adicionar integrantes"
                  icon="person-add-outline"
                  onPress={() => setAddingMember(true)}
                />
              ) : null}
            </View>
            {p.members.map((m) => (
              <View style={styles.row} key={m.id}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 12,
                    backgroundColor: c.pink,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontWeight: "700", color: c.red }}>
                    {m.name.slice(0, 1).toUpperCase()}
                  </Text>
                </View>
                <View>
                  <Text style={styles.label}>
                    {m.name}
                    {m.id === user.id ? " (você)" : ""}
                  </Text>
                  <Text style={styles.small}>
                    {m.id === p.owner_id
                      ? "Criador / Administrador"
                      : "Integrante"}
                  </Text>
                </View>
              </View>
            ))}
          </Card>
          {admin ? (
            <Card>
              <Text style={styles.h2}>Juntos fica mais fácil</Text>
              <Text style={styles.muted}>
                Compartilhe o link ou o código para convidar seus colegas.
              </Text>
              <Text
                selectable
                style={{
                  fontSize: 22,
                  fontWeight: "800",
                  letterSpacing: 2,
                  color: c.red,
                }}
              >
                {p.invitation.code}
              </Text>
              <Text selectable style={styles.small}>
                {p.invitation.url}
              </Text>
              <Button
                title="Compartilhar convite"
                icon="share-outline"
                onPress={share}
              />
              {notice ? <Text style={{ color: c.green }}>{notice}</Text> : null}
            </Card>
          ) : null}
          {admin ? (
            <Card>
              <Text style={styles.h2}>Gerenciar projeto</Text>
              <Text style={styles.muted}>
                A exclusão remove também as tarefas e os convites do grupo.
              </Text>
              <ConfirmButton
                title="Excluir projeto"
                onConfirm={async () => {
                  await api(`/projects/${p.id}`, { method: "DELETE" });
                  navigation.goBack();
                }}
              />
            </Card>
          ) : null}
          {addingMember && canAddMembers ? (
            <MemberEditor
              project={p}
              onClose={() => setAddingMember(false)}
              onShare={share}
              onSaved={() => {
                setAddingMember(false);
                load();
              }}
            />
          ) : null}
          {editor !== undefined ? (
            <TaskEditor
              key={editor?.id || "new"}
              project={p}
              task={editor}
              onClose={() => setEditor(undefined)}
              onSaved={() => {
                setEditor(undefined);
                load();
              }}
            />
          ) : null}
        </>
      ) : null}
    </Page>
  );
}
