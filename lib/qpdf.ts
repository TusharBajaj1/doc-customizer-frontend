"use client";

// qpdf (WebAssembly) runs fully in the browser: used for password protect / unlock.
export async function runQpdf(args: string[], input: Uint8Array): Promise<Uint8Array> {
  const createModule = (await import("@neslinesli93/qpdf-wasm")).default;
  const log: string[] = [];
  // The bundled typings only describe locateFile; the Emscripten runtime accepts more.
  const init = createModule as unknown as (o: Record<string, unknown>) => ReturnType<typeof createModule>;
  const qpdf = (await init({
    locateFile: () => "/wasm/qpdf.wasm",
    noInitialRun: true,
    print: (s: string) => log.push(s),
    printErr: (s: string) => log.push(s),
  })) as Awaited<ReturnType<typeof createModule>> & { FS: { writeFile(p: string, d: Uint8Array): void } };
  qpdf.FS.writeFile("/in.pdf", input);
  try {
    qpdf.callMain([...args, "/in.pdf", "/out.pdf"]);
  } catch {
    // Emscripten throws on process exit; the result is checked below.
  }
  try {
    return qpdf.FS.readFile("/out.pdf") as Uint8Array;
  } catch {
    const msg = log.join(" ");
    if (/invalid password/i.test(msg)) throw new Error("Wrong password.");
    throw new Error(msg || "Could not process this PDF.");
  }
}

export const protectPdf = (bytes: Uint8Array, password: string) =>
  runQpdf(["--encrypt", password, password, "256", "--"], bytes);

export const unlockPdf = (bytes: Uint8Array, password: string) =>
  runQpdf([`--password=${password}`, "--decrypt"], bytes).catch(() => {
    throw new Error("Couldn't unlock this PDF. Check that the password is correct.");
  });
