/**
 * JSON Export
 * Complete project export for archival and data portability
 */

import * as fs from 'fs';
import Database from 'better-sqlite3';

export interface ProjectExport {
    export_metadata: {
        version: string;
        export_date: string;
        app_version: string;
    };
    project: {
        id: number;
        name: string;
        prospero_id?: string;
        research_question?: string;
        pico_criteria?: any;
        inclusion_criteria?: string[];
        exclusion_criteria?: string[];
        created_at: string;
        updated_at: string;
    };
    articles: Array<{
        id: number;
        title?: string;
        authors?: string;
        journal?: string;
        year?: number;
        doi?: string;
        pmid?: string;
        abstract?: string;
        full_text?: string;
        methods?: string;
        results?: string;
        discussion?: string;
        screening_decision?: {
            decision: string;
            confidence?: number;
            reasoning: string;
            ai_provider?: string;
            model_votes?: any;
            decided_at: string;
        };
        extracted_data?: {
            population?: any;
            intervention?: any;
            comparison?: any;
            outcomes?: any;
            study_design?: string;
            sample_size?: number;
            primary_outcomes?: any;
            risk_of_bias?: any;
            extracted_at: string;
        };
    }>;
    ai_usage_summary?: {
        total_requests: number;
        total_tokens: number;
        total_cost_usd: number;
        by_operation: Record<string, number>;
        by_model: Record<string, number>;
    };
}

export class JSONExporter {
    /**
     * Export complete project to JSON
     */
    async exportProject(db: Database.Database, projectId: number, outputPath: string): Promise<void> {
        // Get project details
        const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId) as any;

        if (!project) {
            throw new Error(`Project ${projectId} not found`);
        }

        // Get articles with decisions and extractions
        const articles = db.prepare(`
      SELECT 
        a.*,
        sd.decision, sd.confidence, sd.reasoning, sd.ai_provider, sd.model_votes, sd.decided_at,
        ed.population, ed.intervention, ed.comparison, ed.outcomes,
        ed.study_design, ed.sample_size, ed.primary_outcomes, ed.risk_of_bias, ed.extracted_at
      FROM articles a
      LEFT JOIN screening_decisions sd ON a.id = sd.article_id
      LEFT JOIN extracted_data ed ON a.id = ed.article_id
      WHERE a.project_id = ?
      ORDER BY a.created_at
    `).all(projectId) as any[];

        // Get AI usage summary
        const aiUsage = db.prepare(`
      SELECT 
        COUNT(*) as total_requests,
        SUM(total_tokens) as total_tokens,
        SUM(cost_usd) as total_cost_usd
      FROM ai_usage_logs
      WHERE article_id IN (SELECT id FROM articles WHERE project_id = ?)
    `).get(projectId) as any;

        const aiByOperation = db.prepare(`
      SELECT operation, COUNT(*) as count
      FROM ai_usage_logs
      WHERE article_id IN (SELECT id FROM articles WHERE project_id = ?)
      GROUP BY operation
    `).all(projectId) as any[];

        const aiByModel = db.prepare(`
      SELECT model, COUNT(*) as count
      FROM ai_usage_logs
      WHERE article_id IN (SELECT id FROM articles WHERE project_id = ?)
      GROUP BY model
    `).all(projectId) as any[];

        // Build export object
        const exportData: ProjectExport = {
            export_metadata: {
                version: '1.0',
                export_date: new Date().toISOString(),
                app_version: '0.1.0'
            },
            project: {
                id: project.id,
                name: project.name,
                prospero_id: project.prospero_id,
                research_question: project.research_question,
                pico_criteria: project.pico_criteria ? JSON.parse(project.pico_criteria) : undefined,
                inclusion_criteria: project.inclusion_criteria ? JSON.parse(project.inclusion_criteria) : undefined,
                exclusion_criteria: project.exclusion_criteria ? JSON.parse(project.exclusion_criteria) : undefined,
                created_at: project.created_at,
                updated_at: project.updated_at
            },
            articles: articles.map(a => ({
                id: a.id,
                title: a.title,
                authors: a.authors,
                journal: a.journal,
                year: a.year,
                doi: a.doi,
                pmid: a.pmid,
                abstract: a.abstract,
                full_text: a.full_text,
                methods: a.methods,
                results: a.results,
                discussion: a.discussion,
                screening_decision: a.decision ? {
                    decision: a.decision,
                    confidence: a.confidence,
                    reasoning: a.reasoning,
                    ai_provider: a.ai_provider,
                    model_votes: a.model_votes ? JSON.parse(a.model_votes) : undefined,
                    decided_at: a.decided_at
                } : undefined,
                extracted_data: a.extracted_at ? {
                    population: a.population ? JSON.parse(a.population) : undefined,
                    intervention: a.intervention ? JSON.parse(a.intervention) : undefined,
                    comparison: a.comparison ? JSON.parse(a.comparison) : undefined,
                    outcomes: a.outcomes ? JSON.parse(a.outcomes) : undefined,
                    study_design: a.study_design,
                    sample_size: a.sample_size,
                    primary_outcomes: a.primary_outcomes ? JSON.parse(a.primary_outcomes) : undefined,
                    risk_of_bias: a.risk_of_bias ? JSON.parse(a.risk_of_bias) : undefined,
                    extracted_at: a.extracted_at
                } : undefined
            })),
            ai_usage_summary: {
                total_requests: aiUsage?.total_requests || 0,
                total_tokens: aiUsage?.total_tokens || 0,
                total_cost_usd: aiUsage?.total_cost_usd || 0,
                by_operation: Object.fromEntries(aiByOperation.map(o => [o.operation, o.count])),
                by_model: Object.fromEntries(aiByModel.map(m => [m.model, m.count]))
            }
        };

        // Write to file with pretty formatting
        fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2), 'utf-8');
    }
}
