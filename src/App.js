import React, { useState, useRef } from "react";
import { PDFDocument } from "pdf-lib";
import { saveAs } from "file-saver";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

/**
 * Helper: read File -> Uint8Array
 */
function readAsUint8Array(file) {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => {
      try {
        const ab = fr.result;
        const u8 = ab instanceof Uint8Array ? ab : new Uint8Array(ab);
        res(u8);
      } catch (e) {
        rej(e);
      }
    };
    fr.onerror = rej;
    fr.readAsArrayBuffer(file);
  });
}

export default function App() {
  // fileItems: [{ id, name, bytes: Uint8Array, pages: [{ pageNumber, thumb }] }]
  const [fileItems, setFileItems] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const inputRef = useRef();

  /** Handle uploaded files */
  async function handleFiles(files) {
    const arr = Array.from(files || []);
    const added = [];
    for (const f of arr) {
      if (!f) continue;
      try {
        const bytes = await readAsUint8Array(f);
        added.push({
          id: `${Date.now()}-${Math.random().to
