/**
 * @fileoverview Production console logger management and startup banner display.
 * Suppresses verbose logging in production environments while displaying application branding.
 */

/**
 * Initializes console output settings for the browser environment.
 * In production mode, suppresses standard logging (`log`, `warn`, `info`, `debug`)
 * and displays an ASCII application banner with author/version metadata.
 */
export function initConsole(): void {
  if (typeof window === "undefined") return;

  // Only run in production
  const isProd = import.meta.env.PROD;
  const isDebug = process.env.LOG_LEVEL === "debug";

  if (isProd && !isDebug) {
    // Save original console methods
    const originalLog = console.log;

    // Suppress logs
    console.log = () => {};
    console.warn = () => {};
    console.info = () => {};
    console.debug = () => {};

    // Fancy Banner
    const banner = `
    %c  #####   #     #   #####   ######   #######   #####   ###   #####   #     #
   #     #  #     #  #     #  #     #  #        #     #   #   #  #     #  ##    #
   #        #     #  #        #     #  #        #     #   #      #     #  # #   #
    #####   #     #   #####   #     #  #####    #     #   #      #     #  #  #  #
         #   #   #        #   #     #  #        #     #   #      #     #  #   # #
   #     #    # #   #     #   #     #  #        #     #   #   #  #     #  #    ##
    #####      #      #####    #####   #######   #####   ###   #####    #     #

    
    %c SysDesign | v0.0.1 https://sysdesign.obare27.com %c

    %cBuilt By Obare.
    
    %cCheck me out at: %chttps://obare27.com %cor email: %cobaregeoffrey13@gmail.com
    `;

    originalLog(
      banner,
      "color: #10b981; font-weight: bold; font-family: monospace;",
      "background: #10b981; color: #fff; padding: 4px 8px; border-radius: 4px; font-weight: bold;",
      "color: #94a3b8; font-style: italic;",
      "color: #64748b; font-weight: 500;",
      "color: #475569;",
      "color: #10b981; font-weight: bold; text-decoration: underline;",
      "color: #475569;",
      "color: #10b981; font-weight: bold; text-decoration: underline;",
    );
  }
}
