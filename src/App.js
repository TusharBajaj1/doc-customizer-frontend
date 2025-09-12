import React, { useState, useRef } from "react";
import { PDFDocument } from "pdf-lib";
import { saveAs } from "file-saver";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

/**
 * Read File -> Uint8Array
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

/**
 * Render a single thumbnail for pageNumber from pdf (Uint8Array) and return dataURL
 */
async function renderThumbForPage(pdfData, pageNumber, scale = 0.6) {
  const loading = pdfjsLib.getDocument({ data: pdfData });
  const pdf = await loading.promise;
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const ctx = canvas.getContext("2d");
  await page.render({ canvasContext: ctx, viewport }).promise;
  return canvas.toDataURL("image/png");
}

export default function App() {
  // fileItems: [{ id, name, bytes: Uint8Array, pages: [{ pageNumber, thumb|null }], isRendering }]
  const [fileItems, setFileItems] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const inputRef = useRef();

  /**
   * Called when files are selected by user.
   * Creates placeholder pages immediately (so reordering works), and starts async thumbnail rendering.
   */
  async function handleFiles(files) {
    const arr = Array.from(files || []);
    const added = [];

    for (const f of arr) {
      try {
        const bytes = await readAsUint8Array(f);

        // discover number of pages synchronously (pdfjs getDocument)
        const loading = pdfjsLib.getDocument({ data: bytes });
        const pdf = await loading.promise;
        const totalPages = pdf.numPages || 0;

        // create placeholder pages array (thumb=null initially)
        const pages = [];
        for (let i = 1; i <= totalPages; i++) {
          pages.push({ pageNumber: i, thumb: null });
        }

        const item = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: f.name,
          bytes,
          pages,
          isRendering: true, // thumbnails being generated
        };

        added.push(item);

        // start rendering thumbnails asynchronously (don't await here to keep UI responsive)
        (async () => {
          try {
            const thumbs = [];
            // We'll render sequentially; for large PDFs you may want to throttle or render first N quickly
            for (let p = 1; p <= totalPages; p++) {
              const thumb = await renderThumbForPage(bytes, p, 0.6);
              thumbs.push(thumb);
              // update progressive thumbnails so user sees them appear
              setFileItems((prev) => {
                const copy = [...prev];
                const idx = copy.findIndex(ci => ci && ci.id === item.id);
                if (idx === -1) return prev;
                // assign thumbnails we've rendered so far
                const newPages = copy[idx].pages.map(pg => {
                  if (pg.pageNumber <= thumbs.length) {
                    return { pageNumber: pg.pageNumber, thumb: thumbs[pg.pageNumber - 1] };
                  }
                  return pg;
                });
                copy[idx] = { ...copy[idx], pages: newPages, isRendering: p < totalPages }; // still rendering if not done
                return copy;
              });
            }
            // final update: mark rendering done
            setFileItems((prev) => {
              const copy = [...prev];
              const idx = copy.findIndex(ci => ci && ci.id === item.id);
              if (idx === -1) return prev;
              copy[idx] = { ...copy[idx], isRendering: false };
              return copy;
            });
          } catch (thumbErr) {
            console.error("Thumbnail rendering error for", item.name, thumbErr);
            // mark rendering false to allow export attempts and show partial thumbs
            setFileItems((prev) => {
              const copy = [...prev];
              const idx = copy.findIndex(ci => ci && ci.id === item.id);
              if (idx === -1) return prev;
              copy[idx] = { ...copy[idx], isRendering: false };
              return copy;
            });
          }
        })();

      } catch (err) {
        console.error("Failed to read/load PDF:", f.name, err);
        alert(`Failed to read or load PDF ${f.name}. Try a different file.`);
      }
    }

    if (added.length > 0) {
      setFileItems(prev => {
        const combined = [...prev, ...added];
        return combined;
      });
      if (selectedIndex === null) setSelectedIndex(0);
    }
  }

  function onSelect(idx) {
    setSelectedIndex(idx);
    // pages already created during upload; thumbnails render asynchronously
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
   * Export reordered PDF safely: requires that pages array exists and rendering is complete or partially ok.
   */
  async function exportReordered(idx) {
    if (idx === null || idx === undefined) return alert("No file selected.");
    const item = fileItems[idx];
    if (!item) return alert("No file selected.");

    // Defensive: ensure we have page placeholders
    if (!item.pages || item.pages.length === 0) {
      return alert("This file has no page information. Try re-uploading or a different PDF.");
    }

    // If still rendering, warn user and ask to wait (we honor user's wish to not block forever)
    if (item.isRendering) {
      // give user clear option: wait or continue (continuing may produce odd exports if thumbs/order incomplete)
      const cont = window.confirm("Thumbnails are still rendering. Export now may lead to incorrect results. Continue anyway?");
      if (!cont) return;
    }

    try {
      // Build zero-based index array using current page order
      const pageIndices = item.pages.map(p => {
        const n = Number(p.pageNumber);
        return Number.isFinite(n) ? n - 1 : -1;
      });

      console.log("Export requested. pageIndices:", pageIndices);

      // Validate indices not negative
      if (pageIndices.some(i => i < 0)) {
        console.error("Invalid pageNumbers detected:", item.pages);
        return alert("Export failed: invalid page numbers in the document.");
      }

      const srcBytes = item.bytes instanceof Uint8Array ? item.bytes : new Uint8Array(item.bytes);
      console.log("Source bytes length:", srcBytes.length);

      const existingPdf = await PDFDocument.load(srcBytes);
      const srcPageCount = existingPdf.getPageCount ? existingPdf.getPageCount() : existingPdf.getPages().length;
      console.log("Source PDF page count:", srcPageCount);

      // Validate indices in source range
      const outOfRange = pageIndices.find(i => i < 0 || i >= srcPageCount);
      if (outOfRange !== undefined) {
        console.error("Requested index out of range:", outOfRange, "srcPageCount:", srcPageCount);
        return alert(`Export failed: requested page does not exist in source PDF (pages: ${srcPageCount}).`);
      }

      // Copy pages in requested order
      const newPdf = await PDFDocument.create();
      const copied = await newPdf.copyPages(existingPdf, pageIndices);
      console.log("copied length:", copied.length, "expected:", pageIndices.length);

      if (!copied || copied.length === 0) {
        console.error("copyPages returned empty list.");
        return alert("Export failed: unable to copy pages from source PDF.");
      }
      copied.forEach(p => newPdf.addPage(p));

      // Save with safe option
      const outBytes = await newPdf.save({ useObjectStreams: false });
      const outLen = outBytes && outBytes.length ? outBytes.length : (outBytes && outBytes.byteLength ? outBytes.byteLength : 0);
      console.log("outBytes length:", outLen);

      if (!outLen || outLen === 0) {
        console.error("Generated PDF is empty.");
        throw new Error("Generated PDF is empty.");
      }

      const blob = new Blob([outBytes], { type: "application/pdf" });
      saveAs(blob, `customized-${item.name}`);
      console.log("Export success for", item.name);

    } catch (err) {
      console.error("exportReordered error:", err);
      const message = err && err.message ? err.message : String(err);
      alert("Export failed: " + message + "\n\nOffering original file as fallback.");

      // fallback download original
      try {
        const src = item.bytes;
        if (src) {
          const srcUint8 = src instanceof Uint8Array ? src : new Uint8Array(src);
          const blob = new Blob([srcUint8], { type: "application/pdf" });
          saveAs(blob, `original-${item.name}`);
          console.log("Fallback download triggered.");
        }
      } catch (fallbackErr) {
        console.error("Fallback download error:", fallbackErr);
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
              {f.name} {f.isRendering ? " (rendering...)" : ""}
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
                disabled={fileItems[selectedIndex].isRendering}
                title={fileItems[selectedIndex].isRendering ? "Wait for thumbnails to finish rendering" : "Export reordered PDF"}
              >
                Export reordered PDF
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => alert("Compression and DOCX/PPTX features require a backend server (not included in this frontend-only MVP).")}
              >
                Compression (backend)
              </button>
            </div>
          </div>

          <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 12 }}>
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="pages" direction="horizontal">
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} className="thumbs-scroll" style={{ display: "flex", gap: 12, overflow: "auto", padding: 8 }}>
                    {(fileItems[selectedIndex].pages || []).map((p, idx) => (
                      <Draggable key={`${fileItems[selectedIndex].id}-page-${p.pageNumber}-${idx}`} draggableId={`${fileItems[selectedIndex].id}-page-${p.pageNumber}-${idx}`} index={idx}>
                        {(prov) => (
                          <div
                            ref={prov.innerRef}
                            {...prov.draggableProps}
                            {...prov.dragHandleProps}
                            className="thumb"
                            style={{ width: 160, padding: 8, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, textAlign: "center", flex: "0 0 auto" }}
                          >
                            {p.thumb ? (
                              <img src={p.thumb} style={{ width: "100%", height: 120, objectFit: "contain", borderRadius: 6 }} alt={`page-${p.pageNumber}`} />
                            ) : (
                              <div style={{ width: "100%", height: 120, display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280" }}>
                                {fileItems[selectedIndex].isRendering ? "Rendering..." : "No preview"}
                              </div>
                            )}
                            <div className="page-num" style={{ marginTop: 8 }}>Page {p.pageNumber}</div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
            <div className="notice" style={{ marginTop: 8 }}>
              Drag thumbnails to reorder pages. Export disabled while thumbnails render.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
