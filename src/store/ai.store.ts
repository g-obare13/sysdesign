/**
 * @fileoverview TanStack Store for managing local AI provider keys and prompt state.
 * Encapsulates localStorage persistence and custom React subscription hooks.
 */

import { Store } from "@tanstack/store";
import { useState, useEffect } from "react";

/**
 * Supported AI provider service names.
 */
export type AIProvider = "openai" | "anthropic" | "google";

/**
 * Stored API key record with provider metadata.
 */
export interface AIKey {
  /** Target provider service */
  provider: AIProvider;
  /** Plaintext API secret key */
  key: string;
  /** ISO timestamp when the key was configured */
  addedAt: string;
}

/**
 * Internal state for the AI store.
 */
interface AIState {
  /** Collection of configured provider keys */
  keys: AIKey[];
  /** Pending user prompt in the UI */
  pendingPrompt: string;
}

const STORAGE_KEY = "sysdesign-ai-keys";

/**
 * Loads persisted AI keys from browser localStorage.
 *
 * @returns Array of stored AIKey objects
 */
function loadKeys(): AIKey[] {
  try {
    if (typeof window === "undefined") return [];
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Persists AI keys array to browser localStorage.
 *
 * @param keys - Array of AIKey objects to store
 */
function saveKeys(keys: AIKey[]): void {
  try {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
  } catch {}
}

/**
 * Metadata, UI labels, placeholder hints, and branding colors for each AI provider.
 */
export const PROVIDER_META: Record<
  AIProvider,
  { label: string; placeholder: string; prefix: string; color: string }
> = {
  openai: {
    label: "OpenAI",
    placeholder: "sk-proj-...",
    prefix: "sk-",
    color: "#10a37f",
  },
  anthropic: {
    label: "Claude (Anthropic)",
    placeholder: "sk-ant-...",
    prefix: "sk-ant-",
    color: "#c96b3f",
  },
  google: {
    label: "Gemini (Google)",
    placeholder: "AIza...",
    prefix: "AIza",
    color: "#4285F4",
  },
};

/**
 * Masks an API key for safe UI display (e.g. `sk-pro••••••••••3f9a`).
 *
 * @param key - Raw API key string
 * @returns Masked representation string
 */
export function maskKey(key: string): string {
  if (key.length <= 10) return "••••••••••";
  return `${key.slice(0, 6)}••••••••••${key.slice(-4)}`;
}

/**
 * Global TanStack Store instance holding AI configuration state.
 */
export const aiStore = new Store<AIState>({
  keys: loadKeys(),
  pendingPrompt: "",
});

/**
 * Sets the active pending AI generation prompt in the store.
 *
 * @param prompt - Prompt string input from the user
 */
export function setPrompt(prompt: string): void {
  aiStore.setState((s) => ({ ...s, pendingPrompt: prompt }));
}

/**
 * Stores or updates an API key for a specified provider.
 *
 * @param provider - Target AI provider service
 * @param key - API secret key
 */
export function addKey(provider: AIProvider, key: string): void {
  const keys = aiStore.state.keys.filter((k) => k.provider !== provider);
  const nextKeys = [...keys, { provider, key, addedAt: new Date().toISOString() }];
  saveKeys(nextKeys);
  aiStore.setState((s) => ({ ...s, keys: nextKeys }));
}

/**
 * Removes the configured API key for a given provider.
 *
 * @param provider - Target AI provider to remove
 */
export function removeKey(provider: AIProvider): void {
  const nextKeys = aiStore.state.keys.filter((k) => k.provider !== provider);
  saveKeys(nextKeys);
  aiStore.setState((s) => ({ ...s, keys: nextKeys }));
}

/**
 * Retrieves the stored API key record for a given provider.
 *
 * @param provider - Provider to query
 * @returns The matching AIKey or undefined
 */
export function getKeyForProvider(provider: AIProvider): AIKey | undefined {
  return aiStore.state.keys.find((k) => k.provider === provider);
}

/**
 * React hook providing reactive access to configured AI keys and key management actions.
 *
 * @returns Object with keys array, add action, remove action, and hasAny flag
 */
export function useAIKeys() {
  const [keys, setKeys] = useState<AIKey[]>(aiStore.state.keys);

  useEffect(() => {
    const sub = aiStore.subscribe(() => {
      setKeys(aiStore.state.keys);
    });
    return () => sub.unsubscribe();
  }, []);

  return { 
    keys, 
    add: addKey, 
    remove: removeKey, 
    hasAny: keys.length > 0 
  };
}

/**
 * React hook providing reactive access and setter for the pending AI prompt.
 *
 * @returns Object with prompt state and setPrompt updater
 */
export function useAIPrompt() {
  const [prompt, setPromptState] = useState(aiStore.state.pendingPrompt);

  useEffect(() => {
    const sub = aiStore.subscribe(() => {
      setPromptState(aiStore.state.pendingPrompt);
    });
    return () => sub.unsubscribe();
  }, []);

  return { prompt, setPrompt };
}
