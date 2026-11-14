import { FileOutput, FileText, Images, Layers, ScanText } from "lucide-react";
import type { Tool } from "@/lib/tools";

const MAP = { organize: Layers, images: Images, export: FileOutput, convert: FileText, ocr: ScanText } as const;

export default function ToolIcon({ tool, size = 24 }: { tool: Tool; size?: number }) {
  const Icon = MAP[tool.icon];
  return (
    <span className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-md border-2 border-ink ${tool.tint}`}>
      <Icon size={size} aria-hidden />
    </span>
  );
}
