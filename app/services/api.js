import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
export const storage = {
  async get(key) {
    return Platform.OS === "web"
      ? globalThis.localStorage?.getItem(key)
      : AsyncStorage.getItem(key);
  },
  async set(key, value) {
    if (Platform.OS === "web") globalThis.localStorage?.setItem(key, value);
    else await AsyncStorage.setItem(key, value);
  },
  async remove(key) {
    if (Platform.OS === "web") globalThis.localStorage?.removeItem(key);
    else await AsyncStorage.removeItem(key);
  },
};
export const API_URL = (
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000/api"
).replace(/\/$/, "");
export async function request(path, { token, method = "GET", body } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(API_URL + path, {
      method,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (response.status === 204) return null;
    const data = await response
      .json()
      .catch(() => ({ message: "Resposta inválida da API." }));
    if (!response.ok) {
      const e = new Error(data.message || "Não foi possível concluir.");
      e.status = response.status;
      throw e;
    }
    return data;
  } catch (e) {
    if (e.name === "AbortError")
      throw new Error("A API demorou para responder. Tente novamente.");
    if (e instanceof TypeError)
      throw new Error(
        `Sem conexão com a API (${API_URL}). Confira o servidor e sua rede.`,
      );
    throw e;
  } finally {
    clearTimeout(timer);
  }
}
