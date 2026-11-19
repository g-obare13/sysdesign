import { describe, expect, it, vi } from "vitest";
import { fireEvent, render } from "@testing-library/react";
import { ReactFlowProvider } from "@xyflow/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import AIFloatingButton from "./AIFloatingButton";
import AIChatDrawer from "./AIChatDrawer";
import { addKey, setAIDrawerOpen } from "@/store/ai.store";

vi.mock("@/lib/ai.service", () => ({
  callAIArchitect: vi.fn(async () => ({
    text: "Mocked reply",
    operations: [],
    toolSteps: [],
  })),
}));

describe("AI Section interaction", () => {
  it("opens drawer and handles clicks inside AI section without freezing or throwing", () => {
    setAIDrawerOpen(false);
    addKey("openai", "sk-test-1234567890");

    // jsdom lacks scrollIntoView and ResizeObserver (used by use-stick-to-bottom)
    Element.prototype.scrollIntoView = vi.fn();
    if (typeof globalThis.ResizeObserver === "undefined") {
      globalThis.ResizeObserver = class ResizeObserver {
        observe() {}
        unobserve() {}
        disconnect() {}
      };
    }

    const { getByLabelText, getByPlaceholderText, getByText } = render(
      <TooltipProvider>
        <ReactFlowProvider>
          <AIFloatingButton />
          <AIChatDrawer />
        </ReactFlowProvider>
      </TooltipProvider>,
    );

    const openBtn = getByLabelText("Open AI Assistant");
    fireEvent.click(openBtn);

    const textarea = getByPlaceholderText(/Describe a system architecture/i);
    fireEvent.click(textarea);
    fireEvent.change(textarea, { target: { value: "Design a chat app" } });

    expect(getByText("AI Architecture")).toBeTruthy();
  });
});
