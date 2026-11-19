/**
 * @fileoverview Global footer component displaying copyright, legal links, and social portfolio links.
 */

import { Link } from "@tanstack/react-router";
import {
  IconBrandDribbble,
  IconBrandGithub,
  IconBrandLinkedin,
  IconExternalLink,
} from "@tabler/icons-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * Global application footer component.
 *
 * @returns Footer navigation element
 */
export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="h-9 border-t border-border/80 bg-background/95 backdrop-blur-xs px-4 flex items-center justify-between shrink-0 z-50 select-none">
      <div className="flex items-center gap-2 text-caption text-muted-foreground">
        <span>&copy; {currentYear} SysDesign</span>
        <span className="opacity-40">·</span>
        <div className="flex items-center gap-2.5">
          <Link
            to="/privacy"
            className="hover:text-foreground transition-colors"
          >
            Privacy
          </Link>
          <Link
            to="/terms"
            className="hover:text-foreground transition-colors"
          >
            Terms
          </Link>
        </div>
        <span className="opacity-40">·</span>
        <span className="hidden sm:inline-flex items-center gap-1">
          Crafted by{" "}
          <a
            href="https://obare27.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground hover:text-primary transition-colors font-medium"
          >
            Obare
          </a>
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger
              render={
                <a
                  href="https://github.com/g-obare13/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
                  aria-label="GitHub"
                >
                  <IconBrandGithub size={14} />
                </a>
              }
            />
            <TooltipContent side="top">GitHub</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <a
                  href="https://www.linkedin.com/in/obare13/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
                  aria-label="LinkedIn"
                >
                  <IconBrandLinkedin size={14} />
                </a>
              }
            />
            <TooltipContent side="top">LinkedIn</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <a
                  href="https://dribbble.com/Obare13"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
                  aria-label="Dribbble"
                >
                  <IconBrandDribbble size={14} />
                </a>
              }
            />
            <TooltipContent side="top">Dribbble</TooltipContent>
          </Tooltip>
        </div>

        <div className="w-px h-3 bg-border/60" />

        <a
          href="https://obare27.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-caption font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        >
          Portfolio
          <IconExternalLink size={11} className="opacity-60" />
        </a>
      </div>
    </footer>
  );
}
