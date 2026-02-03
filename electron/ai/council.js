"use strict";
/**
 * AI Council - Multi-Model Consensus Screening
 * Orchestrates 3 local LLMs to vote on article inclusion/exclusion
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AICouncil = void 0;
const ollama_manager_1 = require("../ollama-manager");
const prompts_1 = require("../../dashboard-ui/lib/ai/prompts");
class AICouncil {
    constructor() {
        // Default council models
        this.councilModels = [
            'llama3.3:70b',
            'mistral-large',
            'gemma2:27b'
        ];
        this.ollama = ollama_manager_1.OllamaManager.getInstance();
    }
    static getInstance() {
        if (!AICouncil.instance) {
            AICouncil.instance = new AICouncil();
        }
        return AICouncil.instance;
    }
    /**
     * Screen article using AI Council (3-model consensus)
     */
    async screenArticle(article, picoCriteria, provider = 'local', forceCloud = false) {
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
    async screenWithCouncil(article, picoCriteria) {
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
                };
            }
            catch (error) {
                console.error(`  ✗ ${model} failed:`, error.message);
                return {
                    model,
                    decision: 'exclude', // Conservative default
                    confidence: 0,
                    reasoning: `Model error: ${error.message}`,
                    latency_ms: 0
                };
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
    async screenWithCloud(article, picoCriteria) {
        // TODO: Implement OpenRouter integration
        console.log('🌩️  Cloud AI screening not yet implemented');
        throw new Error('Cloud AI not yet implemented. Use local mode or implement OpenRouter integration.');
    }
    /**
     * Extract data from article
     */
    async extractData(article, provider = 'local') {
        const prompt = this.prepareExtractionPrompt(article);
        if (provider === 'local') {
            // Use the most capable local model (Llama 3.3 70B)
            const response = await this.ollama.generate('llama3.3:70b', prompt.user_prompt_template, {
                system: prompt.system_prompt,
                temperature: 0.2 // Very low for accurate data extraction
            });
            const parsed = this.parseModelResponse(response);
            return {
                extracted_data: parsed,
                confidence: 85, // TODO: Calculate based on model output
                provider: 'local',
                cost_usd: 0
            };
        }
        else {
            // TODO: Implement cloud extraction
            throw new Error('Cloud extraction not yet implemented');
        }
    }
    /**
     * Prepare screening prompt with article data
     */
    prepareScreeningPrompt(article, pico) {
        const template = prompts_1.PROMPTS.SCREENING.user_prompt_template;
        const rendered = (0, prompts_1.renderPrompt)(template, {
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
            system_prompt: prompts_1.PROMPTS.SCREENING.system_prompt,
            user_prompt_template: rendered
        };
    }
    /**
     * Prepare extraction prompt
     */
    prepareExtractionPrompt(article) {
        const template = prompts_1.PROMPTS.EXTRACTION.user_prompt_template;
        const rendered = (0, prompts_1.renderPrompt)(template, {
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
            system_prompt: prompts_1.PROMPTS.EXTRACTION.system_prompt,
            user_prompt_template: rendered
        };
    }
    /**
     * Parse JSON response from model
     */
    parseModelResponse(response) {
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
        }
        catch (error) {
            console.error('Failed to parse model response:', response);
            throw new Error('Model returned invalid JSON');
        }
    }
    /**
     * Calculate consensus from model votes
     */
    calculateConsensus(votes) {
        const includeVotes = votes.filter(v => v.decision === 'include');
        const excludeVotes = votes.filter(v => v.decision === 'exclude');
        const includeCount = includeVotes.length;
        const excludeCount = excludeVotes.length;
        let decision;
        let consensusType;
        // Majority voting
        if (includeCount > excludeCount) {
            decision = 'include';
        }
        else {
            decision = 'exclude';
        }
        // Determine consensus type
        if (includeCount === 3 || excludeCount === 3) {
            consensusType = 'unanimous';
        }
        else if (includeCount === 2 || excludeCount === 2) {
            consensusType = '2-1';
        }
        else {
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
    setCouncilModels(models) {
        if (models.length !== 3) {
            throw new Error('AI Council requires exactly 3 models');
        }
        this.councilModels = models;
    }
}
exports.AICouncil = AICouncil;
