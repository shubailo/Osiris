/**
 * PDF Extraction Test Runner
 * Validates PDF extraction accuracy with sample medical papers
 */

import { extractPDFText } from '../electron/pdf/extractor';
import * as fs from 'fs';
import * as path from 'path';

interface TestResult {
    file: string;
    passed: boolean;
    checks: {
        titleExtracted: boolean;
        sectionsDetected: number;
        abstractFound: boolean;
        methodsFound: boolean;
        resultsFound: boolean;
        fullTextLength: number;
    };
    errors: string[];
}

async function testPDFExtraction(pdfPath: string): Promise<TestResult> {
    const result: TestResult = {
        file: path.basename(pdfPath),
        passed: false,
        checks: {
            titleExtracted: false,
            sectionsDetected: 0,
            abstractFound: false,
            methodsFound: false,
            resultsFound: false,
            fullTextLength: 0
        },
        errors: []
    };

    try {
        console.log(`\n📄 Testing: ${result.file}`);
        console.log('─'.repeat(60));

        const extractedData = await extractPDFText(pdfPath);

        // Check 1: Title extracted
        if (extractedData.metadata.title && extractedData.metadata.title.length > 5) {
            result.checks.titleExtracted = true;
            console.log(`✓ Title: ${extractedData.metadata.title.substring(0, 60)}...`);
        } else {
            result.errors.push('Title not extracted or too short');
            console.log(`✗ Title: Not found`);
        }

        // Check 2: Full text length
        result.checks.fullTextLength = extractedData.fullText.length;
        if (extractedData.fullText.length > 1000) {
            console.log(`✓ Full text: ${extractedData.fullText.length.toLocaleString()} characters`);
        } else {
            result.errors.push(`Full text too short: ${extractedData.fullText.length} chars`);
            console.log(`✗ Full text: ${extractedData.fullText.length} characters (too short)`);
        }

        // Check 3: Sections detected
        const sections = extractedData.sections;
        result.checks.abstractFound = !!sections.abstract;
        result.checks.methodsFound = !!sections.methods;
        result.checks.resultsFound = !!sections.results;

        const detectedSections = Object.keys(sections).filter(key => sections[key as keyof typeof sections]);
        result.checks.sectionsDetected = detectedSections.length;

        console.log(`\nSections detected (${result.checks.sectionsDetected}):`);
        console.log(`  Abstract:    ${sections.abstract ? '✓' : '✗'} ${sections.abstract ? `(${sections.abstract.length} chars)` : ''}`);
        console.log(`  Introduction:${sections.introduction ? '✓' : '✗'} ${sections.introduction ? `(${sections.introduction.length} chars)` : ''}`);
        console.log(`  Methods:     ${sections.methods ? '✓' : '✗'} ${sections.methods ? `(${sections.methods.length} chars)` : ''}`);
        console.log(`  Results:     ${sections.results ? '✓' : '✗'} ${sections.results ? `(${sections.results.length} chars)` : ''}`);
        console.log(`  Discussion:  ${sections.discussion ? '✓' : '✗'} ${sections.discussion ? `(${sections.discussion.length} chars)` : ''}`);
        console.log(`  Conclusion:  ${sections.conclusion ? '✓' : '✗'} ${sections.conclusion ? `(${sections.conclusion.length} chars)` : ''}`);

        // Check 4: Metadata
        console.log(`\nMetadata:`);
        console.log(`  Authors: ${extractedData.metadata.authors?.join(', ') || 'Not found'}`);
        console.log(`  Year:    ${extractedData.metadata.year || 'Not found'}`);
        console.log(`  DOI:     ${extractedData.metadata.doi || 'Not found'}`);
        console.log(`  Pages:   ${extractedData.pageCount}`);

        // Success criteria
        result.passed =
            result.checks.titleExtracted &&
            result.checks.fullTextLength > 1000 &&
            (result.checks.abstractFound || result.checks.methodsFound || result.checks.resultsFound);

    } catch (error: any) {
        result.errors.push(error.message);
        console.error(`✗ Extraction failed: ${error.message}`);
    }

    return result;
}

async function runAllTests() {
    const testDir = path.join(__dirname, '../test-pdfs');

    console.log('\n🧪 PDF Extraction Test Suite');
    console.log('═'.repeat(60));

    if (!fs.existsSync(testDir)) {
        console.log(`\n⚠️  Test directory not found: ${testDir}`);
        console.log('Please add sample PDFs to test-pdfs/ directory');
        return;
    }

    const pdfFiles = fs.readdirSync(testDir).filter(f => f.endsWith('.pdf'));

    if (pdfFiles.length === 0) {
        console.log(`\n⚠️  No PDF files found in ${testDir}`);
        console.log('Please add sample medical research PDFs for testing');
        console.log('\nSuggested test cases:');
        console.log('  1. Randomized Controlled Trial (RCT)');
        console.log('  2. Meta-analysis or Systematic Review');
        console.log('  3. Observational Study');
        return;
    }

    const results: TestResult[] = [];

    for (const pdfFile of pdfFiles) {
        const pdfPath = path.join(testDir, pdfFile);
        const result = await testPDFExtraction(pdfPath);
        results.push(result);
    }

    // Summary
    console.log('\n');
    console.log('═'.repeat(60));
    console.log('📊 Test Summary');
    console.log('═'.repeat(60));

    const passed = results.filter(r => r.passed).length;
    const total = results.length;

    console.log(`\nTotal: ${total} PDFs tested`);
    console.log(`Passed: ${passed}/${total}`);
    console.log(`Failed: ${total - passed}/${total}`);

    results.forEach(result => {
        const status = result.passed ? '✓' : '✗';
        console.log(`\n  ${status} ${result.file}`);
        if (!result.passed && result.errors.length > 0) {
            result.errors.forEach(err => console.log(`    - ${err}`));
        }
    });

    console.log('\n');
}

// Run if executed directly
if (require.main === module) {
    runAllTests().catch(console.error);
}

export { runAllTests, testPDFExtraction };
