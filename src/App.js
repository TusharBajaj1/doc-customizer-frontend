import React, { useState, useRef } from "react";
import { PDFDocument } from "pdf-lib";
import { saveAs } from "file-saver";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

/**
 * Read a File object and return a Uint8Array
 */
function readAsUint8Array(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => {
      try {
        const ab = fr.result;
        const u8 = ab instanceof Uint8Array ? ab : new Uint8Array(ab);
        resolve(u8);
      } catch (err) {
        reject(err);
      }
    };
    fr.onerror = reject;
    fr.readAsArrayBuffer(file);
  });
}

export default function App() {
  // fileItems: [{ id, name, bytes: Uint8Array, pages: [{ pageNumber, thumb }] }]
  const [fileItems, setFileItems] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const inputRef = useRef();

  async function handleFiles(files) {
    const arr = Array.from(files || []);
    const added = [];
    for (const f of arr) {
      if (!f) continue;
      try {
        const bytes = await readAsUint8Array(f);
        added.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: f.name,
          bytes,
          pages: []
        });
      } catch (err) {
        console.error("Failed to read file", f.name, err);
        alert(`Failed to read file ${f.name}. Try a different file.`);
      }
    }
    if (added.length === 0) return;
    setFileItems(prev => [...prev, ...added]);
    if (selectedIndex === null) setSelectedIndex(0);
  }

  async function ensurePages(idx) {
    const item = fileItems[idx];
    if (!item) return;
    if (item.pages && item.pages.length > 0) return;

    try {
      console.log("ensurePages: loading PDF for", item.name);
      const loading = pdfjsLib.getDocument({ data: item.bytes });
      const pdf = await loading.promise;
      const total = pdf.numPages;
      const pages = [];

      for (let i = 1; i <= total; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.6 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d");
        await page.render({ canvasContext: ctx, viewport }).promise;
        const thumb = canvas.toDataURL("image/png");
        pages.push({ pageNumber: i, thumb });
      }

      setFileItems(prev => {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], pages };
        return copy;
      });

      console.log(`ensurePages: rendered ${total} pages for ${item.name}`);
    } catch (err) {
      console.error("ensurePages error:", err);
      alert("Failed to render PDF pages. The file may be corrupted, encrypted, or very large.");
    }
  }

  function onSelect(idx) {
    setSelectedIndex(idx);
    // populate thumbnails in background
    ensurePages(idx);
  }

  function onDragEnd(result) {
    if (!result.destination) return;
    if (selectedIndex === null) return;

    setFileItems(prev => {
      const copy = [...prev];
      const file = copy[selectedIndex];
      if (!file || !file.pages) return prev;
      const pages = Array.from(file.pages);
      const [moved] = pages.splice(result.source.index, 1);
      pages.splice(result.destination.index, 0, moved);
      copy[selectedIndex] = { ...file, pages };
      return copy;
    });
  }

  async function exportReordered(idx) {
    if (idx === null || idx === undefined) return alert("No file selected.");
    const item = fileItems[idx];
    if (!item) return alert("No file selected.");

    try {
      if (!item.pages || item.pages.length === 0) {
        await ensurePages(idx);
      }

      const freshItem = (fileItems[idx] && fileItems[idx].pages && fileItems[idx].pages.length) ? fileItems[idx] : item;

      if (!freshItem.pages || freshItem.pages.length === 0) {
        return alert("Could not read pages from this PDF. Export cancelled.");
      }

      const pageIndices = freshItem.pages.map(p => {
        const n = Number(p.pageNumber);
        return Number.isFinite(n) ? n - 1 : -1;
      });

      const invalid = pageIndices.find(i => i < 0);
      if (invalid !== undefined && invalid !== null) {
        console.error("exportReordered: invalid pageNumber found", pageIndices);
        return alert("Export failed due to invalid page data.");
      }

      const srcBytes = freshItem.bytes instanceof Uint8Array ? freshItem.bytes : new Uint8Array(freshItem.bytes);
      console.log("exportReordered: loading source PDF (bytes length)", srcBytes.length);
      const existingPdf = await PDFDocument.load(srcBytes);

      const srcPageCount = existingPdf.getPageCount ? existingPdf.getPageCount() : existingPdf.getPages().length;
      const outOfRange = pageIndices.find(i => i < 0 || i >= srcPageCount);
      if (outOfRange !== undefined && outOfRange !== null) {
        console.error("exportReordered: requested index outside source PDF pages", outOfRange, srcPageCount);
        return alert(`Export failed: requested page does not exist in the source PDF (source pages: ${srcPageCount}).`);
      }

      const newPdf = await PDFDocument.create();
      const copied = await newPdf.copyPages(existingPdf, pageIndices);
      copied.forEach(p => newPdf.addPage(p));

      const outBytes = await newPdf.save();
      const blob = new Blob([outBytes], { type: "application/pdf" });
      saveAs(blob, `customized-${freshItem.name}`);
      console.log("exportReordered: success", freshItem.name);
    } catch (err) {
      console.error("exportReordered error:", err);
      const message = err && err.message ? err.message : String(err);
      alert("Export failed: " + message + "\n\nAttempting fallback download of original file.");

      try {
        const src = item.bytes;
        if (src) {
          const srcUint8 = src instanceof Uint8Array ? src : new Uint8Array(src);
          const blob = new Blob([srcUint8], { type: "application/pdf" });
          saveAs(blob, `original-${item.name}`);
        }
      } catch (fallbackErr) {
        console.error("fallback download error:", fallbackErr);
      }
    }
  }

  return (
    <div className="container">
      <div className="header">
        <h1>Doc Customizer — Prototype</h1>
        <div className="toolbar">
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            multiple
            style={{ display: "none" }}
            onChange={(e) => handleFiles(e.target.files)}
          />
          <button className="btn btn-primary" onClick={() => inputRef.current.click()}>
            Upload PDF
          </button>
        </div>
      </div>

      <div className="files-row">
        {fileItems.length === 0 ? (
          <div className="notice">No files yet — upload a PDF to get started.</div>
        ) : (
          fileItems.map((f, i) => (
            <button
              key={f.id}
              onClick={() => onSelect(i)}
              className={`btn btn-ghost`}
              style={{ border: i === selectedIndex ? "2px solid #2563eb" : "1px solid #e5e7eb" }}
            >
              {f.name}
            </button>
          ))
        )}
      </div>

      {selectedIndex !== null && fileItems[selectedIndex] && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <strong>{fileItems[selectedIndex].name}</strong>
            <div>
              <button
                className="btn btn-primary"
                onClick={() => exportReordered(selectedIndex)}
                style={{ marginRight: 8 }}
              >
                Export reordered PDF
              </button>
              <button
                className="btn btn-ghost"
                onClick={() =>
                  alert("Compression and DOCX/PPTX features require a backend server (not included in this frontend-only MVP).")
                }
              >
                Compression (backend)
              </button>
            </div>
          </div>

          <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 12 }}>
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="pages" direction="horizontal">
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} className="thumbs-scroll">
                    {(fileItems[selectedIndex].pages || []).map((p, idx) => (
                      <Draggable key={`${p.pageNumber}-${idx}`} draggableId={`${p.pageNumber}-${idx}`} index={idx}>
                        {(prov) => (
                          <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps} className="thumb">
                            <img
                              src={p.thumb}
                              style={{ width: "100%", height: 120, objectFit: "contain", borderRadius: 6 }}
                              alt={`page-${p.pageNumber}`}
                            />
                            <div className="page-num">Page {p.pageNumber}</div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
            <div className="notice">Drag thumbnails left/right to reorder pages. Then click "Export reordered PDF".</div>
          </div>
        </div>
      )}
    </div>
  );
}
