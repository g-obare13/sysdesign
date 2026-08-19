/**
 * @fileoverview Global footer component displaying copyright, legal links, and social portfolio links.
 */

import { Link } from "@tanstack/react-router";
import {
  IconBrandGithub,
  IconBrandLinkedin,
  IconBrandDribbble,
  IconExternalLink,
  IconHeartFilled,
} from "@tabler/icons-react";

/**
 * Global application footer component.
 *
 * @returns Footer navigation element
 */
export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="h-10 border-t bg-card/50 backdrop-blur-sm px-4 flex items-center justify-between shrink-0 z-50">
      <div className="flex items-center gap-2 text-[10.5px] text-muted-foreground font-medium select-none">
        <span>&copy; {currentYear} Sysdesign 0.0.3</span>
        <span className="opacity-40">|</span>
        <div className="flex items-center gap-3">
          <Link
            to="/privacy"
            className="hover:text-primary transition-colors hover:underline decoration-primary/30"
          >
            Privacy
          </Link>
          <Link
            to="/terms"
            className="hover:text-primary transition-colors hover:underline decoration-primary/30"
          >
            Terms
          </Link>
        </div>
        <span className="opacity-40">|</span>
        <span className="flex items-center gap-1">
          Made with{" "}
          <IconHeartFilled
            size={10}
            className="text-destructive animate-pulse"
          />{" "}
          by{" "}
          <a
            href="https://obare27.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground hover:text-primary transition-colors hover:underline decoration-primary/30"
          >
            Obare
          </a>
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <a
            href="https://github.com/g-obare13/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground/60 hover:text-foreground transition-all flex items-center gap-1 group"
            title="GitHub"
          >
            <IconBrandGithub size={15} stroke={1.8} />
          </a>
          <a
            href="https://www.linkedin.com/in/obare13/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#0A66C2]/80 hover:text-[#0A66C2] transition-all flex items-center gap-1 group saturate-[0.8] hover:saturate-100"
            title="LinkedIn"
          >
            <IconBrandLinkedin size={15} stroke={1.8} />
          </a>
          <a
            href="https://dribbble.com/Obare13"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#EA4C89]/80 hover:text-[#EA4C89] transition-all flex items-center gap-1 group saturate-[0.8] hover:saturate-100"
            title="Dribbble"
          >
            <IconBrandDribbble size={15} stroke={1.8} />
          </a>
        </div>

        <div className="w-px h-3 bg-border" />

        <a
          href="https://obare27.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10.5px] font-semibold text-muted-foreground hover:text-primary transition-all flex items-center gap-1.5"
        >
          Portfolio
          <IconExternalLink size={11} className="opacity-50" />
        </a>
      </div>
    </footer>
  );
}
