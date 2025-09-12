import React, { useState, useRef, useEffect } from "react";
import { PDFDocument } from "pdf-lib";
import { saveAs } from "file-saver";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

/** CONFIG */
const MAX_FILE_SIZE_BYTES = 30 * 1024 * 1024; // 30 MB
const RENDER_LIMIT = 30; // render only first N thumbnails immediately per file
const THUMB_SCALE = 0.6; // thumbnail scale

/** Utility: read File -> Uint8Array */
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

/** Render a single thumbnail for a pageNumber from pdf bytes */
async function renderThumbForPage(pdfData, pageNumber, scale = THUMB_SCALE) {
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
  const fileItemsRef = useRef([]);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const inputRef = useRef();

  // Keep ref in sync to avoid stale closures during async tasks
  useEffect(() => {
    fileItemsRef.current = fileItems;
  }, [fileItems]);

  /** handle file uploads one by one */
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

      // get page count
      let pdf;
      try {
        const loading = pdfjsLib.getDocument({ data: bytes });
        pdf = await loading.promise;
      } catch (err) {
        console.error("pdfjs failed to load PDF", err);
