"use client";

import { ShortcutList } from "@/components/shortcuts/ShortcutList";
import { Modal } from "@/components/ui/Modal";
import { EDITOR_SHORTCUTS } from "@/data/shortcuts";
import { useEditorStore } from "@/store/editor";

export function ShortcutsModal() {
  const open = useEditorStore((s) => s.modal === "shortcuts");
  const setModal = useEditorStore((s) => s.setModal);
  return (
    <Modal open={open} onClose={() => setModal(null)} title="Keyboard shortcuts" description="Work faster, perform smoother." size="lg">
      <ShortcutList groups={EDITOR_SHORTCUTS} />
    </Modal>
  );
}
