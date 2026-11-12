import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Page,
  Heading,
  Card,
  Field,
  Select,
  Button,
  ErrorBox,
} from "../components/UI";
export default function ProjectForm({ navigation, route }) {
  const project = route.params?.project;
  const { api } = useAuth();
  const [form, setForm] = useState({
      name: project?.name || "",
      subject: project?.subject || "",
      topic: project?.topic || "",
      description: project?.description || "",
      due_date: project?.due_date || "",
      status: project?.status || "pendente",
    }),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const change = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  async function save() {
    setError("");
    setBusy(true);
    try {
      const p = await api(project ? `/projects/${project.id}` : "/projects", {
        method: project ? "PUT" : "POST",
        body: form,
      });
      navigation.replace("Detalhes", { id: p.id });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page>
      <Heading
        eyebrow="ESPAÇO DA EQUIPE"
        title={project ? "Editar projeto" : "Um novo começo"}
        subtitle="Organize as ideias e dê o primeiro passo com seu grupo."
      />
      <Card style={{ maxWidth: 720, width: "100%" }}>
        <ErrorBox message={error} />
        <Field
          label="Nome do projeto"
          value={form.name}
          onChangeText={change("name")}
          placeholder="Como se chama o trabalho?"
        />
        <Field
          label="Matéria"
          value={form.subject}
          onChangeText={change("subject")}
          placeholder="Ex.: Biologia"
        />
        <Field label="Tema" value={form.topic} onChangeText={change("topic")} />
        <Field
          label="Descrição"
          value={form.description}
          onChangeText={change("description")}
          multiline
        />
        <Field
          label="Data de entrega (AAAA-MM-DD)"
          value={form.due_date}
          onChangeText={change("due_date")}
          placeholder="2026-12-15"
          maxLength={10}
        />
        <Select
          label="Status"
          value={form.status}
          onChange={change("status")}
          options={["pendente", "em andamento", "concluído"]}
        />
        <Button
          title={project ? "Salvar alterações" : "Criar projeto"}
          icon="add"
          loading={busy}
          onPress={save}
        />
        <Button
          title="Cancelar"
          secondary
          onPress={() => navigation.goBack()}
        />
      </Card>
    </Page>
  );
}
