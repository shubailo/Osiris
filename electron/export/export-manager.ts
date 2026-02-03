/**
 * Export Manager
 * Coordinates all export operations
 */

import { PRISMADiagramGenerator, type PRISMAData } from './prisma-diagram';
import { RevManExporter, type RevManStudyData } from './revman-exporter';
import { JSONExporter } from './json-exporter';
import type Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';

export class ExportManager {
    private prismaGenerator: PRISMADiagramGenerator;
    private revmanExporter: RevManExporter;
    private jsonExporter: JSONExporter;

    constructor() {
        this.prismaGenerator = new PRISMADiagramGenerator();
        this.revmanExporter = new RevManExporter();
        this.jsonExporter = new JSONExporter();
    }

    /**
     * Generate PRISMA diagram from project data
     */
    async generatePRISMADiagram(db: Database.Database, projectId: number, outputPath: string): Promise<void> {
        const stats = this.getProjectStats(db, projectId);

        const prismaData: PRISMAData = {
            identification: {
                database_records: stats.total_articles,
                register_records: 0,
                other_sources: 0,
                duplicates_removed: 0
            },
            screening: {
                records_screened: stats.total_articles,
                records_excluded: stats.excluded,
                excluded_reasons: this.getExclusionReasons(db, projectId, 'screening')
            },
            eligibility: {
                full_text_assessed: stats.included + stats.excluded_full_text,
                full_text_excluded: stats.excluded_full_text,
                excluded_reasons: this.getExclusionReasons(db, projectId, 'full_text')
            },
            included: {
                studies_included: stats.included_final
            }
        };

        await this.prismaGenerator.generate(prismaData, outputPath);
    }

    /**
     * Export to RevMan CSV
     */
    exportToRevManCSV(db: Database.Database, projectId: number, outputPath: string): void {
        const studies = this.getRevManStudies(db, projectId);
        this.revmanExporter.exportToCSV(studies, outputPath);
    }

    /**
     * Export to RevMan XML
     */
    exportToRevManXML(db: Database.Database, projectId: number, outputPath: string): void {
        const studies = this.getRevManStudies(db, projectId);
        this.revmanExporter.exportToRevManXML(studies, outputPath);
    }

    /**
     * Export complete project to JSON
     */
    async exportToJSON(db: Database.Database, projectId: number, outputPath: string): Promise<void> {
        await this.jsonExporter.exportProject(db, projectId, outputPath);
    }

    /**
     * Export all formats to a directory
     */
    async exportAll(db: Database.Database, projectId: number, exportDir: string): Promise<{
        prisma: string;
        revman_csv: string;
        revman_xml: string;
        json: string;
    }> {
        // Create export directory
        if (!fs.existsSync(exportDir)) {
            fs.mkdirSync(exportDir, { recursive: true });
        }

        const project = db.prepare('SELECT name FROM projects WHERE id = ?').get(projectId) as any;
        const safeName = project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const timestamp = new Date().toISOString().split('T')[0];

        const paths = {
            prisma: path.join(exportDir, `${safeName}_prisma_${timestamp}.png`),
            revman_csv: path.join(exportDir, `${safeName}_revman_${timestamp}.csv`),
            revman_xml: path.join(exportDir, `${safeName}_revman_${timestamp}.xml`),
            json: path.join(exportDir, `${safeName}_export_${timestamp}.json`)
        };

        await this.generatePRISMADiagram(db, projectId, paths.prisma);
        this.exportToRevManCSV(db, projectId, paths.revman_csv);
        this.exportToRevManXML(db, projectId, paths.revman_xml);
        await this.exportToJSON(db, projectId, paths.json);

        return paths;
    }

    /**
     * Get project statistics for PRISMA
     */
    private getProjectStats(db: Database.Database, projectId: number) {
        const stats = db.prepare(`
      SELECT 
        COUNT(*) as total_articles,
        SUM(CASE WHEN sd.decision = 'exclude' THEN 1 ELSE 0 END) as excluded,
        SUM(CASE WHEN sd.decision = 'include' THEN 1 ELSE 0 END) as included,
        SUM(CASE WHEN sd.decision = 'include' AND ed.id IS NOT NULL THEN 1 ELSE 0 END) as included_final,
        SUM(CASE WHEN sd.decision = 'exclude' AND sd.reasoning LIKE '%full%text%' THEN 1 ELSE 0 END) as excluded_full_text
      FROM articles a
      LEFT JOIN screening_decisions sd ON a.id = sd.article_id
      LEFT JOIN extracted_data ed ON a.id = ed.article_id
      WHERE a.project_id = ?
    `).get(projectId) as any;

        return {
            total_articles: stats.total_articles || 0,
            excluded: stats.excluded || 0,
            included: stats.included || 0,
            included_final: stats.included_final || 0,
            excluded_full_text: stats.excluded_full_text || 0
        };
    }

    /**
     * Get exclusion reasons
     */
    private getExclusionReasons(db: Database.Database, projectId: number, stage: string): Record<string, number> {
        // Simplified - in real implementation, parse reasoning text for structured reasons
        return {};
    }

    /**
     * Get studies in RevMan format
     */
    private getRevManStudies(db: Database.Database, projectId: number): RevManStudyData[] {
        const rows = db.prepare(`
      SELECT 
        a.id, a.title, a.authors, a.year,
        ed.study_design, ed.sample_size,
        ed.intervention, ed.comparison, ed.outcomes, ed.primary_outcomes, ed.risk_of_bias
      FROM articles a
      JOIN extracted_data ed ON a.id = ed.article_id
      JOIN screening_decisions sd ON a.id = sd.article_id
      WHERE a.project_id = ? AND sd.decision = 'include'
    `).all(projectId) as any[];

        return rows.map((row, index) => {
            const intervention = row.intervention ? JSON.parse(row.intervention) : {};
            const comparison = row.comparison ? JSON.parse(row.comparison) : {};
            const outcomes = row.outcomes ? JSON.parse(row.outcomes) : [];
            const primaryOutcome = outcomes[0] || {};
            const rob = row.risk_of_bias ? JSON.parse(row.risk_of_bias) : {};

            return {
                study_id: `Study_${index + 1}`,
                authors: row.authors || 'Unknown',
                year: row.year || new Date().getFullYear(),
                title: row.title || 'Untitled',
                study_design: row.study_design || 'RCT',
                sample_size: row.sample_size || 0,
                intervention_name: intervention.name || 'Intervention',
                intervention_n: Math.floor((row.sample_size || 0) / 2),
                intervention_mean: primaryOutcome.intervention_mean,
                intervention_sd: primaryOutcome.intervention_sd,
                intervention_events: primaryOutcome.intervention_events,
                control_name: comparison.name || 'Control',
                control_n: Math.floor((row.sample_size || 0) / 2),
                control_mean: primaryOutcome.control_mean,
                control_sd: primaryOutcome.control_sd,
                control_events: primaryOutcome.control_events,
                outcome_name: primaryOutcome.name || 'Primary Outcome',
                outcome_type: primaryOutcome.type || 'continuous',
                timepoint: primaryOutcome.timepoint || 'End of intervention',
                p_value: primaryOutcome.p_value,
                effect_size: primaryOutcome.effect_size,
                rob_random_sequence: rob.random_sequence_generation,
                rob_allocation_concealment: rob.allocation_concealment,
                rob_blinding_participants: rob.blinding_participants,
                rob_blinding_outcome: rob.blinding_outcome_assessment,
                rob_incomplete_outcome: rob.incomplete_outcome_data,
                rob_selective_reporting: rob.selective_reporting,
                rob_other: rob.other_bias
            };
        });
    }
}
