/**
 * CSV Export for RevMan (Cochrane Review Manager)
 * Exports extracted data in RevMan-compatible format
 */

import * as fs from 'fs';

export interface RevManStudyData {
    study_id: string;
    authors: string;
    year: number;
    title: string;

    // Study characteristics
    study_design: string;
    sample_size: number;

    // Intervention group
    intervention_name: string;
    intervention_n: number;
    intervention_mean?: number;
    intervention_sd?: number;
    intervention_events?: number; // For dichotomous outcomes

    // Control group
    control_name: string;
    control_n: number;
    control_mean?: number;
    control_sd?: number;
    control_events?: number;

    // Outcome
    outcome_name: string;
    outcome_type: 'continuous' | 'dichotomous';
    timepoint: string;

    // Effect measures
    p_value?: number;
    effect_size?: string;

    // Risk of bias
    rob_random_sequence?: 'Low' | 'High' | 'Unclear';
    rob_allocation_concealment?: 'Low' | 'High' | 'Unclear';
    rob_blinding_participants?: 'Low' | 'High' | 'Unclear';
    rob_blinding_outcome?: 'Low' | 'High' | 'Unclear';
    rob_incomplete_outcome?: 'Low' | 'High' | 'Unclear';
    rob_selective_reporting?: 'Low' | 'High' | 'Unclear';
    rob_other?: 'Low' | 'High' | 'Unclear';
}

export class RevManExporter {
    /**
     * Export studies to RevMan-compatible CSV
     */
    exportToCSV(studies: RevManStudyData[], outputPath: string): void {
        // RevMan CSV format headers
        const headers = [
            'Study ID',
            'Authors',
            'Year',
            'Title',
            'Study Design',
            'Sample Size',
            'Intervention',
            'Intervention N',
            'Intervention Mean',
            'Intervention SD',
            'Intervention Events',
            'Control',
            'Control N',
            'Control Mean',
            'Control SD',
            'Control Events',
            'Outcome',
            'Outcome Type',
            'Timepoint',
            'P Value',
            'Effect Size',
            'RoB - Random Sequence Generation',
            'RoB - Allocation Concealment',
            'RoB - Blinding (Participants)',
            'RoB - Blinding (Outcome Assessment)',
            'RoB - Incomplete Outcome Data',
            'RoB - Selective Reporting',
            'RoB - Other Bias'
        ];

        const rows: string[][] = [headers];

        for (const study of studies) {
            rows.push([
                this.escape(study.study_id),
                this.escape(study.authors),
                study.year.toString(),
                this.escape(study.title),
                this.escape(study.study_design),
                study.sample_size.toString(),
                this.escape(study.intervention_name),
                study.intervention_n.toString(),
                study.intervention_mean?.toString() || '',
                study.intervention_sd?.toString() || '',
                study.intervention_events?.toString() || '',
                this.escape(study.control_name),
                study.control_n.toString(),
                study.control_mean?.toString() || '',
                study.control_sd?.toString() || '',
                study.control_events?.toString() || '',
                this.escape(study.outcome_name),
                study.outcome_type,
                this.escape(study.timepoint),
                study.p_value?.toString() || '',
                this.escape(study.effect_size || ''),
                study.rob_random_sequence || 'Unclear',
                study.rob_allocation_concealment || 'Unclear',
                study.rob_blinding_participants || 'Unclear',
                study.rob_blinding_outcome || 'Unclear',
                study.rob_incomplete_outcome || 'Unclear',
                study.rob_selective_reporting || 'Unclear',
                study.rob_other || 'Unclear'
            ]);
        }

        const csvContent = rows.map(row => row.join(',')).join('\n');
        fs.writeFileSync(outputPath, csvContent, 'utf-8');
    }

    /**
     * Escape CSV field (handle commas, quotes)
     */
    private escape(value: string): string {
        if (!value) return '';

        // If contains comma, newline, or quote, wrap in quotes and escape internal quotes
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            return `"${value.replace(/"/g, '""')}"`;
        }

        return value;
    }

    /**
     * Export to RevMan 5.4 XML format (more structured)
     */
    exportToRevManXML(studies: RevManStudyData[], outputPath: string): void {
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<COCHRANE_REVIEW>\n';
        xml += '  <STUDIES>\n';

        for (const study of studies) {
            xml += `    <STUDY ID="${this.escapeXML(study.study_id)}">\n`;
            xml += `      <AUTHORS>${this.escapeXML(study.authors)}</AUTHORS>\n`;
            xml += `      <YEAR>${study.year}</YEAR>\n`;
            xml += `      <TITLE>${this.escapeXML(study.title)}</TITLE>\n`;
            xml += `      <DESIGN>${this.escapeXML(study.study_design)}</DESIGN>\n`;
            xml += `      <SAMPLE_SIZE>${study.sample_size}</SAMPLE_SIZE>\n`;

            xml += `      <INTERVENTION>\n`;
            xml += `        <NAME>${this.escapeXML(study.intervention_name)}</NAME>\n`;
            xml += `        <N>${study.intervention_n}</N>\n`;
            if (study.intervention_mean !== undefined) xml += `        <MEAN>${study.intervention_mean}</MEAN>\n`;
            if (study.intervention_sd !== undefined) xml += `        <SD>${study.intervention_sd}</SD>\n`;
            if (study.intervention_events !== undefined) xml += `        <EVENTS>${study.intervention_events}</EVENTS>\n`;
            xml += `      </INTERVENTION>\n`;

            xml += `      <CONTROL>\n`;
            xml += `        <NAME>${this.escapeXML(study.control_name)}</NAME>\n`;
            xml += `        <N>${study.control_n}</N>\n`;
            if (study.control_mean !== undefined) xml += `        <MEAN>${study.control_mean}</MEAN>\n`;
            if (study.control_sd !== undefined) xml += `        <SD>${study.control_sd}</SD>\n`;
            if (study.control_events !== undefined) xml += `        <EVENTS>${study.control_events}</EVENTS>\n`;
            xml += `      </CONTROL>\n`;

            xml += `      <OUTCOME>\n`;
            xml += `        <NAME>${this.escapeXML(study.outcome_name)}</NAME>\n`;
            xml += `        <TYPE>${study.outcome_type}</TYPE>\n`;
            xml += `        <TIMEPOINT>${this.escapeXML(study.timepoint)}</TIMEPOINT>\n`;
            xml += `      </OUTCOME>\n`;

            xml += `      <RISK_OF_BIAS>\n`;
            xml += `        <RANDOM_SEQUENCE>${study.rob_random_sequence || 'Unclear'}</RANDOM_SEQUENCE>\n`;
            xml += `        <ALLOCATION_CONCEALMENT>${study.rob_allocation_concealment || 'Unclear'}</ALLOCATION_CONCEALMENT>\n`;
            xml += `        <BLINDING_PARTICIPANTS>${study.rob_blinding_participants || 'Unclear'}</BLINDING_PARTICIPANTS>\n`;
            xml += `        <BLINDING_OUTCOME>${study.rob_blinding_outcome || 'Unclear'}</BLINDING_OUTCOME>\n`;
            xml += `        <INCOMPLETE_OUTCOME>${study.rob_incomplete_outcome || 'Unclear'}</INCOMPLETE_OUTCOME>\n`;
            xml += `        <SELECTIVE_REPORTING>${study.rob_selective_reporting || 'Unclear'}</SELECTIVE_REPORTING>\n`;
            xml += `        <OTHER_BIAS>${study.rob_other || 'Unclear'}</OTHER_BIAS>\n`;
            xml += `      </RISK_OF_BIAS>\n`;

            xml += `    </STUDY>\n`;
        }

        xml += '  </STUDIES>\n';
        xml += '</COCHRANE_REVIEW>\n';

        fs.writeFileSync(outputPath, xml, 'utf-8');
    }

    private escapeXML(value: string): string {
        if (!value) return '';
        return value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }
}
