/**
 * PRISMA Flow Diagram Generator
 * Creates PRISMA 2020-compliant flow diagrams for systematic reviews
 */

import { createCanvas, CanvasRenderingContext2D } from 'canvas';
import * as fs from 'fs';
import * as path from 'path';

export interface PRISMAData {
    identification: {
        database_records: number;
        register_records: number;
        other_sources: number;
        duplicates_removed: number;
    };
    screening: {
        records_screened: number;
        records_excluded: number;
        excluded_reasons?: Record<string, number>; // e.g., { "Wrong population": 45, "Wrong intervention": 23 }
    };
    eligibility: {
        full_text_assessed: number;
        full_text_excluded: number;
        excluded_reasons?: Record<string, number>;
    };
    included: {
        studies_included: number;
    };
}

export class PRISMADiagramGenerator {
    private readonly width = 800;
    private readonly height = 1000;
    private readonly boxWidth = 220;
    private readonly boxHeight = 80;
    private readonly spacing = 60;
    private readonly colors = {
        identification: '#E3F2FD',
        screening: '#FFF3E0',
        eligibility: '#F3E5F5',
        included: '#E8F5E9',
        border: '#424242',
        text: '#212121',
        exclusion: '#FFEBEE'
    };

    /**
     * Generate PRISMA diagram as PNG
     */
    async generate(data: PRISMAData, outputPath: string): Promise<void> {
        const canvas = createCanvas(this.width, this.height);
        const ctx = canvas.getContext('2d');

        // White background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, this.width, this.height);

        let y = 40;

        // IDENTIFICATION
        y = this.drawSection(ctx, 'IDENTIFICATION', this.colors.identification, y);
        y = this.drawBox(ctx, `Records identified through\ndatabase searching\n(n = ${data.identification.database_records})`, this.colors.identification, 100, y);
        y = this.drawBox(ctx, `Additional records identified\nthrough other sources\n(n = ${data.identification.register_records + data.identification.other_sources})`, this.colors.identification, 480, y, 220);
        y += this.boxHeight + 30;

        y = this.drawArrowDown(ctx, this.width / 2, y);
        y = this.drawBox(ctx, `Records after duplicates removed\n(n = ${data.identification.database_records - data.identification.duplicates_removed})`, this.colors.identification, this.width / 2 - this.boxWidth / 2, y);
        y += this.boxHeight + 30;

        // SCREENING
        y = this.drawSection(ctx, 'SCREENING', this.colors.screening, y);
        y = this.drawArrowDown(ctx, this.width / 2, y);
        y = this.drawBox(ctx, `Records screened\n(n = ${data.screening.records_screened})`, this.colors.screening, this.width / 2 - this.boxWidth / 2, y);

        // Exclusion box (right side)
        const excludeY = y;
        this.drawArrowRight(ctx, this.width / 2 + this.boxWidth / 2, y + this.boxHeight / 2, 80);
        this.drawBox(ctx, `Records excluded\n(n = ${data.screening.records_excluded})`, this.colors.exclusion, 500, excludeY);

        y += this.boxHeight + 30;

        // ELIGIBILITY
        y = this.drawSection(ctx, 'ELIGIBILITY', this.colors.eligibility, y);
        y = this.drawArrowDown(ctx, this.width / 2, y);
        y = this.drawBox(ctx, `Full-text articles assessed\nfor eligibility\n(n = ${data.eligibility.full_text_assessed})`, this.colors.eligibility, this.width / 2 - this.boxWidth / 2, y);

        // Exclusion box (right side)
        const excludeFullTextY = y;
        this.drawArrowRight(ctx, this.width / 2 + this.boxWidth / 2, y + this.boxHeight / 2, 80);
        const reasonsText = this.formatExclusionReasons(data.eligibility.excluded_reasons);
        this.drawBox(ctx, `Full-text articles excluded\n(n = ${data.eligibility.full_text_excluded})\n${reasonsText}`, this.colors.exclusion, 500, excludeFullTextY, 220, 100);

        y += this.boxHeight + 30;

        // INCLUDED
        y = this.drawSection(ctx, 'INCLUDED', this.colors.included, y);
        y = this.drawArrowDown(ctx, this.width / 2, y);
        y = this.drawBox(ctx, `Studies included in\nqualitative synthesis\n(n = ${data.included.studies_included})`, this.colors.included, this.width / 2 - this.boxWidth / 2, y);

        // Save to file
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(outputPath, buffer);
    }

    private drawSection(ctx: CanvasRenderingContext2D, title: string, color: string, y: number): number {
        ctx.fillStyle = color;
        ctx.fillRect(20, y, this.width - 40, 30);
        ctx.strokeStyle = this.colors.border;
        ctx.strokeRect(20, y, this.width - 40, 30);

        ctx.fillStyle = this.colors.text;
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(title, this.width / 2, y + 20);

        return y + 40;
    }

    private drawBox(ctx: CanvasRenderingContext2D, text: string, color: string, x: number, y: number, width: number = this.boxWidth, height: number = this.boxHeight): number {
        // Box
        ctx.fillStyle = color;
        ctx.fillRect(x, y, width, height);
        ctx.strokeStyle = this.colors.border;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);

        // Text
        ctx.fillStyle = this.colors.text;
        ctx.font = '13px Arial';
        ctx.textAlign = 'center';
        const lines = text.split('\n');
        const lineHeight = 18;
        const startY = y + height / 2 - (lines.length * lineHeight) / 2 + lineHeight / 2;

        lines.forEach((line, i) => {
            ctx.fillText(line, x + width / 2, startY + i * lineHeight);
        });

        return y;
    }

    private drawArrowDown(ctx: CanvasRenderingContext2D, x: number, y: number): number {
        ctx.strokeStyle = this.colors.border;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + 20);
        ctx.stroke();

        // Arrowhead
        ctx.beginPath();
        ctx.moveTo(x - 5, y + 15);
        ctx.lineTo(x, y + 20);
        ctx.lineTo(x + 5, y + 15);
        ctx.fill();

        return y + 20;
    }

    private drawArrowRight(ctx: CanvasRenderingContext2D, x: number, y: number, length: number): void {
        ctx.strokeStyle = this.colors.border;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + length, y);
        ctx.stroke();

        // Arrowhead
        ctx.beginPath();
        ctx.moveTo(x + length - 5, y - 5);
        ctx.lineTo(x + length, y);
        ctx.lineTo(x + length - 5, y + 5);
        ctx.fill();
    }

    private formatExclusionReasons(reasons?: Record<string, number>): string {
        if (!reasons || Object.keys(reasons).length === 0) return '';

        const topReasons = Object.entries(reasons)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([reason, count]) => `${reason}: ${count}`)
            .join('\n');

        return topReasons;
    }
}
