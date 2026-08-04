import { Component, type ReactNode } from "react";
import { IconAlertTriangle, IconReload } from "@tabler/icons-react";
import { Button } from "../ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Catches render errors inside the diagram canvas (e.g. a bad node/edge type)
 * so a single broken node can't white-screen the entire editor.
 */
export default class CanvasErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    // Keep this in the log — it's the only trace of what node failed.
    console.error("Canvas render error:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full w-full items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4 p-6 text-center">
            <div className="flex size-12 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
              <IconAlertTriangle size={24} />
            </div>
            <h2 className="text-lg font-bold text-foreground">
              The diagram hit a snag
            </h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              Something went wrong rendering the canvas. Your work is saved —
              reloading will bring it back.
            </p>
            <Button
              onClick={() => window.location.reload()}
              icon={IconReload}
              iconSide="right"
            >
              Reload Editor
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
