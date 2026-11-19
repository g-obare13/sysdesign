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
  IconBulb,
  IconCheck,
  IconChevronDown,
  IconChevronRight,
  IconCopy,
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
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  ModelSelector,
  ModelSelectorContent,
  ModelSelectorEmpty,
  ModelSelectorGroup,
  ModelSelectorInput,
  ModelSelectorItem,
  ModelSelectorList,
  ModelSelectorLogo,
  ModelSelectorName,
  ModelSelectorTrigger,
} from "@/components/ai-elements/model-selector";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import {
  Task,
  TaskContent,
  TaskItem,
  TaskTrigger,
} from "@/components/ai-elements/task";
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

const FOLLOW_UP_SUGGESTIONS = [
  "Review bottlenecks",
  "Add caching layer",
  "Add observability",
  "Improve fault tolerance",
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
  const [modelSelectorOpen, setModelSelectorOpen] = React.useState(false);
  const [copiedMsgId, setCopiedMsgId] = React.useState<string | null>(null);

  const handleCopyMessage = React.useCallback((id: string, text: string) => {
    void navigator.clipboard?.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => {
      setCopiedMsgId((prev) => (prev === id ? null : prev));
    }, 1500);
  }, []);

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

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
      if (
        e.key === "Escape" &&
        isOpen &&
        !showSettingsModal &&
        !modelSelectorOpen
      ) {
        close();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, showSettingsModal, modelSelectorOpen, close]);

  const activeModelId = selectedProvider
    ? selectedModels[selectedProvider] ||
      PROVIDER_MODELS[selectedProvider][0].id
    : null;
  const activeModelLabel =
    selectedProvider && activeModelId
      ? (PROVIDER_MODELS[selectedProvider].find((m) => m.id === activeModelId)
          ?.label ?? activeModelId)
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
          "fixed right-3 top-16 bottom-16 z-50 flex flex-col w-[calc(100vw-24px)] sm:w-[368px] rounded-xl overflow-hidden",
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
              <h4 className="text-card font-medium text-foreground tracking-tight leading-tight truncate">
                AI Architecture
              </h4>
              <span className="text-caption text-muted-foreground leading-tight mt-0.5">
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
                    aria-label="API Keys"
                  >
                    <IconKey size={16} stroke={1.6} />
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
                      className="hover:text-destructive hover:bg-destructive/10"
                      aria-label="Clear Chat"
                    >
                      <IconTrash size={16} stroke={1.6} />
                    </Button>
                  }
                />
                <TooltipContent side="bottom">Clear Chat</TooltipContent>
              </Tooltip>
            )}

            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={close}
                    aria-label="Close"
                  >
                    <IconX size={16} stroke={1.6} />
                  </Button>
                }
              />
              <TooltipContent side="bottom">Close</TooltipContent>
            </Tooltip>
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
                  <Button
                    key={k.provider}
                    type="button"
                    variant={isActive ? "outline" : "ghost"}
                    size="sm"
                    onClick={() => setSelectedProvider(k.provider)}
                    className="flex-1"
                  >
                    {meta.label.split(" ")[0]}
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        {/* Scrollable Conversation Feed */}
        <Conversation className="flex-1 min-h-0">
          <ConversationContent className="gap-3.5 px-4 py-3.5">
            {/* Missing Keys Banner */}
            {!hasAny && (
              <div className="p-4 rounded-2xl bg-muted/60 border border-border space-y-3">
                <div className="flex items-start gap-3">
                  <div className="size-8 rounded-xl bg-card flex items-center justify-center text-foreground/80 shrink-0 shadow-none">
                    <IconKey size={15} stroke={1.6} />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <h4 className="text-body font-medium text-foreground leading-snug">
                      Connect an AI Provider
                    </h4>
                    <p className="text-small text-muted-foreground leading-relaxed">
                      Add your OpenAI, Anthropic, Gemini, or DeepSeek key locally to
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
                <span className="block text-caption font-medium text-muted-foreground px-1">
                  {nodes.length > 0 ? "Try Asking" : "Suggestions"}
                </span>
                <div className="flex flex-col gap-1.5">
                  {suggestions.map((s) => (
                    <div
                      key={s.label}
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        if (hasAny) {
                          handleSend(s.prompt);
                        } else {
                          setPrompt(s.prompt);
                          textareaRef.current?.focus();
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          if (hasAny) handleSend(s.prompt);
                          else {
                            setPrompt(s.prompt);
                            textareaRef.current?.focus();
                          }
                        }
                      }}
                      className="w-full flex items-start gap-3 p-3 rounded-lg bg-muted/45 hover:bg-muted/85 text-left transition-colors duration-150 group cursor-pointer focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <div className="size-8 rounded-lg bg-card flex items-center justify-center text-foreground/75 shrink-0 mt-0.5">
                        <s.icon size={16} stroke={1.6} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-body font-medium text-foreground leading-snug">
                          {s.label}
                        </div>
                        <div className="text-small text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                          {s.prompt}
                        </div>
                      </div>
                      <IconChevronRight
                        size={16}
                        stroke={1.6}
                        className="text-muted-foreground/40 group-hover:text-foreground transition-colors duration-150 shrink-0 mt-1"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Chat Messages */}
            {messages.map((msg) => (
              <Message
                key={msg.id}
                from={msg.role}
                className={cn(
                  "gap-1 max-w-[94%]",
                  msg.role === "user" ? "items-end" : "items-start",
                )}
              >
                <div className="flex items-center gap-1.5 px-1 text-caption text-muted-foreground tabular-nums">
                  <span>{msg.role === "user" ? "You" : "Architect"}</span>
                  <span>·</span>
                  <span>
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                <MessageContent
                  className={cn(
                    "px-3.5 py-2.5 text-body leading-relaxed",
                    msg.role === "user"
                      ? "rounded-2xl rounded-br-md bg-muted text-foreground"
                      : "rounded-2xl rounded-bl-md bg-card border border-border text-foreground shadow-panel space-y-2.5",
                  )}
                >
                  {/* Tool Execution Step Trace */}
                  {msg.toolSteps && msg.toolSteps.length > 0 && (
                    <Task defaultOpen={false} className="w-full">
                      <TaskTrigger
                        title={`Used ${msg.toolSteps.length} architect ${msg.toolSteps.length === 1 ? "tool" : "tools"}`}
                        className="text-caption"
                      />
                      <TaskContent>
                        {msg.toolSteps.map((step, i) => (
                          <TaskItem
                            key={`${msg.id}-step-${i}`}
                            className="flex items-center gap-1.5 text-caption"
                          >
                            <IconCheck
                              size={12}
                              stroke={2}
                              className="text-emerald-600 dark:text-emerald-400 shrink-0"
                            />
                            <span>{step}</span>
                          </TaskItem>
                        ))}
                      </TaskContent>
                    </Task>
                  )}

                  {msg.role === "assistant" ? (
                    <MessageResponse className="text-body leading-relaxed">
                      {msg.content}
                    </MessageResponse>
                  ) : (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  )}

                  {/* Diagram Applied Summary Card with One-Click Revert */}
                  {msg.diagramGenerated && (
                    <div className="p-2.5 rounded-xl bg-muted/65 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="size-7 rounded-lg bg-card flex items-center justify-center text-foreground/80 shrink-0 shadow-none">
                          <IconLayout size={14} stroke={1.6} />
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-foreground text-small truncate leading-tight">
                            {msg.diagramGenerated.title || "Canvas Updated"}
                          </div>
                          <div className="text-caption text-muted-foreground tabular-nums mt-0.5 truncate">
                            {msg.diagramGenerated.summary ||
                              `${msg.diagramGenerated.nodeCount} nodes · ${msg.diagramGenerated.edgeCount} edges`}
                          </div>
                        </div>
                      </div>
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => undo()}
                              icon={<IconArrowBackUp size={16} stroke={1.6} />}
                              iconPlacement="left"
                            >
                              Revert
                            </Button>
                          }
                        />
                        <TooltipContent side="top">
                          Undo AI change (⌘Z)
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  )}
                </MessageContent>

                {msg.role === "assistant" && (
                  <MessageActions className="px-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MessageAction
                      tooltip={
                        copiedMsgId === msg.id ? "Copied" : "Copy response"
                      }
                      label="Copy response"
                      onClick={() => handleCopyMessage(msg.id, msg.content)}
                      className="size-6 rounded-md text-muted-foreground hover:text-foreground"
                    >
                      {copiedMsgId === msg.id ? (
                        <IconCheck size={12} stroke={2} />
                      ) : (
                        <IconCopy size={12} stroke={1.6} />
                      )}
                    </MessageAction>
                  </MessageActions>
                )}
              </Message>
            ))}

            {/* Loading Indicator */}
            {status === "loading" && (
              <div className="flex flex-col gap-1 items-start">
                <span className="px-1 text-caption text-muted-foreground">
                  Architect · Designing
                </span>
                <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl rounded-bl-md bg-muted/60">
                  <IconLoader2
                    size={15}
                    stroke={1.8}
                    className="animate-spin text-foreground/70 shrink-0"
                  />
                  <Shimmer as="span" className="text-body font-medium">
                    Designing & laying out canvas…
                  </Shimmer>
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
                    <div className="font-medium text-destructive text-small">
                      Generation Error
                    </div>
                    <div className="text-muted-foreground text-caption mt-0.5 line-clamp-3">
                      {errorMsg}
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={handleRetry}
                  size="sm"
                  className="shrink-0"
                  icon={<IconRefresh size={16} />}
                >
                  Retry
                </Button>
              </div>
            )}
          </ConversationContent>
          <ConversationScrollButton className="size-8 shadow-md" />
        </Conversation>

        {/* Nordic Studio Prompt Composer */}
        <div className="p-3.5 pt-2 shrink-0 space-y-2">
          {/* Active Canvas Selection Context Pill */}
          {selectedCount > 0 && (
            <div className="flex items-center justify-between px-2.5 py-1 rounded-xl bg-muted/70 text-caption text-muted-foreground">
              <span>
                <strong className="font-medium text-foreground">
                  {selectedCount} {selectedCount === 1 ? "node" : "nodes"}
                </strong>{" "}
                selected: edits will target them
              </span>
            </div>
          )}

          {/* Quick Follow-up Suggestions */}
          {messages.length > 0 && status !== "loading" && hasAny && (
            <Suggestions className="pb-0.5">
              {FOLLOW_UP_SUGGESTIONS.map((s) => (
                <Suggestion
                  key={s}
                  suggestion={s}
                  onClick={(text) => handleSend(text)}
                  className="h-7 px-2.5 text-caption bg-muted/50 border-border"
                />
              ))}
            </Suggestions>
          )}

          <PromptInput
            onSubmit={({ text }) => {
              if (status !== "loading" && selectedProvider && text.trim()) {
                handleSend(text);
              }
            }}
            className="[&_[data-slot=input-group]]:rounded-2xl [&_[data-slot=input-group]]:bg-muted/65 [&_[data-slot=input-group]]:border-border [&_[data-slot=input-group]]:focus-within:bg-card [&_[data-slot=input-group]]:focus-within:border-border-strong [&_[data-slot=input-group]]:shadow-none [&_[data-slot=input-group]]:focus-within:shadow-panel"
          >
            <PromptInputBody>
              <PromptInputTextarea
                ref={textareaRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
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
                className="min-h-[48px] max-h-[160px] px-3.5 pt-3 pb-1.5 text-body leading-relaxed"
              />
            </PromptInputBody>

            <PromptInputFooter className="px-2.5 pb-2.5 pt-1">
              <PromptInputTools>
                {selectedProvider && activeModelLabel ? (
                  <ModelSelector
                    open={modelSelectorOpen}
                    onOpenChange={setModelSelectorOpen}
                  >
                    <ModelSelectorTrigger className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-muted text-caption font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer outline-none">
                      <ModelSelectorLogo provider={selectedProvider} />
                      <span>{activeModelLabel}</span>
                      <IconChevronDown size={12} stroke={1.7} />
                    </ModelSelectorTrigger>
                    <ModelSelectorContent title="Select AI Model">
                      <ModelSelectorInput placeholder="Search models..." />
                      <ModelSelectorList>
                        <ModelSelectorEmpty>
                          No models found.
                        </ModelSelectorEmpty>
                        {keys.map((k) => {
                          const meta = PROVIDER_META[k.provider];
                          return (
                            <ModelSelectorGroup
                              key={k.provider}
                              heading={meta.label}
                            >
                              {PROVIDER_MODELS[k.provider].map((m) => {
                                const isSelected =
                                  selectedProvider === k.provider &&
                                  activeModelId === m.id;
                                return (
                                  <ModelSelectorItem
                                    key={`${k.provider}-${m.id}`}
                                    value={`${meta.label} ${m.label} ${m.id}`}
                                    onSelect={() => {
                                      setSelectedProvider(k.provider);
                                      setModel(k.provider, m.id);
                                      setModelSelectorOpen(false);
                                    }}
                                  >
                                    <ModelSelectorLogo provider={k.provider} />
                                    <ModelSelectorName>
                                      {m.label}
                                    </ModelSelectorName>
                                    {isSelected && (
                                      <IconCheck size={14} stroke={2} />
                                    )}
                                  </ModelSelectorItem>
                                );
                              })}
                            </ModelSelectorGroup>
                          );
                        })}
                      </ModelSelectorList>
                    </ModelSelectorContent>
                  </ModelSelector>
                ) : (
                  <div className="flex items-center gap-1.5 px-1 text-caption text-muted-foreground">
                    <IconShieldLock size={12} stroke={1.6} />
                    <span>Keys stored locally</span>
                  </div>
                )}
              </PromptInputTools>

              <PromptInputSubmit
                disabled={!canSend}
                status={
                  status === "loading"
                    ? "submitted"
                    : status === "error"
                      ? "error"
                      : "ready"
                }
                className="shiny-primary-btn size-8 rounded-full"
              />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </aside>

      {/* Embedded Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-background/70 backdrop-blur-sm animate-in fade-in duration-150"
            onClick={() => setShowSettingsModal(false)}
          />
          <div className="relative w-full max-w-md nordic-panel rounded-xl animate-in zoom-in-98 duration-150 p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="size-7 rounded-lg bg-muted flex items-center justify-center text-foreground">
                  <IconKey size={14} stroke={1.6} />
                </div>
                <h4 className="text-body font-medium text-foreground">
                  AI Provider Keys
                </h4>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setShowSettingsModal(false)}
                aria-label="Close settings"
              >
                <IconX size={16} stroke={1.6} />
              </Button>
            </div>
            <AISettings />
          </div>
        </div>
      )}
    </>
  );
}
