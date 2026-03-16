// ═══════════════════════════════════════════════════════
// PDF → Image converter (client-side)
// Uses PDF.js 3.x UMD build — reliable in Next.js without
// webpack bundling conflicts or ESM module worker issues.
// ═══════════════════════════════════════════════════════

const PDFJS_VERSION = "3.11.174";
const PDFJS_CDN = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pdfjsLib: any = null;

function loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
        // Return immediately if already loaded
        if (document.querySelector(`script[src="${src}"]`)) {
            resolve();
            return;
        }
        const script = document.createElement("script");
        script.src = src;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
        document.head.appendChild(script);
    });
}

async function loadPdfJs() {
    if (pdfjsLib) return pdfjsLib;

    try {
        console.log("[pdfToImageUrl] Loading PDF.js UMD from CDN...");

        // Load the UMD bundle — this sets window.pdfjsLib
        await loadScript(`${PDFJS_CDN}/pdf.min.js`);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        pdfjsLib = (window as any)["pdfjs-dist/build/pdf"];

        if (!pdfjsLib?.GlobalWorkerOptions) {
            throw new Error("PDF.js loaded but GlobalWorkerOptions missing");
        }

        // Point at the matching UMD worker — no ESM module worker needed
        pdfjsLib.GlobalWorkerOptions.workerSrc = `${PDFJS_CDN}/pdf.worker.min.js`;

        console.log("[pdfToImageUrl] PDF.js ready.");
        return pdfjsLib;
    } catch (err) {
        pdfjsLib = null; // reset so next call retries
        console.error("[pdfToImageUrl] Failed to load PDF.js:", err);
        throw new Error(
            "Could not load PDF rendering engine. Check your network connection or upload a PNG/JPG instead."
        );
    }
}

export async function pdfToImageUrl(file: File): Promise<string> {
    const lib = await loadPdfJs();

    const arrayBuffer = await file.arrayBuffer();

    // disableWorker fallback: if the CDN worker also fails, render in main thread
    let pdf;
    try {
        pdf = await lib.getDocument({ data: arrayBuffer }).promise;
    } catch {
        console.warn("[pdfToImageUrl] Worker failed, retrying without worker...");
        lib.GlobalWorkerOptions.workerSrc = "";
        pdf = await lib.getDocument({ data: arrayBuffer, disableWorker: true }).promise;
    }

    const page = await pdf.getPage(1);

    // 2× scale for sharp floor plan details
    const scale = 2;
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not create canvas 2D context");

    await page.render({ canvasContext: ctx, viewport }).promise;

    return canvas.toDataURL("image/jpeg", 0.9);
}