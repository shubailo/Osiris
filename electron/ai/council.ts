/**
 * AI Council - Multi-Model Consensus Screening
 * Orchestrates 3 local LLMs to vote on article inclusion/exclusion
 */

import { OllamaManager } from '../ollama-manager';
import { PROMPTS, renderPrompt } from '../../dashboard-ui/lib/ai/prompts';
import type { PICOCriteria, ModelVote } from '../../dashboard-ui/lib/ipc/types';

export interface ArticleData {
    id: number;
    title: string;
    abstract: string;
    full_text: string;
    methods: string;
    results: string;
}

export interface ScreeningResult {
    decision: 'include' | 'exclude';
    confidence: number;
    reasoning: string;
    model_votes?: ModelVote[];
    consensus_type: string;
    provider: string;
    cost_usd?: number;
}

export class AICouncil {
    private static instance: AICouncil;
    private ollama: OllamaManager;

    // Default council models
    private councilModels = [
        'llama3.3:70b',
        'mistral-large',
        'gemma2:27b'
    ];

    private constructor() {
        this.ollama = OllamaManager.getInstance();
    }

    static getInstance(): AICouncil {
        if (!AICouncil.instance) {
            AICouncil.instance = new AICouncil();
        }
        return AICouncil.instance;
    }

    /**
     * Screen article using AI Council (3-model consensus)
     */
    async screenArticle(
        article: ArticleData,
        picoCriteria: PICOCriteria,
        provider: 'local' | 'cloud' = 'local',
        forceCloud: boolean = false
    ): Promise<ScreeningResult> {
        if (provider === 'cloud' || forceCloud) {
            return this.screenWithCloud(article, picoCriteria);
        }

        // Check if Ollama is connected
        if (!this.ollama.isConnected()) {
            throw new Error('Ollama not connected. Please start Ollama or use cloud mode.');
        }

        // Screen with local AI Council
        return this.screenWithCouncil(article, picoCriteria);
    }

    /**
     * Screen with 3-model local council
     */
    private async screenWithCouncil(
        article: ArticleData,
        picoCriteria: PICOCriteria
    ): Promise<ScreeningResult> {
        console.log(`🤖 AI Council screening article ${article.id}...`);

        // Prepare prompt
        const prompt = this.prepareScreeningPrompt(article, picoCriteria);

        // Run all 3 models in parallel
        const votesPromises = this.councilModels.map(async (model) => {
            try {
                const startTime = Date.now();
                const response = await this.ollama.generate(model, prompt.user_prompt_template, {
                    system: prompt.system_prompt,
                    temperature: 0.3, // Lower temperature for more consistent medical screening
                });

                const latency = Date.now() - startTime;
                console.log(`  ✓ ${model} completed in ${latency}ms`);

                // Parse JSON response
                const parsed = this.parseModelResponse(response);

                return {
                    model,
                    decision: parsed.decision,
                    confidence: parsed.confidence,
                    reasoning: parsed.reasoning,
                    latency_ms: latency
                } as ModelVote;
            } catch (error: any) {
                console.error(`  ✗ ${model} failed:`, error.message);
                return {
                    model,
                    decision: 'exclude' as const, // Conservative default
                    confidence: 0,
                    reasoning: `Model error: ${error.message}`,
                    latency_ms: 0
                } as ModelVote;
            }
        });

        const votes = await Promise.all(votesPromises);

        // Calculate consensus
        const consensus = this.calculateConsensus(votes);

        return {
            decision: consensus.decision,
            confidence: consensus.confidence,
            reasoning: consensus.reasoning,
            model_votes: votes,
            consensus_type: consensus.type,
            provider: 'local-council',
            cost_usd: 0 // Local is free
        };
    }

    /**
     * Screen with cloud AI (OpenRouter fallback)
     */
    private async screenWithCloud(
        article: ArticleData,
        picoCriteria: PICOCriteria
    ): Promise<ScreeningResult> {
        // TODO: Implement OpenRouter integration
        console.log('🌩️  Cloud AI screening not yet implemented');

        throw new Error('Cloud AI not yet implemented. Use local mode or implement OpenRouter integration.');
    }

    /**
     * Extract data from article
     */
    async extractData(
        article: ArticleData,
        provider: 'local' | 'cloud' = 'local'
    ): Promise<any> {
        const prompt = this.prepareExtractionPrompt(article);

        if (provider === 'local') {
            // Use the most capable local model (Llama 3.3 70B)
            const response = await this.ollama.generate(
                'llama3.3:70b',
                prompt.user_prompt_template,
                {
                    system: prompt.system_prompt,
                    temperature: 0.2 // Very low for accurate data extraction
                }
            );

            const parsed = this.parseModelResponse(response);

            return {
                extracted_data: parsed,
                confidence: 85, // TODO: Calculate based on model output
                provider: 'local',
                cost_usd: 0
            };
        } else {
            // TODO: Implement cloud extraction
            throw new Error('Cloud extraction not yet implemented');
        }
    }

    /**
     * Prepare screening prompt with article data
     */
    private prepareScreeningPrompt(article: ArticleData, pico: PICOCriteria) {
        const template = PROMPTS.SCREENING.user_prompt_template;

        const rendered = renderPrompt(template, {
            research_question: 'Systematic review screening',
            pico,
            inclusion_criteria: ['Matches PICO criteria'],
            exclusion_criteria: ['Does not match PICO'],
            article: {
                title: article.title,
                authors: 'Authors',
                journal: 'Journal',
                year: '2024',
                abstract: article.abstract || article.full_text.substring(0, 500),
                methods: article.methods || article.full_text.substring(500, 1500),
                results_excerpt: article.results || article.full_text.substring(1500, 2500)
            }
        });

        return {
            system_prompt: PROMPTS.SCREENING.system_prompt,
            user_prompt_template: rendered
        };
    }

    /**
     * Prepare extraction prompt
     */
    private prepareExtractionPrompt(article: ArticleData) {
        const template = PROMPTS.EXTRACTION.user_prompt_template;

        const rendered = renderPrompt(template, {
            article: {
                title: article.title,
                authors: 'Authors',
                journal: 'Journal',
                year: '2024',
                abstract: article.abstract,
                methods: article.methods,
                results: article.results,
                discussion_excerpt: article.full_text.substring(0, 1000)
            }
        });

        return {
            system_prompt: PROMPTS.EXTRACTION.system_prompt,
            user_prompt_template: rendered
        };
    }

    /**
     * Parse JSON response from model
     */
    private parseModelResponse(response: string): any {
        try {
            // Try to extract JSON from markdown code blocks
            const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) ||
                response.match(/\{[\s\S]*\}/);

            if (jsonMatch) {
                const jsonStr = jsonMatch[1] || jsonMatch[0];
                return JSON.parse(jsonStr);
            }

            // Try parsing entire response
            return JSON.parse(response);
        } catch (error) {
            console.error('Failed to parse model response:', response);
            throw new Error('Model returned invalid JSON');
        }
    }

    /**
     * Calculate consensus from model votes
     */
    private calculateConsensus(votes: ModelVote[]): {
        decision: 'include' | 'exclude';
        confidence: number;
        reasoning: string;
        type: string;
    } {
        const includeVotes = votes.filter(v => v.decision === 'include');
        const excludeVotes = votes.filter(v => v.decision === 'exclude');

        const includeCount = includeVotes.length;
        const excludeCount = excludeVotes.length;

        let decision: 'include' | 'exclude';
        let consensusType: string;

        // Majority voting
        if (includeCount > excludeCount) {
            decision = 'include';
        } else {
            decision = 'exclude';
        }

        // Determine consensus type
        if (includeCount === 3 || excludeCount === 3) {
            consensusType = 'unanimous';
        } else if (includeCount === 2 || excludeCount === 2) {
            consensusType = '2-1';
        } else {
            consensusType = '3-way-split';
        }

        // Calculate confidence
        const winningVotes = decision === 'include' ? includeVotes : excludeVotes;
        const avgConfidence = winningVotes.reduce((sum, v) => sum + v.confidence, 0) / winningVotes.length;
        const consensusBonus = consensusType === 'unanimous' ? 1.0 :
            consensusType === '2-1' ? 0.85 : 0.5;
        const finalConfidence = Math.round(avgConfidence * consensusBonus);

        // Combine reasoning
        const reasoning = `Council Decision (${consensusType}): ${includeCount} models voted INCLUDE, ${excludeCount} voted EXCLUDE. ${winningVotes[0]?.reasoning || 'No reasoning provided.'}`;

        return {
            decision,
            confidence: finalConfidence,
            reasoning,
            type: consensusType
        };
    }

    /**
     * Set custom council models
     */
    setCouncilModels(models: string[]) {
        if (models.length !== 3) {
            throw new Error('AI Council requires exactly 3 models');
        }
        this.councilModels = models;
    }
}
