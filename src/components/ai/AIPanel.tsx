import * as React from "react";
import {
  IconX,
  IconSparkles,
  IconSend,
  IconBulb,
  IconSitemap,
  IconMessageQuestion,
  IconListDetails,
  IconChevronRight,
  IconLoader2,
  IconAlertCircle,
  IconCheck,
  IconRefresh,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import {
  useAIKeys,
  useAIPrompt,
  PROVIDER_META,
  type AIProvider,
} from "../../store/ai.store";
import { callAI } from "../../lib/ai.service";
import {
  ARCHITECTURE_SYSTEM_PROMPT,
  C4_SYSTEM_PROMPT,
} from "../../lib/ai.prompts";
import { setDiagramFromAI, useCanvasStore } from "../../store/canvas.store";
import type { DiagramNode, DiagramEdge, NodeMeta } from "../../types/diagram";
import { MarkerType } from "@xyflow/react";
import { Button } from "../ui/button";

//  Type from AI JSON output

interface AINode {
  id: string;
  subtype: string;
  label: string;
  description: string;
  x: number;
  y: number;
}

interface AIEdge {
  source: string;
  target: string;
  label: string;
}

interface AIGraphResult {
  nodes: AINode[];
  edges: AIEdge[];
}

//  Icon map for subtypes

const SUBTYPE_ICON: Record<string, string> = {
  "api-gateway": "IconApi",
  service: "IconBox",
  "message-queue": "IconStack2",
  "load-balancer": "IconArrowsSplit2",
  ec2: "IconServer",
  s3: "IconBucket",
  cdn: "IconWorld",
  lambda: "IconBolt",
  postgres: "IconDatabase",
  redis: "IconCpu",
  mongo: "IconLeaf",
  elasticsearch: "IconZoomCode",
  "web-app": "IconBrowser",
  mobile: "IconDeviceMobile",
  component: "IconLayoutGrid",
  bff: "IconPlugConnected",
  "c4-person": "IconUser",
  "c4-system": "IconBox",
  "c4-container": "IconStack2",
  "c4-component": "IconPuzzle",
};

const SUBTYPE_CATEGORY: Record<string, string> = {
  "api-gateway": "microservice",
  service: "microservice",
  "message-queue": "microservice",
  "load-balancer": "microservice",
  ec2: "cloud",
  s3: "cloud",
  cdn: "cloud",
  lambda: "cloud",
  postgres: "database",
  redis: "database",
  mongo: "database",
  elasticsearch: "database",
  "web-app": "frontend",
  mobile: "frontend",
  component: "frontend",
  bff: "frontend",
  "c4-person": "c4",
  "c4-system": "c4",
  "c4-container": "c4",
  "c4-component": "c4",
};

//  Parse AI JSON response

function parseAIResponse(raw: string): AIGraphResult {
  // strip markdown fences if model misbehaves
  const cleaned = raw
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();
  const parsed = JSON.parse(cleaned);
  if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
    throw new Error("AI response missing nodes or edges array");
  }
  return parsed as AIGraphResult;
}

//  Convert AI output to canvas types

function toCanvasNodes(
  aiNodes: AINode[],
  mode: "architecture" | "c4",
): DiagramNode[] {
  return aiNodes.map((n) => {
    const subtype = n.subtype.toLowerCase();
    const category = (SUBTYPE_CATEGORY[subtype] ??
      (mode === "c4" ? "c4" : "microservice")) as NodeMeta["category"];
    const icon = SUBTYPE_ICON[subtype] ?? "IconBox";
    return {
      id: n.id,
      type: "diagramNode",
      position: { x: n.x, y: n.y },
      data: {
        subtype,
        label: n.label,
        description: n.description,
        category,
        icon,
      } as NodeMeta,
    };
  });
}

function toCanvasEdges(
  aiEdges: AIEdge[],
  mode: "architecture" | "c4",
): DiagramEdge[] {
  return aiEdges.map((e, i) => ({
    id: `ai-e-${i + 1}`,
    source: e.source,
    target: e.target,
    type: "smoothstep",
    label: e.label || undefined,
    data: mode === "c4" ? { label: e.label } : {},
    style: { stroke: "var(--border)", strokeWidth: 1.5 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "var(--border)" },
  }));
}

//  Prompt suggestions

const ARCH_SUGGESTIONS = [
  {
    icon: IconSitemap,
    label: "E-commerce microservices",
    prompt:
      "Design an e-commerce system with product catalog, cart, checkout, payment, and order services",
  },
  {
    icon: IconListDetails,
    label: "Real-time chat app",
    prompt:
      "Design a real-time chat application with WebSocket, message queue, and presence service",
  },
  {
    icon: IconBulb,
    label: "API-first SaaS backend",
    prompt:
      "Design an API-first SaaS backend with authentication, billing, multi-tenancy, and webhooks",
  },
  {
    icon: IconMessageQuestion,
    label: "Data pipeline",
    prompt:
      "Design a data ingestion pipeline with Kafka, stream processing, and analytics storage",
  },
];

const C4_SUGGESTIONS = [
  {
    icon: IconSitemap,
    label: "Online banking system",
    prompt:
      "Create a C4 model for an online banking system with customers, mobile app, web portal, and backend services",
  },
  {
    icon: IconListDetails,
    label: "SaaS platform",
    prompt:
      "Create a C4 model for a SaaS project management platform with web app, API, database, and email service",
  },
  {
    icon: IconBulb,
    label: "Healthcare system",
    prompt:
      "Create a C4 model for a healthcare system with patients, doctors, appointment service, and EHR",
  },
  {
    icon: IconMessageQuestion,
    label: "IoT platform",
    prompt:
      "Create a C4 model for an IoT platform with devices, MQTT broker, device registry, and dashboard",
  },
];

//  Status types

type Status = "idle" | "loading" | "success" | "error";

interface AIPanelProps {
  onClose: () => void;
}

//  Component

export default function AIPanel({ onClose }: AIPanelProps) {
  const { keys } = useAIKeys();
  const { prompt: sharedPrompt, setPrompt: setSharedPrompt } = useAIPrompt();
  const diagramMode = useCanvasStore((s) => s.diagramMode);
  const [prompt, setPrompt] = React.useState("");
  const [selectedProvider, setSelectedProvider] =
    React.useState<AIProvider | null>(null);
  const [status, setStatus] = React.useState<Status>("idle");
  const [errorMsg, setErrorMsg] = React.useState("");
  const [lastPrompt, setLastPrompt] = React.useState("");
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const isC4 = diagramMode === "c4";
  const suggestions = isC4 ? C4_SUGGESTIONS : ARCH_SUGGESTIONS;

  // Auto-select first available provider
  React.useEffect(() => {
    if (keys.length > 0 && !selectedProvider) {
      setSelectedProvider(keys[0].provider);
    }
  }, [keys, selectedProvider]);

  // Sync with shared prompt from templates
  React.useEffect(() => {
    if (sharedPrompt) {
      setPrompt(sharedPrompt);
      setSharedPrompt(""); // Clear once consumed
      textareaRef.current?.focus();
    }
  }, [sharedPrompt]);

  const canSend =
    prompt.trim().length > 0 && !!selectedProvider && status !== "loading";

  const handleSend = async (overridePrompt?: string) => {
    const text = (overridePrompt ?? prompt).trim();
    if (!text || !selectedProvider) return;

    setStatus("loading");
    setErrorMsg("");
    setLastPrompt(text);
    setPrompt("");

    try {
      const systemPrompt = isC4 ? C4_SYSTEM_PROMPT : ARCHITECTURE_SYSTEM_PROMPT;
      const response = await callAI(selectedProvider, [
        { role: "system", content: systemPrompt },
        { role: "user", content: text },
      ]);

      const result = parseAIResponse(response.content);
      const nodes = toCanvasNodes(result.nodes, diagramMode);
      const edges = toCanvasEdges(result.edges, diagramMode);

      setDiagramFromAI(nodes, edges);
      setStatus("success");
    } catch (err: any) {
      console.log(err);
      setErrorMsg(err?.message ?? "Unknown error");
      setStatus("error");
    }
  };

  const handleRetry = () => {
    setPrompt(lastPrompt);
    setStatus("idle");
  };

  return (
    <div
      className="flex flex-col bg-card border border-border rounded-[--radius] shadow-2xl w-[400px] overflow-hidden animate-in slide-in-from-left-4 fade-in duration-300"
      style={{
        boxShadow: "0 8px 40px rgba(0,0,0,0.12)",
        maxHeight: "calc(100vh - 96px)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-primary/10 rounded-md">
            <IconSparkles size={16} className="text-primary" stroke={1.8} />
          </div>
          <div>
            <h3 className="text-[13px] font-bold tracking-tight">
              AI Assistant
            </h3>
            <p className="text-[10px] text-muted-foreground leading-none mt-0.5">
              {isC4 ? "C4 Model" : "Architecture"} mode
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Button onClick={onClose} variant="outline" size="icon">
            <IconX size={14} />
          </Button>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex flex-col gap-3 p-4 flex-1 overflow-y-auto">
        {/* Provider selector — always visible */}
        {keys.length > 0 && (
          <div className="flex gap-1 p-1 bg-muted/40 rounded-xs border border-border/50">
            {keys.map((k) => {
              const meta = PROVIDER_META[k.provider];
              const isActive = selectedProvider === k.provider;
              return (
                <button
                  key={k.provider}
                  onClick={() => setSelectedProvider(k.provider)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-[11px] font-medium transition-all",
                    isActive
                      ? "bg-card text-foreground shadow-sm border border-border/60"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                  )}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: meta.color }}
                  />
                  {meta.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Prompt input */}
        <div className="relative rounded-[--radius] border border-border bg-muted/20 focus-within:border-primary focus-within:ring-[1px] focus-within:ring-primary/20 transition-all">
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={status === "loading"}
            placeholder={
              isC4
                ? "Describe your system… (e.g. 'Online banking with mobile app and backend')"
                : "Describe your architecture… (e.g. 'Chat app with WebSocket and Redis')"
            }
            rows={3}
            className="w-full resize-none bg-transparent px-3 pt-3 pb-2 text-[13px] placeholder:text-muted-foreground outline-none leading-relaxed font-sans disabled:opacity-50"
          />
          <div className="flex items-center justify-end gap-1.5 px-2 pb-2">
            <button
              onClick={() => handleSend()}
              disabled={!canSend}
              className={cn(
                "p-1.5 rounded-md transition-all",
                canSend
                  ? "bg-primary text-white hover:bg-primary/90"
                  : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed",
              )}
            >
              {status === "loading" ? (
                <IconLoader2 size={14} className="animate-spin" />
              ) : (
                <IconSend size={14} />
              )}
            </button>
          </div>
        </div>

        {/* Status feedback */}
        {status === "loading" && (
          <div className="flex items-center gap-2.5 px-3 py-2.5 bg-primary/5 border border-primary/10 rounded-xs text-[11.5px]">
            <IconLoader2
              size={14}
              className="animate-spin text-primary shrink-0"
            />
            <div>
              <div className="font-semibold text-primary">
                Generating diagram…
              </div>
              <div className="text-muted-foreground text-[10px]">
                AI is designing your {isC4 ? "C4 model" : "architecture"}
              </div>
            </div>
          </div>
        )}

        {status === "success" && (
          <div className="flex items-center gap-2.5 px-3 py-2.5 bg-green-500/8 border border-green-500/20 rounded-xs text-[11.5px]">
            <IconCheck size={14} className="text-green-500 shrink-0" />
            <div className="flex-1">
              <div className="font-semibold text-green-600 dark:text-green-400">
                Diagram generated!
              </div>
              <div className="text-muted-foreground text-[10px]">
                Canvas updated. Use Ctrl+Z to undo.
              </div>
            </div>

            <Button
              onClick={() => {
                setStatus("idle");
                setPrompt(lastPrompt);
              }}
              icon={<IconRefresh size={11} />}
              variant="outline"
              size="sm"
            />
          </div>
        )}

        {status === "error" && (
          <div className="flex items-start gap-2.5 px-3 py-2.5 bg-destructive/8 border border-destructive/20 rounded-xs text-[11.5px]">
            <IconAlertCircle
              size={14}
              className="text-destructive shrink-0 mt-0.5"
            />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-destructive">
                Generation failed
              </div>
              <div className="text-muted-foreground text-[10px] mt-0.5 truncate">
                {errorMsg}
              </div>
            </div>
            <Button
              onClick={handleRetry}
              icon={<IconRefresh size={11} />}
              variant="outline"
              size="sm"
            />
          </div>
        )}

        {/* Suggestions */}
        {status === "idle" && (
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
              Things you can try
            </p>
            <div className="space-y-1">
              {suggestions.map((s) => (
                <button
                  key={s.label}
                  onClick={() => {
                    setPrompt(s.prompt);
                    textareaRef.current?.focus();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[--radius] hover:bg-muted/60 text-left transition-colors group"
                >
                  <div className="p-1.5 bg-muted rounded-md shrink-0 group-hover:bg-primary/10 transition-colors">
                    <s.icon
                      size={14}
                      className="text-muted-foreground group-hover:text-primary transition-colors"
                      stroke={1.5}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[12px] font-medium text-foreground leading-tight">
                      {s.label}
                    </div>
                    <div className="text-[10px] text-muted-foreground leading-tight mt-0.5 truncate">
                      {s.prompt}
                    </div>
                  </div>
                  <IconChevronRight
                    size={12}
                    className="text-muted-foreground/40 ml-auto shrink-0"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border/40 bg-muted/20 shrink-0">
        <p className="text-[9px] text-muted-foreground/60 leading-relaxed">
          Your API key is stored locally and never sent to our servers. Requests
          go directly from your browser to the AI provider.
        </p>
      </div>
    </div>
  );
}
