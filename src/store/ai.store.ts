/**
 * @fileoverview TanStack Store for managing local AI provider keys, prompt state,
 * chat drawer visibility, and message history.
 * Encapsulates localStorage persistence and custom React subscription hooks.
 */

import { Store } from "@tanstack/store";
import { useEffect, useState } from "react";

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
 * Single AI Chat message entity in conversational history.
 */
export interface AIChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  toolSteps?: Array<string>;
  diagramGenerated?: {
    nodeCount: number;
    edgeCount: number;
    title?: string;
    summary?: string;
  };
}

/**
 * Latest 2026 models per provider (all accessed via OpenAI-compatible Chat Completions endpoints).
 * First entry per provider is the default.
 */
export const PROVIDER_MODELS: Record<
  AIProvider,
  Array<{ id: string; label: string }>
> = {
  openai: [
    { id: "gpt-6.2-sol", label: "GPT-6.2 Sol" },
    { id: "gpt-6.2-astra", label: "GPT-6.2 Astra" },
    { id: "gpt-6-luna", label: "GPT-6 Luna" },
  ],
  anthropic: [
    { id: "claude-sonnet-5-5", label: "Claude Sonnet 5.5" },
    { id: "claude-opus-5-5", label: "Claude Opus 5.5" },
    { id: "claude-haiku-5-5", label: "Claude Haiku 5.5" },
  ],
  google: [
    { id: "gemini-4-argon", label: "Gemini 4 Argon" },
    { id: "gemini-4-carbon", label: "Gemini 4 Carbon" },
    { id: "gemini-4-hydrogen", label: "Gemini 4 Hydrogen" },
    { id: "gemini-3.8-flash", label: "Gemini 3.8 Flash" },
  ],
};

/**
 * Internal state for the AI store.
 */
interface AIState {
  /** Collection of configured provider keys */
  keys: Array<AIKey>;
  /** Selected model ID per provider */
  selectedModels: Record<AIProvider, string>;
  /** Pending user prompt in the UI */
  pendingPrompt: string;
  /** Whether the AI chat drawer is currently open */
  isDrawerOpen: boolean;
  /** List of chat messages in the active session */
  messages: Array<AIChatMessage>;
}

const STORAGE_KEY = "sysdesign-ai-keys";
const MODELS_STORAGE_KEY = "sysdesign-ai-models";

function defaultSelectedModels(): Record<AIProvider, string> {
  return {
    openai: PROVIDER_MODELS.openai[0].id,
    anthropic: PROVIDER_MODELS.anthropic[0].id,
    google: PROVIDER_MODELS.google[0].id,
  };
}

function loadSelectedModels(): Record<AIProvider, string> {
  const defaults = defaultSelectedModels();
  try {
    if (typeof window === "undefined") return defaults;
    const raw = localStorage.getItem(MODELS_STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<Record<AIProvider, string>>;
    const validated: Record<AIProvider, string> = { ...defaults };
    (["openai", "anthropic", "google"] as Array<AIProvider>).forEach((p) => {
      const candidate = parsed[p];
      if (candidate && PROVIDER_MODELS[p].some((m) => m.id === candidate)) {
        validated[p] = candidate;
      }
    });
    return validated;
  } catch {
    return defaults;
  }
}

function saveSelectedModels(models: Record<AIProvider, string>): void {
  try {
    if (typeof window === "undefined") return;
    localStorage.setItem(MODELS_STORAGE_KEY, JSON.stringify(models));
  } catch {}
}

/**
 * Loads persisted AI keys from browser localStorage.
 *
 * @returns Array of stored AIKey objects
 */
function loadKeys(): Array<AIKey> {
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
function saveKeys(keys: Array<AIKey>): void {
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
  selectedModels: loadSelectedModels(),
  pendingPrompt: "",
  isDrawerOpen: false,
  messages: [],
});

export function getSelectedModelForProvider(provider: AIProvider): string {
  return (
    aiStore.state.selectedModels[provider] || PROVIDER_MODELS[provider][0].id
  );
}

export function setSelectedModelForProvider(
  provider: AIProvider,
  modelId: string,
): void {
  const nextModels = { ...aiStore.state.selectedModels, [provider]: modelId };
  saveSelectedModels(nextModels);
  aiStore.setState((s) => ({ ...s, selectedModels: nextModels }));
}

export function useAIModels() {
  const [selectedModels, setModels] = useState<Record<AIProvider, string>>(
    aiStore.state.selectedModels,
  );

  useEffect(() => {
    const sub = aiStore.subscribe(() => {
      setModels(aiStore.state.selectedModels);
    });
    return () => sub.unsubscribe();
  }, []);

  return {
    selectedModels,
    setModel: setSelectedModelForProvider,
  };
}

/**
 * Sets the active pending AI generation prompt in the store.
 *
 * @param prompt - Prompt string input from the user
 */
export function setPrompt(prompt: string): void {
  aiStore.setState((s) => ({ ...s, pendingPrompt: prompt }));
}

/**
 * Sets the drawer open/close state.
 */
export function setAIDrawerOpen(open: boolean): void {
  aiStore.setState((s) => ({ ...s, isDrawerOpen: open }));
}

/**
 * Toggles the AI drawer open/close state.
 */
export function toggleAIDrawer(): void {
  aiStore.setState((s) => ({ ...s, isDrawerOpen: !s.isDrawerOpen }));
}

/**
 * Appends a new message to the chat history.
 */
export function addChatMessage(msg: Omit<AIChatMessage, "id" | "timestamp"> & { id?: string; timestamp?: number }): void {
  const newMsg: AIChatMessage = {
    id: msg.id || `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: msg.timestamp || Date.now(),
    role: msg.role,
    content: msg.content,
    toolSteps: msg.toolSteps,
    diagramGenerated: msg.diagramGenerated,
  };
  aiStore.setState((s) => ({
    ...s,
    messages: [...s.messages, newMsg],
  }));
}

/**
 * Clears all chat messages from store.
 */
export function clearChatMessages(): void {
  aiStore.setState((s) => ({ ...s, messages: [] }));
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
  const [keys, setKeys] = useState<Array<AIKey>>(aiStore.state.keys);

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

const openAIDrawer = () => setAIDrawerOpen(true);
const closeAIDrawer = () => setAIDrawerOpen(false);

/**
 * React hook providing reactive access to AI drawer visibility state.
 */
export function useAIDrawer() {
  const [isOpen, setIsOpen] = useState(aiStore.state.isDrawerOpen);

  useEffect(() => {
    const sub = aiStore.subscribe(() => {
      setIsOpen(aiStore.state.isDrawerOpen);
    });
    return () => sub.unsubscribe();
  }, []);

  return {
    isOpen,
    open: openAIDrawer,
    close: closeAIDrawer,
    toggle: toggleAIDrawer,
    setOpen: setAIDrawerOpen,
  };
}

/**
 * React hook providing reactive access to chat history.
 */
export function useAIChatMessages() {
  const [messages, setMessages] = useState<Array<AIChatMessage>>(aiStore.state.messages);

  useEffect(() => {
    const sub = aiStore.subscribe(() => {
      setMessages(aiStore.state.messages);
    });
    return () => sub.unsubscribe();
  }, []);

  return {
    messages,
    addMessage: addChatMessage,
    clearMessages: clearChatMessages,
  };
}
