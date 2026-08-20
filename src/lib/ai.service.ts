/**
 * @fileoverview AI integration service supporting OpenAI, Anthropic, and Google Gemini.
 * Dispatches prompt requests to appropriate provider endpoints with JSON response enforcement.
 */

import type { AIProvider } from "@/store/ai.store";
import { getKeyForProvider } from "@/store/ai.store";

/**
 * Chat completion message structure.
 */
export interface AIMessage {
  /** Role of the message author */
  role: "user" | "assistant" | "system";
  /** Text content of the message */
  content: string;
}

/**
 * Standardized AI completion response.
 */
export interface AIResponse {
  /** Raw text content returned by the model */
  content: string;
  /** Optional error message if the call failed */
  error?: string;
}

/**
 * Parses API error messages from failed HTTP response objects.
 *
 * @param res - Fetch response object
 * @param prefix - Provider name for error context
 * @returns Human-readable formatted error message
 */
async function extractError(res: Response, prefix: string): Promise<string> {
  try {
    const body = await res.json();
    const msg =
      body?.error?.message ??
      body?.message ??
      body?.error ??
      JSON.stringify(body);
    return `${prefix} (${res.status}): ${msg}`;
  } catch {
    return `${prefix} (${res.status}): ${res.statusText}`;
  }
}

/**
 * Executes a completion request against the OpenAI API.
 *
 * @param key - OpenAI API secret key
 * @param messages - Ordered prompt conversation history
 * @returns Model response with JSON content
 */
async function callOpenAI(
  key: string,
  messages: Array<AIMessage>,
): Promise<AIResponse> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages,
      temperature: 0.3,
      max_tokens: 4096,
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) throw new Error(await extractError(res, "OpenAI"));
  const data = await res.json();
  return { content: data.choices[0].message.content };
}

/**
 * Executes a completion request against the Anthropic Messages API.
 *
 * @param key - Anthropic API key
 * @param messages - Ordered prompt conversation history
 * @returns Model response text
 */
async function callAnthropic(
  key: string,
  messages: Array<AIMessage>,
): Promise<AIResponse> {
  const systemMsg = messages.find((m) => m.role === "system")?.content ?? "";
  const userMsgs = messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

  if (userMsgs.length === 0) throw new Error("No user message provided");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-3-5-haiku-latest",
      system: systemMsg,
      messages: userMsgs,
      max_tokens: 4096,
    }),
  });
  if (!res.ok) throw new Error(await extractError(res, "Anthropic"));
  const data = await res.json();
  return { content: data.content[0].text };
}

/**
 * Executes a completion request against the Google Gemini API.
 *
 * @param key - Google AI Studio API key
 * @param messages - Ordered prompt conversation history
 * @returns Model response text
 */
async function callGemini(
  key: string,
  messages: Array<AIMessage>,
): Promise<AIResponse> {
  const systemMsg = messages.find((m) => m.role === "system")?.content ?? "";
  const userMsgs = messages.filter(
    (m) => m.role === "user" || m.role === "assistant",
  );

  const contents = userMsgs.map((m) => ({
    role: m.role === "user" ? "user" : "model",
    parts: [{ text: m.content }],
  }));

  const model = "gemini-2.5-pro";

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemMsg }] },
        contents,
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 8192,
          responseMimeType: "application/json",
        },
      }),
    },
  );
  if (!res.ok) throw new Error(await extractError(res, "Gemini"));
  const data = await res.json();

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    const reason = data?.candidates?.[0]?.finishReason ?? "unknown";
    throw new Error(`Gemini returned no content (finishReason: ${reason})`);
  }
  return { content: text };
}

/**
 * Main dispatcher to execute AI requests with the configured provider.
 *
 * @param provider - AI provider service identifier ('openai' | 'anthropic' | 'google')
 * @param messages - Prompt conversation history
 * @returns Standardized AI response containing output text
 * @throws Error if provider credentials are not found or request fails
 */
export async function callAI(
  provider: AIProvider,
  messages: Array<AIMessage>,
): Promise<AIResponse> {
  const keyRecord = getKeyForProvider(provider);
  if (!keyRecord) throw new Error(`No API key configured for ${provider}`);

  switch (provider) {
    case "openai":
      return callOpenAI(keyRecord.key, messages);
    case "anthropic":
      return callAnthropic(keyRecord.key, messages);
    case "google":
      return callGemini(keyRecord.key, messages);
  }
}
