/**
 * @fileoverview AI Provider settings configuration modal/section.
 * Allows users to add, reveal, and remove their OpenAI, Anthropic, and Google Gemini API keys securely.
 */

import * as React from "react";
import {
  IconKey,
  IconTrash,
  IconEye,
  IconEyeOff,
  IconShieldLock,
  IconCheck,
  IconAlertCircle,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ConfirmModal from "@/components/ui/ConfirmModal";
import {
  useAIKeys,
  PROVIDER_META,
  maskKey,
  type AIProvider,
} from "@/store/ai.store";

const PROVIDERS: AIProvider[] = ["openai", "anthropic", "google"];

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
      setError("Please enter a valid key.");
      return;
    }
    const meta = PROVIDER_META[adding];
    if (!trimmed.startsWith(meta.prefix)) {
      setError(
        `${meta.label} keys should start with "${meta.prefix}". Please double-check.`,
      );
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
    <div className="flex flex-col gap-6 py-2">
      {/* Delete confirmation modal */}
      <ConfirmModal
        open={!!confirmRemove}
        isDestructive
        title="Remove API Key?"
        description={`This will permanently remove your ${confirmRemove ? PROVIDER_META[confirmRemove].label : ""} API key. You'll need to add it again to use the AI assistant.`}
        confirmText="Remove Key"
        onClose={() => setConfirmRemove(null)}
        onConfirm={handleConfirmRemove}
      />

      {/* Privacy notice */}
      <div className="flex items-start gap-2.5 px-3 py-2.5 bg-primary/5 rounded-[--radius] border border-primary/15">
        <IconShieldLock
          size={14}
          className="text-primary shrink-0 mt-0.5"
          stroke={1.8}
        />
        <p className="text-[10px] text-foreground/70 leading-relaxed">
          Your API keys are stored{" "}
          <strong>only in your browser's local storage</strong> and never sent
          to our servers. Treat them like passwords and don't share them.
        </p>
      </div>

      {/* Provider list */}
      <div className="flex flex-col gap-3">
        {PROVIDERS.map((provider) => {
          const meta = PROVIDER_META[provider];
          const existing = existingKey(provider);
          const isAdding = adding === provider;
          const isSaved = saved === provider;

          return (
            <div
              key={provider}
              className="flex flex-col gap-2 px-3 py-3 rounded-[--radius] border border-border/60 bg-card"
            >
              {/* Provider header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: meta.color }}
                  />
                  <span className="text-[12px] font-semibold text-foreground">
                    {meta.label}
                  </span>
                  {isSaved && (
                    <span className="flex items-center gap-1 text-[10px] text-green-600 dark:text-green-400 animate-in fade-in">
                      <IconCheck size={10} />
                      Saved
                    </span>
                  )}
                </div>

                {existing ? (
                  <div className="flex items-center gap-1">
                    <Button
                      onClick={() =>
                        setRevealed(revealed === provider ? null : provider)
                      }
                      icon={revealed === provider ? IconEyeOff : IconEye}
                      variant="outline"
                      size="icon"
                      title={revealed === provider ? "Hide key" : "Reveal key"}
                    />
                    <Button
                      onClick={() => setConfirmRemove(provider)}
                      icon={IconTrash}
                      variant="destructive"
                      size="icon"
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
                    size="sm"
                    className="text-xs"
                    variant="outline"
                  >
                    Add key
                  </Button>
                ) : null}
              </div>

              {/* Existing key masked display */}
              {existing && !isAdding && (
                <div className="flex items-center gap-2 px-2.5 py-1.5 bg-muted/40 rounded-md">
                  <IconKey
                    size={11}
                    className="text-muted-foreground shrink-0"
                  />
                  <code className="text-[11px] font-mono text-foreground/70 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
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
                    className="text-[12px] font-mono"
                  />
                  {error && (
                    <p className="flex items-center gap-1.5 text-[10px] text-destructive">
                      <IconAlertCircle size={11} />
                      {error}
                    </p>
                  )}
                  <div className="flex gap-1.5">
                    <Button onClick={handleSave} size="sm" className="text-xs">
                      Save key
                    </Button>
                    <Button
                      onClick={handleCancel}
                      variant="outline"
                      size="sm"
                      className="text-xs"
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
