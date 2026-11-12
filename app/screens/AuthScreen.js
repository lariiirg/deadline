import React, { useState } from "react";
import {
  View,
  Text,
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import {
  Button,
  Field,
  Select,
  ErrorBox,
  Icon,
  styles,
} from "../components/UI";
import { colors as c } from "../theme";
export default function AuthScreen() {
  const { authenticate, error: initialError, invite } = useAuth();
  const [register, setRegister] = useState(false),
    [name, setName] = useState(""),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [confirm, setConfirm] = useState(""),
    [type, setType] = useState("aluno"),
    [error, setError] = useState(initialError),
    [busy, setBusy] = useState(false);
  const { width } = useWindowDimensions();
  async function submit() {
    setError("");
    if (!email.trim() || !password || (register && !name.trim())) {
      setError("Preencha todos os campos.");
      return;
    }
    if (register && password !== confirm) {
      setError("As senhas não coincidem.");
      return;
    }
    if (register && password.length < 8) {
      setError("Use uma senha com pelo menos 8 caracteres.");
      return;
    }
    setBusy(true);
    try {
      await authenticate(register ? "register" : "login", {
        email: email.trim().toLowerCase(),
        password,
        ...(register ? { name: name.trim(), account_type: type } : {}),
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: c.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          flexDirection: width > 900 ? "row" : "column",
        }}
      >
        {width > 900 ? (
          <View
            style={{
              width: "45%",
              backgroundColor: "#FFF1F2",
              padding: 64,
              justifyContent: "center",
              gap: 26,
            }}
          >
            <View style={styles.row}>
              <Icon name="hourglass" color={c.red} size={35} />
              <Text style={[styles.title, { fontSize: 35 }]}>Deadline</Text>
            </View>
            <Text
              style={{
                fontSize: 48,
                fontWeight: "800",
                lineHeight: 56,
                color: c.text,
                letterSpacing: -2,
              }}
            >
              Grandes ideias.{"\n"}Trabalho em grupo.{"\n"}Tudo no prazo.
            </Text>
            <Text style={[styles.muted, { fontSize: 17, lineHeight: 28 }]}>
              Um espaço para organizar as tarefas, reunir sua equipe e
              transformar projetos em conquistas.
            </Text>
            <View style={{ marginTop: 35, gap: 15 }}>
              {[
                "Cada integrante sabe o que fazer",
                "Prazos organizados em um só lugar",
                "Mais colaboração, menos correria",
              ].map((t) => (
                <View key={t} style={styles.row}>
                  <Icon name="checkmark-circle" color={c.red} />
                  <Text style={styles.text}>{t}</Text>
                </View>
              ))}
            </View>
            <Text style={[styles.small, { marginTop: 45 }]}>
              FEITO PARA APRENDER. CRIADO PARA COLABORAR.
            </Text>
          </View>
        ) : null}
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 28,
          }}
        >
          <View style={{ width: "100%", maxWidth: 420, gap: 20 }}>
            <View style={styles.row}>
              <Icon name="hourglass" color={c.red} size={30} />
              <Text style={[styles.h2, { fontSize: 25 }]}>Deadline</Text>
            </View>
            <View style={{ gap: 8 }}>
              <Text style={styles.title}>
                {register ? "Vamos começar?" : "Bom ter você por aqui."}
              </Text>
              <Text style={styles.muted}>
                {register
                  ? "Crie sua conta e organize o próximo trabalho."
                  : "Entre para acompanhar os projetos da sua equipe."}
              </Text>
            </View>
            {invite ? (
              <Text style={{ color: c.darkRed }}>
                Um convite está esperando por você após entrar.
              </Text>
            ) : null}
            <ErrorBox message={error} />
            {register ? (
              <Field
                label="Nome completo"
                value={name}
                onChangeText={setName}
                autoComplete="name"
              />
            ) : null}
            <Field
              label="E-mail"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              placeholder="voce@escola.com"
            />
            <Field
              label="Senha"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete={register ? "new-password" : "current-password"}
              onSubmitEditing={submit}
            />
            {register ? (
              <>
                <Field
                  label="Confirme sua senha"
                  value={confirm}
                  onChangeText={setConfirm}
                  secureTextEntry
                />
                <Select
                  label="Tipo de conta"
                  value={type}
                  onChange={setType}
                  options={["aluno", "professor"]}
                />
              </>
            ) : null}
            <Button
              title={register ? "Criar minha conta" : "Entrar"}
              loading={busy}
              onPress={submit}
              icon="arrow-forward"
            />
            <Button
              secondary
              title={register ? "Já tenho uma conta" : "Criar conta"}
              onPress={() => {
                setRegister(!register);
                setError("");
              }}
            />
            <Text style={[styles.small, { textAlign: "center" }]}>
              Seu próximo projeto começa aqui.
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
