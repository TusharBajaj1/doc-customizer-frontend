import React, { useState, useRef } from "react";
import { PDFDocument } from "pdf-lib";
import { saveAs } from "file-saver";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

function readAsArrayBuffer(file) {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result);
    fr.onerror = rej;
    fr.readAsArrayBuffer(file);
  });
}

export default function App() {
  const [fileItems, setFileItems] = useState([]); // [{id,name,bytes,pages:[{pageNumber,thumb}]}]
  const [selectedIndex, setSelectedIndex] = useState(null);
  const inputRef = useRef();

  async function handleFiles(files) {
    const arr = Array.from(files || []);
    const added = [];
    for (const f of arr) {
      if (!f) continue;
      const bytes = await readAsArrayBuffer(f);
      added.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2,6)}`, name: f.name, bytes, pages: [] });
    }
    setFileItems(s => [...s, ...added]);
    if (selectedIndex === null && added.length) setSelectedIndex(0);
  }

  async function ensurePages(idx) {
    const item = fileItems[idx];
    if (!item || (item.pages && item.pages.length)) return;
    try {
      const loading = pdfjsLib.getDocument({ data: item.bytes });
      const pdf = await loading.promise;
      const pages = [];
      for (let i = 1; i <= pdf.numPages; i++) {
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
      const copy = [...fileItems];
      copy[idx] = { ...copy[idx], pages };
      setFileItems(copy);
    } catch (e) {
      console.error("error rendering", e);
      alert("Failed to read PDF pages. Maybe file is corrupted or too large.");
    }
  }

  function onSelect(idx) {
    setSelectedIndex(idx);
    ensurePages(idx);
  }

  function onDragEnd(result) {
    if (!result.destination) return;
    const copy = [...fileItems];
    const item = copy[selectedIndex];
    if (!item || !item.pages) return;
    const pages = Array.from(item.pages);
    const [moved] = pages.splice(result.source.index, 1);
    pages.splice(result.destination.index, 0, moved);
    copy[selectedIndex] = { ...item, pages };
    setFileItems(copy);
  }

  async function exportReordered(idx) {
    const item = fileItems[idx];
    if (!item) return;
    if (!item.pages || item.pages.length === 0) await ensurePages(idx);
    try {
      const existing = await PDFDocument.load(item.bytes);
      const newPdf = await PDFDocument.create();
      const indices = item.pages.map(p => p.pageNumber - 1);
      const copied = await newPdf.copyPages(existing, indices);
      copied.forEach(p => newPdf.addPage(p));
      const out = await newPdf.save();
      const blob = new Blob([out], { type: "application/pdf" });
      saveAs(blob, `customized-${item.name}`);
    } catch (e) {
      console.error(e);
      alert("Export failed.");
    }
  }

  return (
    <div className="container">
      <div className="header">
        <h1>Doc Customizer — Prototype</h1>
        <div className="toolbar">
          <input ref={inputRef} type="file" accept="application/pdf" multiple style={{ display: "none" }} onChange={(e) => handleFiles(e.target.files)} />
          <button className="btn btn-primary" onClick={() => inputRef.current.click()}>Upload PDF</button>
        </div>
      </div>

      <div className="files-row">
        {fileItems.length === 0 ? <div className="notice">No files yet — upload a PDF to get started.</div> :
          fileItems.map((f, i) => (
            <button key={f.id} onClick={() => onSelect(i)} className={`btn btn-ghost`} style={{ border: i===selectedIndex ? "2px solid #2563eb" : "1px solid #e5e7eb" }}>
              {f.name}
            </button>
          ))}
      </div>

      {selectedIndex !== null && fileItems[selectedIndex] && (
        <div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
            <strong>{fileItems[selectedIndex].name}</strong>
            <div>
              <button className="btn btn-primary" onClick={() => exportReordered(selectedIndex)} style={{marginRight:8}}>Export reordered PDF</button>
              <button className="btn btn-ghost" onClick={() => alert("Compression and DOCX/PPTX features require a backend server (not included in this frontend-only MVP).")}>Compression (backend)</button>
            </div>
          </div>

          <div style={{ border:"1px solid #e5e7eb", borderRadius:8, padding:12 }}>
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="pages" direction="horizontal">
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} className="thumbs-scroll">
                    {(fileItems[selectedIndex].pages || []).map((p, idx) => (
                      <Draggable key={p.pageNumber} draggableId={String(p.pageNumber)} index={idx}>
                        {(prov) => (
                          <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps} className="thumb">
                            <img src={p.thumb} style={{ width:"100%", height:120, objectFit:"contain", borderRadius:6 }} alt={`page-${p.pageNumber}`} />
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
