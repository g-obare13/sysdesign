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
      <div className="flex items-start gap-2.5 p-3 bg-muted/60 rounded-2xl">
        <IconShieldLock
          size={15}
          stroke={1.6}
          className="text-foreground/75 shrink-0 mt-0.5"
        />
        <p className="text-[12px] text-muted-foreground leading-relaxed">
          Keys are stored{" "}
          <strong className="font-medium text-foreground">
            locally in your browser
          </strong>{" "}
          and never transmitted to our servers.
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
              className="flex flex-col gap-2 p-3 rounded-2xl border border-black/[0.06] dark:border-white/[0.07] bg-card"
            >
              {/* Provider header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-medium text-foreground">
                    {meta.label}
                  </span>
                  {isSaved && (
                    <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-muted-foreground">
                      <IconCheck size={11} />
                      Saved
                    </span>
                  )}
                </div>

                {existing ? (
                  <div className="flex items-center gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() =>
                        setRevealed(revealed === provider ? null : provider)
                      }
                      className="size-7 rounded-lg text-muted-foreground hover:text-foreground"
                      title={revealed === provider ? "Hide key" : "Reveal key"}
                    >
                      {revealed === provider ? (
                        <IconEyeOff size={14} stroke={1.6} />
                      ) : (
                        <IconEye size={14} stroke={1.6} />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setConfirmRemove(provider)}
                      className="size-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      title="Remove key"
                    >
                      <IconTrash size={14} stroke={1.6} />
                    </Button>
                  </div>
                ) : !isAdding ? (
                  <Button
                    onClick={() => {
                      setAdding(provider);
                      setDraft("");
                      setError("");
                    }}
                    size="xs"
                  >
                    Add key
                  </Button>
                ) : null}
              </div>

              {/* Existing key masked display */}
              {existing && !isAdding && (
                <div className="flex items-center gap-2 px-2.5 py-1.5 bg-muted/60 rounded-xl">
                  <IconKey
                    size={12}
                    stroke={1.6}
                    className="text-muted-foreground shrink-0"
                  />
                  <code className="text-[11px] text-muted-foreground flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                    {revealed === provider
                      ? existing.key
                      : maskKey(existing.key)}
                  </code>
                </div>
              )}

              {/* Add form */}
              {isAdding && (
                <div className="flex flex-col gap-2 mt-1">
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
                    className="text-[12.5px]"
                  />
                  {error && (
                    <p className="flex items-center gap-1 text-[11px] text-destructive">
                      <IconAlertCircle size={12} />
                      {error}
                    </p>
                  )}
                  <div className="flex items-center justify-end gap-1.5 pt-0.5">
                    <Button
                      onClick={handleCancel}
                      variant="ghost"
                      size="xs"
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleSave} size="xs">
                      Save key
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
