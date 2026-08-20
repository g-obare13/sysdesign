/**
 * @fileoverview AI Provider settings configuration modal/section.
 * Allows users to add, reveal, and remove their OpenAI, Anthropic, and Google Gemini API keys securely.
 */

import * as React from "react";
import {
  IconAlertCircle,
  IconCheck,
  IconEye,
  IconEyeOff,
  IconKey,
  IconShieldLock,
  IconTrash,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ConfirmModal from "@/components/ui/ConfirmModal";
import {
  
  PROVIDER_META,
  maskKey,
  useAIKeys
} from "@/store/ai.store";
import type {AIProvider} from "@/store/ai.store";

const PROVIDERS: Array<AIProvider> = ["openai", "anthropic", "google"];

/**
 * AI Provider API Keys management settings component.
 *
 * @returns AI Settings view component
 */
export default function AISettings() {
  const { keys, add, remove } = useAIKeys();
  const [adding, setAdding] = React.useState<AIProvider | null>(null);
  const [draft, setDraft] = React.useState("");
  const [revealed, setRevealed] = React.useState<AIProvider | null>(null);
  const [error, setError] = React.useState("");
  const [saved, setSaved] = React.useState<AIProvider | null>(null);
  const [confirmRemove, setConfirmRemove] = React.useState<AIProvider | null>(
    null,
  );

  const handleSave = () => {
    if (!adding) return;
    const trimmed = draft.trim();
    if (!trimmed) {
      setError("Please enter an API key.");
      return;
    }
    add(adding, trimmed);
    setSaved(adding);
    setTimeout(() => setSaved(null), 2000);
    setAdding(null);
    setDraft("");
    setError("");
  };

  const handleCancel = () => {
    setAdding(null);
    setDraft("");
    setError("");
  };

  const handleConfirmRemove = () => {
    if (confirmRemove) {
      remove(confirmRemove);
      setConfirmRemove(null);
    }
  };

  const existingKey = (provider: AIProvider) =>
    keys.find((k) => k.provider === provider);

  return (
    <div className="flex flex-col gap-4 py-1">
      {/* Delete confirmation modal */}
      <ConfirmModal
        open={!!confirmRemove}
        isDestructive
        title="Remove API Key?"
        description={`This will remove your ${confirmRemove ? PROVIDER_META[confirmRemove].label : ""} API key from this browser.`}
        confirmText="Remove Key"
        onClose={() => setConfirmRemove(null)}
        onConfirm={handleConfirmRemove}
      />

      {/* Privacy notice */}
      <div className="flex items-start gap-2 p-2.5 bg-muted/40 rounded-md border border-border/60">
        <IconShieldLock
          size={14}
          className="text-primary shrink-0 mt-0.5"
        />
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Keys are stored <strong className="text-foreground">locally in your browser</strong> and never transmitted to our servers.
        </p>
      </div>

      {/* Provider list */}
      <div className="flex flex-col gap-2">
        {PROVIDERS.map((provider) => {
          const meta = PROVIDER_META[provider];
          const existing = existingKey(provider);
          const isAdding = adding === provider;
          const isSaved = saved === provider;

          return (
            <div
              key={provider}
              className="flex flex-col gap-2 p-2.5 rounded-md border border-border bg-card"
            >
              {/* Provider header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span
                    className="size-2 rounded-full shrink-0"
                    style={{ background: meta.color }}
                  />
                  <span className="text-xs font-semibold text-foreground">
                    {meta.label}
                  </span>
                  {isSaved && (
                    <span className="flex items-center gap-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                      <IconCheck size={10} />
                      Saved
                    </span>
                  )}
                </div>

                {existing ? (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      icon={
                        revealed === provider ? (
                          <IconEyeOff size={13} />
                        ) : (
                          <IconEye size={13} />
                        )
                      }
                      iconPlacement="left"
                      onClick={() =>
                        setRevealed(revealed === provider ? null : provider)
                      }
                      className="p-1 rounded text-muted-foreground hover:text-foreground"
                      title={revealed === provider ? "Hide key" : "Reveal key"}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      icon={<IconTrash size={13} />}
                      iconPlacement="left"
                      onClick={() => setConfirmRemove(provider)}
                      className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      title="Remove key"
                    />
                  </div>
                ) : !isAdding ? (
                  <Button
                    onClick={() => {
                      setAdding(provider);
                      setDraft("");
                      setError("");
                    }}
                    size="xs"
                    variant="outline"
                  >
                    Add key
                  </Button>
                ) : null}
              </div>

              {/* Existing key masked display */}
              {existing && !isAdding && (
                <div className="flex items-center gap-1.5 px-2 py-1 bg-muted/40 rounded border border-border/40">
                  <IconKey
                    size={11}
                    className="text-muted-foreground shrink-0"
                  />
                  <code className="text-[10px] font-mono text-muted-foreground flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                    {revealed === provider
                      ? existing.key
                      : maskKey(existing.key)}
                  </code>
                </div>
              )}

              {/* Add form */}
              {isAdding && (
                <div className="flex flex-col gap-1.5 mt-1">
                  <Input
                    autoFocus
                    type="text"
                    size="sm"
                    placeholder={meta.placeholder}
                    value={draft}
                    onChange={(e) => {
                      setDraft(e.target.value);
                      setError("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSave();
                      if (e.key === "Escape") handleCancel();
                    }}
                    className="font-mono text-xs"
                  />
                  {error && (
                    <p className="flex items-center gap-1 text-[10px] text-destructive">
                      <IconAlertCircle size={11} />
                      {error}
                    </p>
                  )}
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <Button onClick={handleSave} size="xs">
                      Save key
                    </Button>
                    <Button
                      onClick={handleCancel}
                      variant="outline"
                      size="xs"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
