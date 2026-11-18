/**
 * @fileoverview Nordic AI Architecture Assistant drawer.
 * Connects to the TanStack Start AI server function with live canvas context,
 * multi-step registry lookup, surgical canvas tools, model switching, and one-click undo.
 */

import * as React from "react";
import { useReactFlow } from "@xyflow/react";
import {
  IconAlertCircle,
  IconArrowBackUp,
  IconArrowUp,
  IconBulb,
  IconCheck,
  IconChevronDown,
  IconChevronRight,
  IconKey,
  IconLayout,
  IconListDetails,
  IconLoader2,
  IconMessageQuestion,
  IconRefresh,
  IconShieldLock,
  IconSitemap,
  IconSparkles,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  PROVIDER_META,
  PROVIDER_MODELS,
  useAIChatMessages,
  useAIDrawer,
  useAIKeys,
  useAIModels,
  useAIPrompt,
} from "@/store/ai.store";
import type { AIProvider } from "@/store/ai.store";
import { callAIArchitect } from "@/lib/ai.service";
import { serializeCanvasContext } from "@/lib/ai.context";
import { applyAIOperationsToCanvas } from "@/lib/ai.tools";
import { undo, useCanvasStore } from "@/store/canvas.store";
import AISettings from "@/components/ai/AISettings";
import { Loader } from "@/components/ui/loader";
import { Textarea } from "@/components/ui/textarea";
import type { AutosizeTextAreaRef } from "@/components/ui/textarea";

const ARCH_SUGGESTIONS = [
  {
    icon: IconSitemap,
    label: "E-commerce Microservices",
    prompt:
      "Design an e-commerce system on AWS with API Gateway, product catalog, checkout, payment worker, SQS queue, PostgreSQL, and Redis cache.",
  },
  {
    icon: IconListDetails,
    label: "Real-time Chat Architecture",
    prompt:
      "Design a scalable real-time chat application with WebSocket gateway, Kafka event stream, presence service, MongoDB, and Redis pub/sub.",
  },
  {
    icon: IconBulb,
    label: "API-First SaaS Platform",
    prompt:
      "Design a multi-tenant SaaS backend with CDN, WAF, API gateway, OAuth auth service, billing microservice, background workers, and PostgreSQL.",
  },
  {
    icon: IconMessageQuestion,
    label: "Streaming Data Pipeline",
    prompt:
      "Design a high-throughput data ingestion pipeline with Kafka, stream processing workers, Elasticsearch search index, and S3 data lake.",
  },
];

const C4_SUGGESTIONS = [
  {
    icon: IconSitemap,
    label: "Online Banking System",
    prompt:
      "Create a C4 model for an online banking platform with customer web portal, mobile app, API gateway, core banking system, and database.",
  },
  {
    icon: IconListDetails,
    label: "Healthcare EHR Platform",
    prompt:
      "Create a C4 model for an electronic healthcare records system with patient portal, doctor dashboard, appointment scheduler, and HIPAA-compliant DB.",
  },
  {
    icon: IconBulb,
    label: "IoT Telemetry Platform",
    prompt:
      "Create a C4 model for an IoT device management system with MQTT broker, device registry, time-series data storage, and analytics API.",
  },
  {
    icon: IconMessageQuestion,
    label: "Delivery & Logistics Hub",
    prompt:
      "Create a C4 model for a food delivery platform connecting customers, restaurant apps, rider tracking service, and external payment processor.",
  },
];

type Status = "idle" | "loading" | "success" | "error";

export default function AIChatDrawer() {
  const { fitView } = useReactFlow();
  const { isOpen, close } = useAIDrawer();
  const { keys, hasAny } = useAIKeys();
  const { selectedModels, setModel } = useAIModels();
  const { prompt: sharedPrompt, setPrompt: setSharedPrompt } = useAIPrompt();
  const { messages, addMessage, clearMessages } = useAIChatMessages();

  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const diagramMode = useCanvasStore((s) => s.diagramMode);
  const c4Level = useCanvasStore((s) => s.c4Level);

  const selectedCount = React.useMemo(
    () => nodes.filter((n) => n.selected).length,
    [nodes],
  );

  const [prompt, setPrompt] = React.useState("");
  const [selectedProvider, setSelectedProvider] =
    React.useState<AIProvider | null>(null);
  const [status, setStatus] = React.useState<Status>("idle");
  const [errorMsg, setErrorMsg] = React.useState("");
  const [lastPrompt, setLastPrompt] = React.useState("");
  const [showSettingsModal, setShowSettingsModal] = React.useState(false);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<AutosizeTextAreaRef>(null);

  const isC4 = diagramMode === "c4";
  const suggestions = isC4 ? C4_SUGGESTIONS : ARCH_SUGGESTIONS;

  // Auto-select first available provider
  React.useEffect(() => {
    if (keys.length > 0) {
      if (
        !selectedProvider ||
        !keys.some((k) => k.provider === selectedProvider)
      ) {
        setSelectedProvider(keys[0].provider);
      }
    } else {
      setSelectedProvider(null);
    }
  }, [keys, selectedProvider]);

  // Handle incoming shared prompt
  React.useEffect(() => {
    if (sharedPrompt) {
      setPrompt(sharedPrompt);
      setSharedPrompt("");
      if (isOpen) {
        textareaRef.current?.focus();
      }
    }
  }, [sharedPrompt, isOpen]);

  // Auto-scroll to bottom of chat
  React.useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, status, isOpen]);

  // Focus textarea when drawer opens
  React.useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 150);
    }
  }, [isOpen]);

  // Close on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !showSettingsModal) {
        close();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, showSettingsModal, close]);

  const activeModelId = selectedProvider
    ? selectedModels[selectedProvider] || PROVIDER_MODELS[selectedProvider][0].id
    : null;
  const activeModelLabel =
    selectedProvider && activeModelId
      ? PROVIDER_MODELS[selectedProvider].find((m) => m.id === activeModelId)
          ?.label ?? activeModelId
      : null;

  const canSend =
    prompt.trim().length > 0 && !!selectedProvider && status !== "loading";

  const handleSend = async (overridePrompt?: string) => {
    const text = (overridePrompt ?? prompt).trim();
    if (!text || !selectedProvider) return;

    addMessage({
      role: "user",
      content: text,
    });

    setStatus("loading");
    setErrorMsg("");
    setLastPrompt(text);
    setPrompt("");

    try {
      const canvasSnapshot = serializeCanvasContext({
        nodes,
        edges,
        diagramMode,
        c4Level,
      });

      const history = messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .slice(-8)
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));

      const response = await callAIArchitect({
        provider: selectedProvider,
        modelId: activeModelId ?? undefined,
        canvas: canvasSnapshot,
        messages: [...history, { role: "user", content: text }],
      });

      const applied = applyAIOperationsToCanvas(
        response.operations,
        diagramMode,
      );

      if (applied.shouldFitView) {
        setTimeout(
          () => fitView({ duration: 400, padding: 0.2, maxZoom: 1 }),
          60,
        );
      }

      setStatus("success");

      addMessage({
        role: "assistant",
        content: response.text,
        toolSteps:
          response.toolSteps.length > 0 ? response.toolSteps : undefined,
        diagramGenerated: applied.applied
          ? {
              nodeCount: applied.nodeCount,
              edgeCount: applied.edgeCount,
              title:
                applied.title ||
                (text.length > 36 ? text.substring(0, 36) + "…" : text),
              summary: applied.summary,
            }
          : undefined,
      });
    } catch (err: any) {
      console.error(err);
      const msg = err?.message ?? "Failed to run AI architect";
      setErrorMsg(msg);
      setStatus("error");
    }
  };

  const handleRetry = () => {
    if (lastPrompt) {
      handleSend(lastPrompt);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop overlay for mobile screens */}
      <div
        className="fixed inset-0 z-40 bg-background/50 backdrop-blur-xs sm:hidden animate-in fade-in duration-150"
        onClick={close}
      />

      {/* AI Chat Drawer Container */}
      <aside
        aria-label="AI Assistant Drawer"
        className={cn(
          "fixed right-3 top-16 bottom-16 z-50 flex flex-col w-[calc(100vw-24px)] sm:w-[368px] rounded-[20px] overflow-hidden",
          "nordic-panel",
          "animate-in slide-in-from-right duration-200",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-3.5 pb-3 border-b border-border/60 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="size-8 rounded-xl bg-muted flex items-center justify-center text-foreground/80 shrink-0">
              <IconSparkles size={15} stroke={1.6} />
            </div>
            <div className="flex flex-col min-w-0">
              <h6 className="text-[14px] font-semibold text-foreground tracking-tight leading-tight truncate">
                AI Architecture
              </h6>
              <span className="text-[11.5px] text-muted-foreground leading-tight mt-0.5">
                {isC4 ? "C4 Model Architect" : "System Design Architect"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-0.5 shrink-0">
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setShowSettingsModal(true)}
                    className="size-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                    title="AI Provider Settings"
                  >
                    <IconKey size={15} stroke={1.6} />
                  </Button>
                }
              />
              <TooltipContent side="bottom">API Keys</TooltipContent>
            </Tooltip>

            {messages.length > 0 && (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={clearMessages}
                      className="size-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      title="Clear Chat History"
                    >
                      <IconTrash size={15} stroke={1.6} />
                    </Button>
                  }
                />
                <TooltipContent side="bottom">Clear Chat</TooltipContent>
              </Tooltip>
            )}

            <Button
              variant="ghost"
              size="icon-sm"
              onClick={close}
              className="size-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              title="Close"
            >
              <IconX size={15} stroke={1.6} />
            </Button>
          </div>
        </div>

        {/* Recessed Segmented Provider Switcher */}
        {hasAny && keys.length > 1 && (
          <div className="px-4 pt-3 pb-1 shrink-0">
            <div className="flex items-center p-1 rounded-xl bg-muted/85 gap-0.5">
              {keys.map((k) => {
                const meta = PROVIDER_META[k.provider];
                const isActive = selectedProvider === k.provider;
                return (
                  <button
                    key={k.provider}
                    type="button"
                    onClick={() => setSelectedProvider(k.provider)}
                    className={cn(
                      "flex-1 h-7 rounded-lg text-[12px] font-medium transition-all cursor-pointer select-none",
                      isActive
                        ? "bg-card text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {meta.label.split(" ")[0]}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Scrollable Conversation Feed */}
        <div className="flex-1 overflow-y-auto px-4 py-3.5 space-y-3.5 custom-scrollbar">
          {/* Missing Keys Banner */}
          {!hasAny && (
            <div className="p-4 rounded-2xl bg-muted/60 border border-black/[0.04] dark:border-white/[0.06] space-y-3">
              <div className="flex items-start gap-3">
                <div className="size-8 rounded-xl bg-card flex items-center justify-center text-foreground/80 shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                  <IconKey size={15} stroke={1.6} />
                </div>
                <div className="space-y-1 min-w-0">
                  <h6 className="text-[13px] font-semibold text-foreground leading-snug">
                    Connect an AI Provider
                  </h6>
                  <p className="text-[12px] text-muted-foreground leading-relaxed">
                    Add your OpenAI, Anthropic, or Gemini key locally to
                    generate, edit, and critique architectures.
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setShowSettingsModal(true)}
                size="sm"
                className="w-full"
              >
                Configure API Keys
              </Button>
            </div>
          )}

          {/* Empty State / Suggestions */}
          {messages.length === 0 && (
            <div className="space-y-2.5">
              <span className="block text-[11.5px] font-medium text-muted-foreground px-1">
                {nodes.length > 0 ? "Try Asking" : "Suggestions"}
              </span>
              <div className="flex flex-col gap-1.5">
                {suggestions.map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => {
                      if (hasAny) {
                        handleSend(s.prompt);
                      } else {
                        setPrompt(s.prompt);
                        textareaRef.current?.focus();
                      }
                    }}
                    className="w-full flex items-start gap-3 p-3 rounded-2xl bg-muted/45 hover:bg-muted/85 text-left transition-colors group cursor-pointer"
                  >
                    <div className="size-8 rounded-xl bg-card flex items-center justify-center text-foreground/75 shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.03)] mt-0.5">
                      <s.icon size={15} stroke={1.6} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12.5px] font-semibold text-foreground leading-snug">
                        {s.label}
                      </div>
                      <div className="text-[11.5px] text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
                        {s.prompt}
                      </div>
                    </div>
                    <IconChevronRight
                      size={14}
                      stroke={1.6}
                      className="text-muted-foreground/40 group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0 mt-1"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat Messages */}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex flex-col gap-1",
                msg.role === "user" ? "items-end" : "items-start",
              )}
            >
              <div className="flex items-center gap-1.5 px-1 text-[10.5px] text-muted-foreground tabular-nums">
                <span>{msg.role === "user" ? "You" : "Architect"}</span>
                <span>·</span>
                <span>
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              <div
                className={cn(
                  "px-3.5 py-2.5 text-[12.5px] leading-relaxed max-w-[94%]",
                  msg.role === "user"
                    ? "rounded-2xl rounded-br-md bg-muted text-foreground"
                    : "rounded-2xl rounded-bl-md bg-card border border-black/[0.06] dark:border-white/[0.07] text-foreground shadow-[0_1px_4px_rgba(0,0,0,0.03)] space-y-2.5",
                )}
              >
                {/* Tool Execution Step Pills */}
                {msg.toolSteps && msg.toolSteps.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {msg.toolSteps.map((step, i) => (
                      <span
                        key={`${msg.id}-step-${i}`}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted/75 text-[10.5px] text-muted-foreground"
                      >
                        <IconCheck size={10} stroke={2} />
                        {step}
                      </span>
                    ))}
                  </div>
                )}

                <div className="whitespace-pre-wrap">{msg.content}</div>

                {/* Diagram Applied Summary Card with One-Click Revert */}
                {msg.diagramGenerated && (
                  <div className="p-2.5 rounded-xl bg-muted/65 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="size-7 rounded-lg bg-card flex items-center justify-center text-foreground/80 shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                        <IconLayout size={14} stroke={1.6} />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-foreground text-[12px] truncate leading-tight">
                          {msg.diagramGenerated.title || "Canvas Updated"}
                        </div>
                        <div className="text-[11px] text-muted-foreground tabular-nums mt-0.5 truncate">
                          {msg.diagramGenerated.summary ||
                            `${msg.diagramGenerated.nodeCount} nodes · ${msg.diagramGenerated.edgeCount} edges`}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => undo()}
                      title="Undo AI change (⌘Z)"
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-foreground/80 hover:text-foreground bg-card hover:bg-muted px-2 py-1 rounded-lg border border-black/[0.05] dark:border-white/[0.07] shrink-0 transition-colors cursor-pointer"
                    >
                      <IconArrowBackUp size={12} stroke={1.7} />
                      Revert
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Loading Indicator */}
          {status === "loading" && (
            <div className="flex flex-col gap-1 items-start">
              <span className="px-1 text-[10.5px] text-muted-foreground">
                Architect · Designing
              </span>
              <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl rounded-bl-md bg-muted/60">
                <IconLoader2
                  size={15}
                  stroke={1.8}
                  className="animate-spin text-foreground/70 shrink-0"
                />
                <span className="text-[12.5px] text-foreground/85 font-medium">
                  Designing & laying out canvas…
                </span>
              </div>
            </div>
          )}

          {/* Generation Error Callout */}
          {status === "error" && (
            <div className="p-3 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-start justify-between gap-2.5">
              <div className="flex items-start gap-2.5 min-w-0">
                <IconAlertCircle
                  size={15}
                  className="text-destructive shrink-0 mt-0.5"
                />
                <div className="min-w-0">
                  <div className="font-semibold text-destructive text-[12px]">
                    Generation Error
                  </div>
                  <div className="text-muted-foreground text-[11.5px] mt-0.5 line-clamp-3">
                    {errorMsg}
                  </div>
                </div>
              </div>
              <Button
                onClick={handleRetry}
                variant="outline"
                size="xs"
                className="shrink-0"
                icon={<IconRefresh size={12} />}
              >
                Retry
              </Button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Nordic Studio Prompt Composer */}
        <div className="p-3.5 pt-2 shrink-0 space-y-2">
          {/* Active Canvas Selection Context Pill */}
          {selectedCount > 0 && (
            <div className="flex items-center justify-between px-2.5 py-1 rounded-xl bg-muted/70 text-[11px] text-muted-foreground">
              <span>
                <strong className="font-medium text-foreground">
                  {selectedCount} {selectedCount === 1 ? "node" : "nodes"}
                </strong>{" "}
                selected — edits will target them
              </span>
            </div>
          )}

          <div className="rounded-2xl bg-muted/65 border border-black/[0.05] dark:border-white/[0.07] focus-within:bg-card focus-within:border-black/[0.12] dark:focus-within:border-white/[0.14] focus-within:shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition-all overflow-hidden">
            <Textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (canSend) handleSend();
                }
              }}
              disabled={status === "loading" || !hasAny}
              placeholder={
                !hasAny
                  ? "Configure an API key to start prompting…"
                  : nodes.length > 0
                    ? "Add a service, review bottlenecks, or redesign…"
                    : isC4
                      ? "Describe a C4 model to generate…"
                      : "Describe a system architecture…"
              }
              className="w-full resize-none border-0 shadow-none bg-transparent px-3.5 pt-3 pb-1.5 text-[13px] placeholder:text-muted-foreground/75 outline-none leading-relaxed font-sans disabled:opacity-50 focus-visible:ring-0"
            />

            <div className="flex items-center justify-between px-2.5 pb-2.5 pt-1">
              {selectedProvider && activeModelLabel ? (
                <DropdownMenu>
                  <DropdownMenuTrigger className="inline-flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-muted text-[11.5px] font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer outline-none">
                    <span>{activeModelLabel}</span>
                    <IconChevronDown size={12} stroke={1.7} />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    side="top"
                    sideOffset={6}
                    className="min-w-44 rounded-2xl p-1.5 shadow-xl border border-black/[0.06] dark:border-white/[0.08]"
                  >
                    {PROVIDER_MODELS[selectedProvider].map((m) => (
                      <DropdownMenuItem
                        key={m.id}
                        onClick={() => setModel(selectedProvider, m.id)}
                        className={cn(
                          "flex items-center justify-between px-2.5 py-1.5 rounded-xl text-[12px] cursor-pointer",
                          activeModelId === m.id && "bg-muted font-medium",
                        )}
                      >
                        <span>{m.label}</span>
                        {activeModelId === m.id && (
                          <IconCheck size={13} stroke={2} />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center gap-1.5 px-1 text-[11px] text-muted-foreground">
                  <IconShieldLock size={12} stroke={1.6} />
                  <span>Keys stored locally</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => handleSend()}
                disabled={!canSend}
                aria-label="Send prompt"
                className="nordic-btn size-8 rounded-xl inline-flex items-center justify-center cursor-pointer disabled:opacity-35 disabled:pointer-events-none"
              >
                {status === "loading" ? (
                  <Loader className="size-3.5 animate-spin" />
                ) : (
                  <IconArrowUp size={15} stroke={1.9} />
                )}
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Embedded Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-background/70 backdrop-blur-sm animate-in fade-in duration-150"
            onClick={() => setShowSettingsModal(false)}
          />
          <div className="relative w-full max-w-md nordic-panel rounded-[20px] animate-in zoom-in-98 duration-150 p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="size-7 rounded-lg bg-muted flex items-center justify-center text-foreground">
                  <IconKey size={14} stroke={1.6} />
                </div>
                <h6 className="text-[13.5px] font-semibold text-foreground">
                  AI Provider Keys
                </h6>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setShowSettingsModal(false)}
                className="size-7 rounded-lg text-muted-foreground hover:text-foreground"
              >
                <IconX size={15} stroke={1.6} />
              </Button>
            </div>
            <AISettings />
          </div>
        </div>
      )}
    </>
  );
}
