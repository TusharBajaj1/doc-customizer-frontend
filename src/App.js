import React, { useState, useRef, useEffect } from "react";
import { PDFDocument } from "pdf-lib";
import { saveAs } from "file-saver";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

/**
 * Stable MVP with Remove-file functionality added.
 * - Upload PDFs, reorder pages, export reordered PDF.
 * - Remove uploaded PDF from list (with confirmation).
 */

const MAX_FILE_SIZE_BYTES = 30 * 1024 * 1024; // 30 MB

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
  // fileItems: [{ id, name, bytes: Uint8Array, pages: [{ pageNumber }], totalPages }]
  const [fileItems, setFileItems] = useState([]);
  const fileItemsRef = useRef([]);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const inputRef = useRef();

  // Keep ref in sync with state to avoid stale closures
  useEffect(() => {
    fileItemsRef.current = fileItems;
  }, [fileItems]);

  async function handleFiles(files) {
    const arr = Array.from(files || []);
    if (!arr.length) return;

    for (const f of arr) {
      if (!f) continue;
      if (f.size > MAX_FILE_SIZE_BYTES) {
        alert(`"${f.name}" is too large. Max ${Math.round(MAX_FILE_SIZE_BYTES / (1024 * 1024))} MB allowed.`);
        continue;
      }

      let bytes;
      try {
        bytes = await readAsUint8Array(f);
      } catch (err) {
        console.error("Failed to read file bytes", err);
        alert(`Failed to read file ${f.name}. Try again.`);
        continue;
      }

      // Load with pdf-lib to get page count
      let existingPdf;
      try {
        existingPdf = await PDFDocument.load(bytes);
      } catch (err) {
        console.error("pdf-lib failed to load PDF:", err);
        alert(`Cannot load ${f.name}. It may be corrupted or encrypted.`);
        continue;
      }

      const totalPages = existingPdf.getPageCount ? existingPdf.getPageCount() : existingPdf.getPages().length;
      if (!totalPages || totalPages <= 0) {
        alert(`PDF ${f.name} appears to have no pages.`);
        continue;
      }

      const pages = [];
      for (let i = 1; i <= totalPages; i++) pages.push({ pageNumber: i });

      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const item = { id, name: f.name, bytes, pages, totalPages };

      setFileItems((prev) => {
        const next = [...prev, item];
        return next;
      });

      setSelectedIndex((prev) => (prev === null ? 0 : prev));
    }
  }

  function onSelect(idx) {
    setSelectedIndex(idx);
  }

  function onDragEnd(result) {
    if (!result.destination) return;
    if (selectedIndex === null) return;

    setFileItems((prev) => {
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

  /**
   * Remove a file by index (asks for confirmation)
   */
  function removeFile(idx) {
    if (idx === null || idx === undefined) return;
    const file = fileItems[idx];
    if (!file) return;
    const ok = window.confirm(`Remove "${file.name}" from the list? This cannot be undone in this session.`);
    if (!ok) return;

    setFileItems((prev) => {
      const copy = [...prev];
      copy.splice(idx, 1);
      return copy;
    });

    // update selection
    setSelectedIndex((prevSel) => {
      if (prevSel === null) return null;
      if (idx < prevSel) return prevSel - 1; // index removed before current selection
      if (idx === prevSel) {
        // If we removed the currently selected file, select the next file if exists, otherwise previous, else null
        const newLength = fileItems.length - 1;
        if (newLength <= 0) return null;
        if (idx <= newLength - 1) return idx; // select file that shifted into this index
        return newLength - 1; // select last
      }
      return prevSel;
    });
  }

  async function exportReordered(idx) {
    if (idx === null || idx === undefined) return alert("No file selected.");
    const currentFiles = fileItemsRef.current;
    const item = currentFiles[idx];
    if (!item) return alert("No file selected.");

    if (!item.pages || item.pages.length === 0) {
      return alert("No page data found. Try re-uploading.");
    }

    try {
      const pageIndices = item.pages.map((p) => {
        const n = Number(p.pageNumber);
        return Number.isFinite(n) ? n - 1 : -1;
      });

      console.log("Export requested. pageIndices:", pageIndices);

      if (pageIndices.some((i) => i < 0)) {
        console.error("Invalid pageNumbers detected:", item.pages);
        return alert("Export failed: invalid page numbers.");
      }

      const srcBytes = item.bytes instanceof Uint8Array ? item.bytes : new Uint8Array(item.bytes);
      console.log("Source bytes length:", srcBytes.length);

      const existingPdf = await PDFDocument.load(srcBytes);
      const srcPageCount = existingPdf.getPageCount ? existingPdf.getPageCount() : existingPdf.getPages().length;
      console.log("Source PDF page count:", srcPageCount);

      const outOfRange = pageIndices.find((i) => i < 0 || i >= srcPageCount);
      if (outOfRange !== undefined) {
        console.error("Requested index out of range:", outOfRange, "srcPageCount:", srcPageCount);
        return alert(`Export failed: requested page does not exist in source (pages: ${srcPageCount}).`);
      }

      const newPdf = await PDFDocument.create();
      const copied = await newPdf.copyPages(existingPdf, pageIndices);
      console.log("copied length:", copied.length, "expected:", pageIndices.length);

      if (!copied || copied.length === 0) {
        console.error("copyPages returned empty array.");
        return alert("Export failed: unable to copy pages from source PDF.");
      }

      copied.forEach((p) => newPdf.addPage(p));

      const outBytes = await newPdf.save({ useObjectStreams: false });
      const outLen = outBytes && (outBytes.length || outBytes.byteLength) ? (outBytes.length || outBytes.byteLength) : 0;
      console.log("outBytes length:", outLen);

      if (!outLen || outLen === 0) {
        console.error("Generated PDF is empty.");
        throw new Error("Generated PDF is empty.");
      }

      const blob = new Blob([outBytes], { type: "application/pdf" });

      try {
        saveAs(blob, `customized-${item.name}`);
      } catch (saveErr) {
        console.warn("saveAs failed, falling back to blob URL", saveErr);
        const url = URL.createObjectURL(blob);
        window.open(url);
      }

      console.log("Export success for", item.name);
    } catch (err) {
      console.error("exportReordered error:", err);
      const message = err && err.message ? err.message : String(err);
      alert("Export failed: " + message + "\n\nOffering original file as fallback.");

      try {
        const src = item.bytes;
        if (src) {
          const srcUint8 = src instanceof Uint8Array ? src : new Uint8Array(src);
          const blob = new Blob([srcUint8], { type: "application/pdf" });
          try {
            saveAs(blob, `original-${item.name}`);
          } catch (saErr) {
            const url = URL.createObjectURL(blob);
            window.open(url);
          }
        }
      } catch (fallbackErr) {
        console.error("Fallback download error:", fallbackErr);
      }
    }
  }

  // Render file buttons with a small delete button per file
  function renderFileButtons() {
    return fileItems.map((f, i) => (
      <div key={f.id} style={{ display: "inline-flex", alignItems: "center", gap: 8, marginRight: 8, marginBottom: 8 }}>
        <button
          onClick={() => onSelect(i)}
          className="btn btn-ghost"
          style={{ border: i === selectedIndex ? "2px solid #2563eb" : "1px solid #e5e7eb" }}
        >
          {f.name} ({f.totalPages})
        </button>
        <button
          onClick={() => removeFile(i)}
          className="btn"
          style={{ background: "#ef4444", color: "#fff", padding: "6px 8px", borderRadius: 6, border: "none", cursor: "pointer" }}
          title={`Remove ${f.name}`}
        >
          Delete
        </button>
      </div>
    ));
  }

  return (
    <div className="container">
      <div className="header">
        <h1>Doc Customizer — Stable MVP</h1>
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

      <div className="files-row">{fileItems.length === 0 ? <div className="notice">No files yet — upload a PDF to get started.</div> : renderFileButtons()}</div>

      {selectedIndex !== null && fileItems[selectedIndex] && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <strong>{fileItems[selectedIndex].name}</strong>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="btn btn-primary"
                onClick={() => exportReordered(selectedIndex)}
                style={{ marginRight: 8 }}
              >
                Export reordered PDF
              </button>
              <button
                className="btn"
                onClick={() => removeFile(selectedIndex)}
                style={{ background: "#ef4444", color: "#fff", padding: "8px 10px", borderRadius: 6, border: "none" }}
                title="Remove this file"
              >
                Remove file
              </button>
            </div>
          </div>

          <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 12 }}>
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="pages" direction="horizontal">
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} className="thumbs-scroll" style={{ display: "flex", gap: 12, overflow: "auto", padding: 8 }}>
                    {(fileItems[selectedIndex].pages || []).map((p, idx) => {
                      const stableId = `${fileItems[selectedIndex].id}-page-${p.pageNumber}`;
                      return (
                        <Draggable key={stableId} draggableId={stableId} index={idx}>
                          {(prov) => (
                            <div
                              ref={prov.innerRef}
                              {...prov.draggableProps}
                              {...prov.dragHandleProps}
                              style={{
                                width: 140,
                                padding: 8,
                                background: "#fff",
                                border: "1px solid #e5e7eb",
                                borderRadius: 8,
                                textAlign: "center",
                                flex: "0 0 auto",
                              }}
                            >
                              <div style={{ height: 100, display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280" }}>
                                Page {p.pageNumber}
                              </div>
                              <div className="page-num" style={{ marginTop: 8 }}>
                                Page {p.pageNumber}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
            <div className="notice" style={{ marginTop: 8 }}>
              Drag page boxes to reorder. Export will produce the reordered PDF.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
