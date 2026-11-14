import { Camera, FileOutput, FileText, Hash, Images, Layers, Lock, LockOpen, Minimize2, RotateCw, ScanText, Scissors, Stamp } from "lucide-react";
import type { IconKey, Tool } from "@/lib/tools";

const MAP: Record<IconKey, typeof Layers> = {
  organize: Layers, split: Scissors, rotate: RotateCw, compress: Minimize2, images: Images, export: FileOutput,
  convert: FileText, ocr: ScanText, scan: Camera, numbers: Hash, watermark: Stamp, protect: Lock, unlock: LockOpen,
};

export default function ToolIcon({ tool, size = 24 }: { tool: Tool; size?: number }) {
  const Icon = MAP[tool.icon];
  return (
    <span className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-md border-2 border-ink ${tool.tint}`}>
      <Icon size={size} aria-hidden />
    </span>
  );
}
