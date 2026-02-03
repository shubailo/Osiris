/**
 * PDF Text Extraction Module
 * Extracts full text and sections from medical research PDFs
 */

import * as fs from 'fs';
import pdfParse = require('pdf-parse');

export interface PDFExtractionResult {
    fullText: string;
    pageCount: number;
    metadata: {
        title?: string;
        authors?: string[];
        year?: number;
        doi?: string;
    };
    sections: {
        abstract?: string;
        introduction?: string;
        methods?: string;
        results?: string;
        discussion?: string;
        conclusion?: string;
        references?: string;
    };
}

/**
 * Extract text and metadata from PDF
 */
export async function extractPDFText(pdfPath: string): Promise<PDFExtractionResult> {
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
function extractMetadata(pdfData: any, text: string): PDFExtractionResult['metadata'] {
    const metadata: PDFExtractionResult['metadata'] = {};

    // Title from PDF metadata or first line
    if (pdfData.info?.Title) {
        metadata.title = pdfData.info.Title;
    } else {
        // Extract from first non-empty line
        const lines = text.split('\n').filter(l => l.trim().length > 0);
        if (lines.length > 0) {
            metadata.title = lines[0].trim();
        }
    }

    // Authors from PDF metadata
    if (pdfData.info?.Author) {
        metadata.authors = pdfData.info.Author.split(',').map((a: string) => a.trim());
    }

    // Year from text (look for 4-digit year)
    const yearMatch = text.match(/\b(19|20)\d{2}\b/);
    if (yearMatch) {
        metadata.year = parseInt(yearMatch[0]);
    }

    // DOI extraction (multiple formats)
    const doiMatch =
        text.match(/DOI:\s*(10\.\d{4,9}\/[^\s\]\)]+)/i) ||
        text.match(/doi\.org\/(10\.\d{4,9}\/[^\s\]\)]+)/i) ||
        text.match(/\b(10\.\d{4,9}\/[^\s\]\)]+)\b/);
    if (doiMatch) {
        metadata.doi = doiMatch[1].replace(/[,;\.]$/, ''); // Remove trailing punctuation
    }

    // Extract authors from text if not in metadata
    if (!metadata.authors && text.length > 0) {
        const authorMatch = text.match(/^([A-Z][a-z]+\s[A-Z][a-z]+(?:,\s[A-Z][a-z]+\s[A-Z][a-z]+){0,10})/);
        if (authorMatch) {
            metadata.authors = authorMatch[1].split(',').map(a => a.trim());
        }
    }

    return metadata;
}

/**
 * Detect and extract sections from full text
 */
function extractSections(text: string): PDFExtractionResult['sections'] {
    const sections: PDFExtractionResult['sections'] = {};

    // Common section headers (case-insensitive, with optional numbering)
    const sectionPatterns = {
        abstract: /(?:^|\n)\s*(?:\d+\.?\s*)?ABSTRACT\s*(?:\n|:)([\s\S]*?)(?=\n\s*(?:\d+\.?\s*)?(?:INTRODUCTION|BACKGROUND|METHODS|KEYWORDS|1\.\s|$))/i,
        introduction: /(?:^|\n)\s*(?:\d+\.?\s*)?(?:INTRODUCTION|BACKGROUND)\s*(?:\n|:)([\s\S]*?)(?=\n\s*(?:\d+\.?\s*)?(?:METHODS|MATERIALS|2\.\s|$))/i,
        methods: /(?:^|\n)\s*(?:\d+\.?\s*)?(?:METHODS|MATERIALS AND METHODS|METHODOLOGY|EXPERIMENTAL DESIGN)\s*(?:\n|:)([\s\S]*?)(?=\n\s*(?:\d+\.?\s*)?(?:RESULTS|FINDINGS|3\.\s|$))/i,
        results: /(?:^|\n)\s*(?:\d+\.?\s*)?(?:RESULTS|FINDINGS)\s*(?:\n|:)([\s\S]*?)(?=\n\s*(?:\d+\.?\s*)?(?:DISCUSSION|CONCLUSION|4\.\s|5\.\s|$))/i,
        discussion: /(?:^|\n)\s*(?:\d+\.?\s*)?DISCUSSION\s*(?:\n|:)([\s\S]*?)(?=\n\s*(?:\d+\.?\s*)?(?:CONCLUSION|REFERENCES|ACKNOWLEDGMENT|FUNDING|5\.\s|6\.\s|$))/i,
        conclusion: /(?:^|\n)\s*(?:\d+\.?\s*)?(?:CONCLUSION|CONCLUSIONS)\s*(?:\n|:)([\s\S]*?)(?=\n\s*(?:\d+\.?\s*)?(?:REFERENCES|ACKNOWLEDGMENT|FUNDING|$))/i,
        references: /(?:^|\n)\s*(?:\d+\.?\s*)?(?:REFERENCES|BIBLIOGRAPHY|WORKS CITED)\s*(?:\n|:)([\s\S]*?)$/i
    };

    // Extract each section
    for (const [sectionName, pattern] of Object.entries(sectionPatterns)) {
        const match = text.match(pattern);
        if (match && match[1]) {
            sections[sectionName as keyof typeof sections] = cleanSectionText(match[1]);
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
function cleanSectionText(text: string): string {
    return text
        .replace(/\r/g, '') // Remove carriage returns
        .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines with double
        .replace(/\s+/g, ' ') // Normalize whitespace
        .replace(/- \n/g, '') // Fix hyphenated line breaks
        .replace(/\n-/g, ' ') // Fix mid-word hyphens
        .replace(/\t/g, ' ') // Replace tabs with spaces
        .trim();
}

/**
 * Extract tables from PDF (simplified)
 */
export function extractTables(text: string): string[][] {
    // TODO: Implement table extraction
    // This is a complex task - consider using pdf.js for better table detection
    return [];
}

/**
 * Check if PDF appears to be scanned (OCR needed)
 */
export function isScannedPDF(pdfData: any): boolean {
    // Heuristic: If very little text extracted relative to page count
    const textLength = pdfData.text.length;
    const pageCount = pdfData.numpages;
    const avgTextPerPage = textLength / pageCount;

    // If average text per page < 200 chars, likely scanned
    return avgTextPerPage < 200;
}
