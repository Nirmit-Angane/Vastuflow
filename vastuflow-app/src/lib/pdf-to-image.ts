// ═══════════════════════════════════════════════════════
// PDF → Image converter (client-side)
// Loads PDF.js from CDN to avoid webpack bundling issues
// ═══════════════════════════════════════════════════════

const PDFJS_CDN = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379";

let pdfjsLib: unknown = null;

async function loadPdfJs() {
    if (pdfjsLib) return pdfjsLib;

    try {
        console.log("[pdfToImageUrl] Dynamically importing PDF.js from CDN...");

        // Native ES module import from CDN, explicit webpackignore to prevent Next.js bundling issues
        // We use an explicit relative URL bypass if needed, but direct CDN works in modern browsers
        const module = await import(
            /* webpackIgnore: true */
            `${PDFJS_CDN}/pdf.min.mjs`
        );

        pdfjsLib = module;

        if (pdfjsLib && (pdfjsLib as any).GlobalWorkerOptions) {
            (pdfjsLib as any).GlobalWorkerOptions.workerSrc = `${PDFJS_CDN}/pdf.worker.min.mjs`;
            console.log("[pdfToImageUrl] PDF.js loaded successfully.");
        } else {
            throw new Error("pdfjsLib exported but GlobalWorkerOptions missing");
        }

        return pdfjsLib;
    } catch (err) {
        console.error("[pdfToImageUrl] Failed to load PDF.js from CDN:", err);
        throw new Error("Could not load PDF rendering engine. Please check your network connection or try a PNG/JPG instead.");
    }
}

export async function pdfToImageUrl(file: File): Promise<string> {
    const lib = await loadPdfJs() as any;

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await lib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1);

    // Render at 2x scale for sharp floor plan details
    const scale = 2;
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not create canvas context");

    await page.render({ canvasContext: ctx, viewport }).promise;

    // Convert to blob URL
    return new Promise<string>((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (!blob) return reject(new Error("Canvas toBlob failed"));
                resolve(URL.createObjectURL(blob));
            },
            "image/png",
        );
    });
}
