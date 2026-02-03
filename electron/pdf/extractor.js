"use strict";
/**
 * PDF Text Extraction Module
 * Extracts full text and sections from medical research PDFs
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractPDFText = extractPDFText;
exports.extractTables = extractTables;
exports.isScannedPDF = isScannedPDF;
const fs = __importStar(require("fs"));
const pdfParse = require("pdf-parse");
/**
 * Extract text and metadata from PDF
 */
async function extractPDFText(pdfPath) {
    const dataBuffer = fs.readFileSync(pdfPath);
    const pdfData = await pdfParse(dataBuffer);
    const fullText = pdfData.text;
    const pageCount = pdfData.numpages;
    // Extract metadata
    const metadata = extractMetadata(pdfData, fullText);
    // Detect and extract sections
    const sections = extractSections(fullText);
    return {
        fullText,
        pageCount,
        metadata,
        sections
    };
}
/**
 * Extract metadata from PDF
 */
function extractMetadata(pdfData, text) {
    const metadata = {};
    // Title from PDF metadata or first line
    if (pdfData.info?.Title) {
        metadata.title = pdfData.info.Title;
    }
    else {
        // Extract from first non-empty line
        const lines = text.split('\n').filter(l => l.trim().length > 0);
        if (lines.length > 0) {
            metadata.title = lines[0].trim();
        }
    }
    // Authors from PDF metadata
    if (pdfData.info?.Author) {
        metadata.authors = pdfData.info.Author.split(',').map((a) => a.trim());
    }
    // Year from text (look for 4-digit year)
    const yearMatch = text.match(/\b(19|20)\d{2}\b/);
    if (yearMatch) {
        metadata.year = parseInt(yearMatch[0]);
    }
    // DOI extraction
    const doiMatch = text.match(/DOI:\s*(10\.\d{4,}\/[^\s]+)/i) ||
        text.match(/(10\.\d{4,}\/[^\s]+)/);
    if (doiMatch) {
        metadata.doi = doiMatch[1];
    }
    return metadata;
}
/**
 * Detect and extract sections from full text
 */
function extractSections(text) {
    const sections = {};
    // Common section headers (case-insensitive)
    const sectionPatterns = {
        abstract: /(?:^|\n)\s*ABSTRACT\s*\n([\s\S]*?)(?=\n\s*(?:INTRODUCTION|BACKGROUND|METHODS|\d+\.|$))/i,
        introduction: /(?:^|\n)\s*(?:INTRODUCTION|BACKGROUND)\s*\n([\s\S]*?)(?=\n\s*(?:METHODS|MATERIALS|\d+\.|$))/i,
        methods: /(?:^|\n)\s*(?:METHODS|MATERIALS AND METHODS|METHODOLOGY)\s*\n([\s\S]*?)(?=\n\s*(?:RESULTS|FINDINGS|\d+\.|$))/i,
        results: /(?:^|\n)\s*(?:RESULTS|FINDINGS)\s*\n([\s\S]*?)(?=\n\s*(?:DISCUSSION|CONCLUSION|\d+\.|$))/i,
        discussion: /(?:^|\n)\s*DISCUSSION\s*\n([\s\S]*?)(?=\n\s*(?:CONCLUSION|REFERENCES|ACKNOWLEDGMENT|\d+\.|$))/i,
        conclusion: /(?:^|\n)\s*(?:CONCLUSION|CONCLUSIONS)\s*\n([\s\S]*?)(?=\n\s*(?:REFERENCES|ACKNOWLEDGMENT|\d+\.|$))/i,
        references: /(?:^|\n)\s*(?:REFERENCES|BIBLIOGRAPHY)\s*\n([\s\S]*?)$/i
    };
    // Extract each section
    for (const [sectionName, pattern] of Object.entries(sectionPatterns)) {
        const match = text.match(pattern);
        if (match && match[1]) {
            sections[sectionName] = cleanSectionText(match[1]);
        }
    }
    // If no abstract found, use first paragraph
    if (!sections.abstract) {
        const paragraphs = text.split('\n\n').filter(p => p.trim().length > 100);
        if (paragraphs.length > 0) {
            sections.abstract = cleanSectionText(paragraphs[0]);
        }
    }
    return sections;
}
/**
 * Clean section text (remove extra whitespace, fix line breaks)
 */
function cleanSectionText(text) {
    return text
        .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines with double
        .replace(/\s+/g, ' ') // Normalize whitespace
        .replace(/- \n/g, '') // Fix hyphenated line breaks
        .trim();
}
/**
 * Extract tables from PDF (simplified)
 */
function extractTables(text) {
    // TODO: Implement table extraction
    // This is a complex task - consider using pdf.js for better table detection
    return [];
}
/**
 * Check if PDF appears to be scanned (OCR needed)
 */
function isScannedPDF(pdfData) {
    // Heuristic: If very little text extracted relative to page count
    const textLength = pdfData.text.length;
    const pageCount = pdfData.numpages;
    const avgTextPerPage = textLength / pageCount;
    // If average text per page < 200 chars, likely scanned
    return avgTextPerPage < 200;
}
