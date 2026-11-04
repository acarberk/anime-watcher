import type { ReactNode } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useIsDesktop, useKeyboard } from "@/lib/hooks";

/** Bottom sheet on phones (thumb reach, swipe to close), centered dialog from tablet up */
export function ResponsiveModal({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const desktop = useIsDesktop();
  const keyboard = useKeyboard(open && !desktop);

  if (desktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[min(90dvh,56rem)] flex-col gap-0 p-0 sm:max-w-xl 3xl:max-w-2xl">
          <DialogHeader className="border-b px-6 pt-6 pb-4">
            <DialogTitle className="text-lg">{title}</DialogTitle>
            {description ? <DialogDescription>{description}</DialogDescription> : <DialogDescription className="sr-only">{title}</DialogDescription>}
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    // repositionInputs off: vaul's own keyboard handling pinned stale heights (empty space under the buttons);
    // instead the sheet sits on the keyboard and shrinks to the visible area
    <Drawer open={open} onOpenChange={onOpenChange} repositionInputs={false}>
      <DrawerContent
        className="max-h-[92dvh]"
        data-keyboard={keyboard ? "" : undefined}
        style={keyboard ? { bottom: keyboard.bottom, maxHeight: keyboard.height - 16 } : undefined}
      >
        <DrawerHeader className="border-b pb-3 text-left">
          <DrawerTitle className="text-lg">{title}</DrawerTitle>
          {description ? <DrawerDescription>{description}</DrawerDescription> : <DrawerDescription className="sr-only">{title}</DrawerDescription>}
        </DrawerHeader>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </DrawerContent>
    </Drawer>
  );
}
