import { Injectable } from '@angular/core';

export interface GCodeParseResult {
    success: boolean;
    coordinates: number[][];
    error?: string;
    metadata?: {
        totalLines: number;
        movementCommands: number;
        toolpathPoints: number;
    };
}

@Injectable({
    providedIn: 'root'
})
export class GcodeParserService {

    constructor() { }

    /**
     * Parse G-code text and extract coordinate array
     */
    parseGCode(gcodeText: string): GCodeParseResult {
        try {
            const lines = gcodeText.split('\n')
                .map(line => line.trim())
                .filter(line => line && !line.startsWith(';')); // Remove empty lines and comments

            const coordinates: number[][] = [];
            let currentX = 0;
            let currentY = 0;
            let totalLines = lines.length;
            let movementCommands = 0;
            let isToolActive = false; // Track M03/M05 for pen up/down

            for (const line of lines) {
                const command = this.parseGCodeLine(line);

                if (!command) continue;

                // Track movement commands
                if (command.type === 'movement') {
                    movementCommands++;

                    // Update current position
                    if (command.x !== undefined) currentX = command.x;
                    if (command.y !== undefined) currentY = command.y;

                    // Only add coordinates when tool is active (pen down)
                    if (isToolActive && (command.x !== undefined || command.y !== undefined)) {
                        coordinates.push([currentX, currentY]);
                    }
                }

                // Track tool state (M03 = pen down, M05 = pen up)
                if (command.type === 'tool') {
                    if (command.code === 'M03') {
                        isToolActive = true;
                        // Add current position when pen goes down
                        coordinates.push([currentX, currentY]);
                    } else if (command.code === 'M05') {
                        isToolActive = false;
                    }
                }
            }

            if (coordinates.length === 0) {
                return {
                    success: false,
                    coordinates: [],
                    error: 'No movement coordinates found in G-code. Ensure the G-code contains G0/G1 commands with X/Y parameters.'
                };
            }

            return {
                success: true,
                coordinates,
                metadata: {
                    totalLines,
                    movementCommands,
                    toolpathPoints: coordinates.length
                }
            };

        } catch (error) {
            return {
                success: false,
                coordinates: [],
                error: `Failed to parse G-code: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }

    /**
     * Parse a single G-code line
     */
    private parseGCodeLine(line: string): any {
        const trimmed = line.trim().toUpperCase();

        if (!trimmed) return null;

        // Movement commands (G0, G1, G2, G3)
        if (trimmed.match(/^G[01]\s/)) {
            const coords = this.extractCoordinates(trimmed);
            return {
                type: 'movement',
                code: trimmed.split(' ')[0],
                x: coords.x,
                y: coords.y,
                z: coords.z
            };
        }

        // Tool commands (M03 = spindle on/pen down, M05 = spindle off/pen up)
        if (trimmed.match(/^M0[35]/)) {
            return {
                type: 'tool',
                code: trimmed.split(' ')[0]
            };
        }

        // Other commands (G28 = home, G4 = dwell, etc.)
        return {
            type: 'other',
            code: trimmed.split(' ')[0]
        };
    }

    /**
     * Extract X, Y, Z coordinates from a G-code line
     */
    private extractCoordinates(line: string): { x?: number, y?: number, z?: number } {
        const coords: { x?: number, y?: number, z?: number } = {};

        // Match X, Y, Z coordinates
        const xMatch = line.match(/X([-+]?\d*\.?\d+)/);
        const yMatch = line.match(/Y([-+]?\d*\.?\d+)/);
        const zMatch = line.match(/Z([-+]?\d*\.?\d+)/);

        if (xMatch) coords.x = parseFloat(xMatch[1]);
        if (yMatch) coords.y = parseFloat(yMatch[1]);
        if (zMatch) coords.z = parseFloat(zMatch[1]);

        return coords;
    }

    /**
     * Detect if input is G-code format or JSON array format
     */
    detectInputFormat(input: string): 'gcode' | 'json' | 'unknown' {
        const trimmed = input.trim();

        // Check for JSON array format
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
            try {
                const parsed = JSON.parse(trimmed);
                if (Array.isArray(parsed)) {
                    return 'json';
                }
            } catch (e) {
                // Not valid JSON
            }
        }

        // Check for G-code format
        const lines = trimmed.split('\n');
        const gcodePattern = /^[GM]\d+/;
        let gcodeLines = 0;

        for (const line of lines.slice(0, 10)) { // Check first 10 lines
            if (gcodePattern.test(line.trim().toUpperCase())) {
                gcodeLines++;
            }
        }

        if (gcodeLines > 0) {
            return 'gcode';
        }

        return 'unknown';
    }

    /**
     * Validate coordinate array format
     */
    validateCoordinateArray(input: string): { valid: boolean; coordinates?: number[][]; error?: string } {
        try {
            const parsed = JSON.parse(input);

            if (!Array.isArray(parsed)) {
                return { valid: false, error: 'Input must be an array' };
            }

            if (parsed.length === 0) {
                return { valid: false, error: 'Array cannot be empty' };
            }

            for (let i = 0; i < parsed.length; i++) {
                const point = parsed[i];
                if (!Array.isArray(point) || point.length !== 2) {
                    return { valid: false, error: `Point ${i + 1} must be an array with exactly 2 coordinates [x, y]` };
                }
                if (typeof point[0] !== 'number' || typeof point[1] !== 'number') {
                    return { valid: false, error: `Point ${i + 1} must contain only numbers` };
                }
            }

            return { valid: true, coordinates: parsed };

        } catch (e) {
            return { valid: false, error: 'Invalid JSON format' };
        }
    }

    /**
     * Get sample G-code for demonstration
     */
    getSampleGCode(): string {
        return `G28
G1 Z0.0
M05
G4 P0.2
G0 X10.0 Y10.0
M03
G0 X20.0 Y10.0
G0 X30.0 Y15.0
G0 X40.0 Y20.0
G0 X50.0 Y25.0
G4 P0.2
M05
G4 P0.2
G0 X50.0 Y35.0
M03
G0 X45.0 Y40.0
G0 X40.0 Y45.0
G0 X35.0 Y50.0
G0 X30.0 Y50.0
G4 P0.2
M05
G28`;
    }

    /**
     * Get sample coordinate array for demonstration
     */
    getSampleCoordinateArray(): string {
        return JSON.stringify([
            [10, 10],
            [20, 10],
            [30, 15],
            [40, 20],
            [50, 25],
            [50, 35],
            [45, 40],
            [40, 45],
            [35, 50],
            [30, 50]
        ], null, 2);
    }
}
