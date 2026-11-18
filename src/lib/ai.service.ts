/**
 * @fileoverview Client-facing AI service invoking the TanStack Start RPC function
 * with live canvas context, conversation history, and selected provider/model.
 */

import { runAIArchitect } from "@/lib/ai.rpc";
import type { RunAIArchitectOutput } from "@/lib/ai.rpc";
import type { SerializedCanvasContext } from "@/lib/ai.context";
import {
  getKeyForProvider,
  getSelectedModelForProvider,
} from "@/store/ai.store";
import type { AIProvider } from "@/store/ai.store";

export interface AIMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * Dispatches an architectural prompt + live canvas snapshot to the AI Architect RPC.
 */
export async function callAIArchitect(params: {
  provider: AIProvider;
  modelId?: string;
  canvas: SerializedCanvasContext;
  messages: Array<AIMessage>;
}): Promise<RunAIArchitectOutput> {
  const keyRecord = getKeyForProvider(params.provider);
  if (!keyRecord) {
    throw new Error(`No API key configured for ${params.provider}`);
  }

  const modelId =
    params.modelId || getSelectedModelForProvider(params.provider);

  return runAIArchitect({
    data: {
      provider: params.provider,
      modelId,
      apiKey: keyRecord.key,
      canvas: params.canvas,
      messages: params.messages,
    },
  });
}
