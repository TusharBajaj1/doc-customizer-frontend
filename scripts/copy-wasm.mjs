// Copies the qpdf WebAssembly binary into /public so the browser can fetch it.
import { copyFileSync, mkdirSync } from "node:fs";
mkdirSync("public/wasm", { recursive: true });
copyFileSync("node_modules/@neslinesli93/qpdf-wasm/dist/qpdf.wasm", "public/wasm/qpdf.wasm");
