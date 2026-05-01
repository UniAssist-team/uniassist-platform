import fs from "fs/promises";
import { PDFParse } from "pdf-parse";
import { inferDiscountsOllama } from "./ollama.js";

const PDF_MAGIC = "%PDF-";

/**
 * @typedef {Object} Discount
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {string} requiredDocuments
 */

/**
 * @typedef {Object} DiscountMatch
 * @property {string} discountId
 * @property {number} confidence
 * @property {string} reason
 */

/**
 * @param {string} filePath
 * @returns {Promise<void>}
 */
export async function ensurePdf(filePath) {
	const handle = await fs.open(filePath, "r");
	try {
		const buf = Buffer.alloc(PDF_MAGIC.length);
		const { bytesRead } = await handle.read(buf, 0, PDF_MAGIC.length, 0);
		if (bytesRead < PDF_MAGIC.length || buf.toString("utf8") !== PDF_MAGIC) {
			throw new Error("File is not a PDF");
		}
	} finally {
		await handle.close();
	}
}

/**
 * @param {string} filePath
 * @returns {Promise<string>}
 */
export async function extractTextFromPdf(filePath) {
	const buffer = await fs.readFile(filePath);
	const parser = new PDFParse({ data: buffer });
	try {
		const result = await parser.getText();
		return result.text;
	} finally {
		await parser.destroy();
	}
}

/**
 * @param {string} fileText
 * @param {Discount[]} possibleDiscounts
 * @returns {Promise<DiscountMatch[]>}
 */
export async function inferDiscounts(fileText, possibleDiscounts) {
	if (!process.env.OLLAMA_API_KEY) {
		return [];
	}
	try {
		return await inferDiscountsOllama(fileText, possibleDiscounts);
	} catch (err) {
		console.error("Ollama inference failed, using naive fallback:", err);
		return [];
	}
}
