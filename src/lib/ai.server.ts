/**
 * @fileoverview TanStack Start server function powering the SysDesign AI Architect.
 * Runs Vercel AI SDK multi-step tool calling on the server (avoiding browser CORS issues)
 * using the user's per-request BYOK API key (never stored on the server).
 */

import { createServerFn } from "@tanstack/react-start";
import { generateText, stepCountIs, tool } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { buildArchitectSystemPrompt } from "@/lib/ai.prompts";
import { searchRegistry } from "@/lib/ai.registry";
import {
  addElementsInputSchema,
  groupNodesInputSchema,
  lookupComponentsInputSchema,
  removeElementsInputSchema,
  replaceDiagramInputSchema,
  updateElementsInputSchema,
} from "@/lib/ai.tools";
import type { AICanvasOperation } from "@/lib/ai.tools";
import type { SerializedCanvasContext } from "@/lib/ai.context";
import type { AIProvider } from "@/store/ai.store";

export interface RunAIArchitectInput {
  provider: AIProvider;
  modelId: string;
  apiKey: string;
  canvas: SerializedCanvasContext;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
}

export interface RunAIArchitectOutput {
  text: string;
  operations: Array<AICanvasOperation>;
  toolSteps: Array<string>;
}

function resolveModel(provider: AIProvider, modelId: string, apiKey: string) {
  switch (provider) {
    case "openai": {
      const openai = createOpenAI({ apiKey });
      return openai(modelId);
    }
    case "anthropic": {
      const anthropic = createAnthropic({ apiKey });
      return anthropic(modelId);
    }
    case "google": {
      const google = createGoogleGenerativeAI({ apiKey });
      return google(modelId);
    }
  }
}

/**
 * Server-side AI Architect runner supporting multi-step registry lookup and surgical canvas tools.
 */
export const runAIArchitect = createServerFn({ method: "POST" })
  .inputValidator((data: RunAIArchitectInput) => data)
  .handler(async ({ data }): Promise<RunAIArchitectOutput> => {
    const { provider, modelId, apiKey, canvas, messages } = data;

    if (!apiKey || !apiKey.trim()) {
      throw new Error(`Missing API key for ${provider}`);
    }

    const operations: Array<AICanvasOperation> = [];
    const toolSteps: Array<string> = [];

    const model = resolveModel(provider, modelId, apiKey.trim());
    const system = buildArchitectSystemPrompt(canvas);

    const result = await generateText({
      model,
      system,
      messages,
      temperature: 0.3,
      stopWhen: stepCountIs(5),
      tools: {
        lookup_components: tool({
          description:
            "Search the verified SysDesign component registry (AWS, GCP, Azure, databases, security, AI/ML, networking, observability) to find exact subtypes before creating nodes.",
          inputSchema: lookupComponentsInputSchema,
          execute: async ({ query, category }) => {
            const matches = searchRegistry(query, category, 16);
            toolSteps.push(`Looked up "${query}" (${matches.length} matches)`);
            return { matches };
          },
        }),

        replace_diagram: tool({
          description:
            "Generate a complete new architecture or C4 diagram from scratch, replacing the canvas. Layout is automatically computed with Dagre.",
          inputSchema: replaceDiagramInputSchema,
          execute: async (input) => {
            operations.push({ type: "replace_diagram", input });
            toolSteps.push(
              `Designed ${input.nodes.length} nodes & ${input.edges.length} connections`,
            );
            return {
              ok: true,
              nodeCount: input.nodes.length,
              edgeCount: input.edges.length,
            };
          },
        }),

        add_elements: tool({
          description:
            "Incrementally add new nodes and/or connections to the existing canvas without erasing existing elements.",
          inputSchema: addElementsInputSchema,
          execute: async (input) => {
            operations.push({ type: "add_elements", input });
            toolSteps.push(
              `Added ${input.nodes.length} node${input.nodes.length === 1 ? "" : "s"} & ${input.edges.length} connection${input.edges.length === 1 ? "" : "s"}`,
            );
            return {
              ok: true,
              addedNodes: input.nodes.length,
              addedEdges: input.edges.length,
            };
          },
        }),

        update_elements: tool({
          description:
            "Update labels, subtypes, technology stack, status, or descriptions on existing nodes or edge labels.",
          inputSchema: updateElementsInputSchema,
          execute: async (input) => {
            operations.push({ type: "update_elements", input });
            const total = input.nodes.length + input.edges.length;
            toolSteps.push(`Updated ${total} element${total === 1 ? "" : "s"}`);
            return { ok: true, updated: total };
          },
        }),

        remove_elements: tool({
          description:
            "Delete specific node IDs or edge IDs from the current canvas.",
          inputSchema: removeElementsInputSchema,
          execute: async (input) => {
            operations.push({ type: "remove_elements", input });
            toolSteps.push(
              `Removed ${input.nodeIds.length} node${input.nodeIds.length === 1 ? "" : "s"} & ${input.edgeIds.length} edge${input.edgeIds.length === 1 ? "" : "s"}`,
            );
            return { ok: true };
          },
        }),

        group_nodes: tool({
          description:
            "Group 2 or more existing node IDs inside a labeled architectural boundary or VPC.",
          inputSchema: groupNodesInputSchema,
          execute: async (input) => {
            operations.push({ type: "group_nodes", input });
            toolSteps.push(`Grouped "${input.label}"`);
            return { ok: true };
          },
        }),
      },
    });

    const fallbackText =
      operations.length > 0
        ? "Updated the canvas with the requested architecture changes."
        : "I couldn't produce a response for that request. Try rephrasing or being more specific.";

    return {
      text: result.text.trim() || fallbackText,
      operations,
      toolSteps,
    };
  });
