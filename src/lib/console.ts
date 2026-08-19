/**
 * Console suppression and banner for production
 * Remove this file and from root index - I use it to track versioning
 */

export function initConsole() {
  if (typeof window === "undefined") return

  // Only run in production
  const isProd = import.meta.env.PROD
  const isDebug = process.env.LOG_LEVEL === "debug"

  if (isProd && !isDebug) {
    // Save original console methods
    const originalLog = console.log
    // const originalWarn = console.warn
    // const originalError = console.error
    // const originalInfo = console.info

    // Suppress logs
    console.log = () => {}
    console.warn = () => {}
    console.info = () => {}
    console.debug = () => {}
    // Keep console.error for debugging production issues, but you can suppress it too
    // Fancy Banner
   const banner = `
    %c  #####   #     #   #####   ######   #######   #####   ###   #####   #     #
   #     #  #     #  #     #  #     #  #        #     #   #   #  #     #  ##    #
   #        #     #  #        #     #  #        #     #   #      #     #  # #   #
    #####   #     #   #####   #     #  #####    #     #   #      #     #  #  #  #
         #   #   #        #   #     #  #        #     #   #      #     #  #   # #
   #     #    # #   #     #   #     #  #        #     #   #   #  #     #  #    ##
    #####      #      #####    #####   #######   #####   ###   #####    #     #
`
    
    %c SysDesign | v0.0.1 https://sysdesign.obare27.com %c

    %cBuilt By Obare.
    
    %cCheck me out at: %chttps://obare27.com %cor email: %cobaregeoffrey13@gmail.com
    `

    originalLog(
      banner,
      "color: #10b981; font-weight: bold; font-family: monospace;", // Emerald for ASCII
      "background: #10b981; color: #fff; padding: 4px 8px; border-radius: 4px; font-weight: bold;", // Badge
      "color: #94a3b8; font-style: italic;", // Version/Status
      "color: #64748b; font-weight: 500;", // Tagline
      "color: #475569;", // Check me out
      "color: #10b981; font-weight: bold; text-decoration: underline;", // Website Link
      "color: #475569;", // Email label
      "color: #10b981; font-weight: bold; text-decoration: underline;" // Email link
    )
  }
}
