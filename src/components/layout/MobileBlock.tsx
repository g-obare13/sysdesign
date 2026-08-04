import { IconDeviceLaptop, IconDeviceDesktop } from "@tabler/icons-react";

export default function MobileBlock() {
  return (
    <div className="flex lg:hidden fixed inset-0 z-9999 flex-col items-center justify-center p-6 text-center bg-background/95 backdrop-blur-md overflow-hidden">
      <div className="relative mb-8 flex items-center justify-center">
        <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center animate-pulse">
          <IconDeviceLaptop className="w-12 h-12 text-primary" stroke={1.5} />
        </div>
        <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center border-4 border-background">
          <IconDeviceDesktop className="w-6 h-6 text-secondary-foreground" />
        </div>
      </div>

      <h1 className="font-display text-2xl font-bold text-foreground mb-3 tracking-tight">
        Desktop Required
      </h1>

      <p className="text-muted-foreground text-[15px] max-w-[280px] leading-relaxed mb-10">
        SysDesign is built for complex diagramming. Please access the project
        using a <strong>desktop</strong> or <strong>laptop</strong> browser for
        the best experience.
      </p>

      {/* <div className="flex flex-col gap-4 items-center">
        <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground/60">
          Supported Systems
        </p>
        <div className="flex -space-x-3">
          <div className="w-10 h-10 rounded-full border-2 border-background bg-muted flex items-center justify-center">
            <span className="text-xs font-semibold">Mac</span>
          </div>
          <div className="w-10 h-10 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-semibold">
            Win
          </div>
          <div className="w-10 h-10 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-semibold">
            Lnx
          </div>
        </div>
      </div> */}

      <div className="mt-auto pb-10">
        <div className="text-[12px] font-medium text-primary/80 flex items-center gap-2">
          <span>https://sysdesign.obare27.com</span>
        </div>
      </div>
    </div>
  );
}
