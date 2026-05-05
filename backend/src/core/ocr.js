import { createWorker } from "tesseract.js";
import fs from "fs/promises";
import { PDFParse } from "pdf-parse";

const OCR_RENDER_SCALE = 2;
export const OCR_FALLBACK_TEXT_LIMIT = 200;

/** @type {Promise<import("tesseract.js").Worker[]> | null} */
let workerPoolPromise = null;

function getWorkerPool() {
	if (workerPoolPromise) return workerPoolPromise;
	const langs = process.env.OCR_LANGS ?? "eng";
	const size = Math.max(1, Number(process.env.OCR_WORKERS ?? 2));
	workerPoolPromise = Promise.all(
		Array.from({ length: size }, () => createWorker(langs)),
	);
	return workerPoolPromise;
}

/**
 * Eagerly initialise the tesseract worker pool. Safe to call at app start;
 * fire-and-forget. Subsequent OCR calls reuse the pre-warmed workers.
 * @returns {Promise<void>}
 */
export async function prewarmOcr() {
	await getWorkerPool();
}

/**
 * Terminate all pooled workers and reset the pool. Intended for tests.
 * @returns {Promise<void>}
 */
export async function terminateOcrWorkers() {
	if (!workerPoolPromise) return;
	const workers = await workerPoolPromise;
	workerPoolPromise = null;
	await Promise.all(workers.map((w) => w.terminate()));
}

/**
 * Render each page as a raster screenshot at OCR_RENDER_SCALE and OCR them in
 * parallel across a long-lived worker pool (size = OCR_WORKERS, default 2).
 *
 * @param {string} filePath
 * @returns {Promise<{ text: string, pageCount: number }>}
 */
export async function extractTextFromPdfImages(filePath) {
	const buffer = await fs.readFile(filePath);
	const parser = new PDFParse({ data: buffer });
	/** @type {import("pdf-parse").Screenshot[]} */
	let pages;
	try {
		const result = await parser.getScreenshot({ scale: OCR_RENDER_SCALE });
		pages = result.pages;
	} finally {
		await parser.destroy();
	}

	if (pages.length === 0) return { text: "", pageCount: 0 };

	const workers = await getWorkerPool();
	/** @type {import("pdf-parse").Screenshot[][]} */
	const batches = workers.map(() => []);
	pages.forEach((page, i) => {
		batches[i % workers.length].push(page);
	});

	const batchResults = await Promise.all(
		workers.map(async (worker, i) => {
			/** @type {string[]} */
			const out = [];
			for (const page of batches[i]) {
				const { data } = await worker.recognize(Buffer.from(page.data));
				const text = data.text.trim();
				if (text) out.push(text);
			}
			return out;
		}),
	);

	return {
		text: batchResults.flat().join("\n\n"),
		pageCount: pages.length,
	};
}
