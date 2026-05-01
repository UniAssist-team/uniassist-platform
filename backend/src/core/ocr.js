import { createWorker } from "tesseract.js";
import fs from "fs/promises";
import { PDFParse } from "pdf-parse";

const OCR_RENDER_SCALE = 2;
export const OCR_FALLBACK_TEXT_LIMIT = 200;

/**
 * Render each page as a raster screenshot at OCR_RENDER_SCALE and OCR them. This is the
 * fallback for scanned PDFs whose text layer is empty/sparse: extracting embedded image
 * objects gives garbage on most scans because the page is composed of many fragments,
 * rasterising the rendered page is what produces faithful OCR output.
 *
 * Tesseract worker is created and terminated per call: simpler than a singleton, at the
 * cost of ~1-2s startup per upload.
 *
 * @param {string} filePath
 * @returns {Promise<string>}
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

	if (pages.length === 0) return "";

	const langs = process.env.OCR_LANGS ?? "eng";
	const worker = await createWorker(langs);
	try {
		/** @type {string[]} */
		const texts = [];
		for (const page of pages) {
			const { data } = await worker.recognize(Buffer.from(page.data));
			const text = data.text.trim();
			if (text) texts.push(text);
		}
		return texts.join("\n\n");
	} finally {
		await worker.terminate();
	}
}
