import React, { createContext, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";
import * as Linking from "expo-linking";
import { request, storage } from "../services/api";
const Context = createContext();
export const useAuth = () => useContext(Context);
export function AuthProvider({ children }) {
  const [token, setToken] = useState(null),
    [user, setUser] = useState(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [invite, setInvite] = useState("");
  async function receiveURL(url) {
    if (!url) return;
    url = Linking.unwrapDevLaunchURL(url);
    const match = url.match(/[?&]invite=([a-fA-F0-9]{16})/);
    if (match) {
      const code = match[1].toUpperCase();
      setInvite(code);
      await storage.set("deadline.invite", code);
    }
  }
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const savedInvite = await storage.get("deadline.invite");
        if (active && savedInvite) setInvite(savedInvite);
        await receiveURL(await Linking.getInitialURL());
        const t = await storage.get("deadline.token");
        if (t) {
          const profile = await request("/profile", { token: t });
          if (active) {
            setToken(t);
            setUser(profile);
          }
        }
      } catch (e) {
        if (e.status === 401) await storage.remove("deadline.token");
        else if (active) setError(e.message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    const sub = Linking.addEventListener("url", ({ url }) => {
      receiveURL(url).catch((e) => setError(e.message));
    });
    return () => {
      active = false;
      sub.remove();
    };
  }, []);
  async function logout() {
    await storage.remove("deadline.token");
    setToken(null);
    setUser(null);
  }
  async function api(path, options = {}) {
    try {
      return await request(path, { ...options, token });
    } catch (e) {
      if (e.status === 401) await logout();
      throw e;
    }
  }
  async function authenticate(mode, data) {
    const result = await request(`/auth/${mode}`, {
      method: "POST",
      body: data,
    });
    await storage.set("deadline.token", result.token);
    setToken(result.token);
    setUser(result.user);
    setError("");
  }
  async function clearInvite() {
    await storage.remove("deadline.invite");
    setInvite("");
    if (Platform.OS === "web" && globalThis.location) {
      const url = new URL(globalThis.location.href);
      url.searchParams.delete("invite");
      globalThis.history.replaceState({}, "", url.toString());
    }
  }
  return (
    <Context.Provider
      value={{
        token,
        user,
        setUser,
        loading,
        error,
        api,
        authenticate,
        logout,
        invite,
        clearInvite,
      }}
    >
      {children}
    </Context.Provider>
  );
}
