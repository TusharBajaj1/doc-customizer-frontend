"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DragDropContext, Draggable, Droppable, type DropResult } from "@hello-pangea/dnd";
import type { PDFDocumentProxy } from "pdfjs-dist";
import Dropzone from "@/components/Dropzone";
import PageThumb from "@/components/PageThumb";
import ToolShell from "@/components/ToolShell";
import { buildPdf, type PageRef, type SourceFile } from "@/lib/pdfOps";
import { loadPdf } from "@/lib/pdfjs";
import { downloadBytes, MAX_FILE_BYTES, readBytes } from "@/lib/download";

type Item = PageRef & { key: string; selected: boolean };

export default function OrganizePage() {
  const [sources, setSources] = useState<SourceFile[]>([]);
  const [docs, setDocs] = useState<Record<string, PDFDocumentProxy>>({});
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addFiles = useCallback(async (files: File[]) => {
    setError(null);
    for (const f of files) {
      if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) { setError(`${f.name} is not a PDF.`); continue; }
      if (f.size > MAX_FILE_BYTES) { setError(`${f.name} is larger than ${MAX_FILE_BYTES / 1024 / 1024} MB.`); continue; }
      try {
        const bytes = await readBytes(f);
        const doc = await loadPdf(bytes);
        const id = crypto.randomUUID();
        setSources((s) => [...s, { id, name: f.name, bytes }]);
        setDocs((d) => ({ ...d, [id]: doc }));
        setItems((it) => [...it, ...Array.from({ length: doc.numPages }, (_, i): Item => ({ key: `${id}-${i}`, fileId: id, pageIndex: i, rotation: 0, selected: false }))]);
      } catch {
        setError(`Could not open ${f.name}. It may be corrupted or password-protected.`);
      }
    }
  }, []);

  useEffect(() => () => { Object.values(docs).forEach((d) => d.destroy()); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const selected = useMemo(() => items.filter((i) => i.selected), [items]);
  const nameOf = (id: string) => sources.find((s) => s.id === id)?.name ?? "";

  function onDragEnd(r: DropResult) {
    if (!r.destination) return;
    setItems((prev) => {
      const next = [...prev];
      const [m] = next.splice(r.source.index, 1);
      next.splice(r.destination!.index, 0, m);
      return next;
    });
  }
  const patch = (key: string, p: Partial<Item>) => setItems((prev) => prev.map((i) => (i.key === key ? { ...i, ...p } : i)));
  const rotateSelected = (deg: number) => setItems((prev) => prev.map((i) => (i.selected ? { ...i, rotation: (i.rotation + deg + 360) % 360 } : i)));
  const deleteSelected = () => setItems((prev) => prev.filter((i) => !i.selected));

  async function exportPages(list: Item[], name: string) {
    if (!list.length) return;
    setBusy(true); setError(null);
    try {
      const usedIds = new Set(list.map((i) => i.fileId));
      const out = await buildPdf(sources.filter((s) => usedIds.has(s.id)), list);
      downloadBytes(out, name);
    } catch (e) {
      setError("Export failed: " + (e instanceof Error ? e.message : String(e)));
    } finally { setBusy(false); }
  }

  return (
    <ToolShell title="Organize PDF" desc="Add one or more PDFs, drag pages into any order, rotate or delete them, then export. Click a page to select it.">
      <Dropzone accept="application/pdf" label="Add PDF files" onFiles={addFiles} />
      {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {items.length > 0 && (
        <>
          <div className="sticky top-0 z-10 mt-6 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white/95 p-3 backdrop-blur">
            <span className="mr-2 text-sm text-slate-600">{items.length} pages · {selected.length} selected</span>
            <button className="btn" onClick={() => setItems((p) => p.map((i) => ({ ...i, selected: true })))}>Select all</button>
            <button className="btn" onClick={() => setItems((p) => p.map((i) => ({ ...i, selected: false })))} disabled={!selected.length}>Clear</button>
            <button className="btn" onClick={() => rotateSelected(-90)} disabled={!selected.length}>⟲ Rotate left</button>
            <button className="btn" onClick={() => rotateSelected(90)} disabled={!selected.length}>⟳ Rotate right</button>
            <button className="btn btn-danger" onClick={deleteSelected} disabled={!selected.length}>Delete</button>
            <span className="flex-1" />
            <button className="btn" onClick={() => exportPages(selected, "extracted.pdf")} disabled={!selected.length || busy}>Extract selected</button>
            <button className="btn btn-primary" onClick={() => exportPages(items, "organized.pdf")} disabled={busy}>{busy ? "Working…" : "Export PDF"}</button>
          </div>

          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="pages" direction="horizontal">
              {(p) => (
                <div ref={p.innerRef} {...p.droppableProps} className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
                  {items.map((it, idx) => (
                    <Draggable key={it.key} draggableId={it.key} index={idx}>
                      {(d) => (
                        <div ref={d.innerRef} {...d.draggableProps} {...d.dragHandleProps}
                          onClick={() => patch(it.key, { selected: !it.selected })}
                          className={`cursor-grab rounded-lg border-2 bg-white p-2 text-center ${it.selected ? "border-blue-500 ring-2 ring-blue-200" : "border-slate-200"}`}>
                          {docs[it.fileId] && <PageThumb doc={docs[it.fileId]} pageNumber={it.pageIndex + 1} rotation={it.rotation} />}
                          <div className="mt-1 truncate text-xs text-slate-500" title={nameOf(it.fileId)}>{idx + 1} · {nameOf(it.fileId)} p{it.pageIndex + 1}</div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {p.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </>
      )}
    </ToolShell>
  );
}
