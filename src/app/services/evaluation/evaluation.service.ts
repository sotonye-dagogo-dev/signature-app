import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { data } from '../../../environment/environment';
import { GcodeParserService, GCodeParseResult } from '../gcode/gcode-parser.service';

export interface SSIMRequest {
    original_image_data?: string;
    reproduced_image_data?: string;
}

export interface SSIMResponse {
    success: boolean;
    ssim_score: number;
    message: string;
    interpretation: string;
}

export interface SmoothnessRequest {
    image_data?: string;
}

export interface SmoothnessResponse {
    success: boolean;
    smoothness_score: number;
    message: string;
    interpretation: string;
}

export interface ExecutionErrorRequest {
    expected_toolpath: number[][];
    actual_toolpath: number[][];
}

export interface ExecutionErrorResponse {
    success: boolean;
    mean_error: number;
    individual_errors: number[];
    message: string;
    analysis: {
        max_error: number;
        min_error: number;
        error_std: number;
        total_points: number;
    };
    interpretation?: string;
}

export interface EvaluationError {
    success: false;
    error: string;
    details: string;
}

export type EvaluationMetric = 'ssim' | 'smoothness' | 'execErr';

export interface MetricInfo {
    id: EvaluationMetric;
    name: string;
    description: string;
    inputs: string[];
    outputDescription: string;
    tips: string[];
}

@Injectable({
    providedIn: 'root'
})
export class EvaluationService {

    private readonly baseUrl = data.production ? data.gcodeReturner.prodEvalApi : data.gcodeReturner.localEvalApi;

    private readonly metricInfos: MetricInfo[] = [
        {
            id: 'ssim',
            name: 'SSIM (Structural Similarity)',
            description: 'Calculate structural similarity between two images. Returns a value between 0 and 1, where 1 indicates identical images.',
            inputs: ['Original Image', 'Reproduced Image'],
            outputDescription: 'SSIM Score (0.0 - 1.0)',
            tips: [
                'Use PNG format for best results with signatures',
                'Ensure both images have similar dimensions',
                'Scores above 0.7 indicate good similarity',
                'Ideal for comparing original vs reproduced signatures'
            ]
        },
        {
            id: 'smoothness',
            name: 'Line Smoothness Analysis',
            description: 'Analyze the smoothness of lines in a signature image. Returns a score between 0 and 1, where 1 indicates very smooth lines.',
            inputs: ['Signature Image'],
            outputDescription: 'Smoothness Score (0.0 - 1.0)',
            tips: [
                'Works best with clean signature images',
                'Higher scores indicate smoother pen strokes',
                'Scores above 0.6 indicate good line quality',
                'Useful for evaluating G-code reproduction quality'
            ]
        },
        {
            id: 'execErr',
            name: 'Execution Error Analysis',
            description: 'Calculate execution error between expected and actual G-code toolpaths. Compares coordinate arrays and returns distance-based error metrics.',
            inputs: ['Expected Toolpath (JSON)', 'Actual Toolpath (JSON)'],
            outputDescription: 'Error metrics including mean error and analysis',
            tips: [
                'Input format: [[x1,y1], [x2,y2], ...]',
                'Both toolpaths must have the same number of points',
                'Lower error values indicate better accuracy',
                'Use for comparing intended vs executed toolpaths'
            ]
        }
    ];

    constructor(
        private http: HttpClient,
        private gcodeParser: GcodeParserService
    ) { }

    getMetricInfos(): MetricInfo[] {
        return this.metricInfos;
    }

    getMetricInfo(metricId: EvaluationMetric): MetricInfo | undefined {
        return this.metricInfos.find(info => info.id === metricId);
    }

    // Convert file to base64
    fileToBase64(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const result = reader.result as string;
                // Remove data URL prefix (data:image/png;base64,)
                const base64 = result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = error => reject(error);
        });
    }

    // SSIM Evaluation
    evaluateSSIM(originalFile: File, reproducedFile: File): Observable<SSIMResponse> {
        return new Observable(observer => {
            Promise.all([
                this.fileToBase64(originalFile),
                this.fileToBase64(reproducedFile)
            ]).then(([originalB64, reproducedB64]) => {
                const request: SSIMRequest = {
                    original_image_data: originalB64,
                    reproduced_image_data: reproducedB64
                };

                this.http.post<SSIMResponse>(`${this.baseUrl}${data.gcodeReturner.endpoints.ssim}`, request)
                    .pipe(
                        catchError(this.handleError)
                    )
                    .subscribe({
                        next: response => {
                            observer.next(response);
                            observer.complete();
                        },
                        error: error => observer.error(error)
                    });
            }).catch(error => {
                observer.error('Failed to process image files: ' + error.message);
            });
        });
    }

    // Smoothness Evaluation
    evaluateSmoothness(imageFile: File): Observable<SmoothnessResponse> {
        return new Observable(observer => {
            this.fileToBase64(imageFile).then(imageB64 => {
                const request: SmoothnessRequest = {
                    image_data: imageB64
                };

                this.http.post<SmoothnessResponse>(`${this.baseUrl}${data.gcodeReturner.endpoints.smoothness}`, request)
                    .pipe(
                        catchError(this.handleError)
                    )
                    .subscribe({
                        next: response => {
                            observer.next(response);
                            observer.complete();
                        },
                        error: error => observer.error(error)
                    });
            }).catch(error => {
                observer.error('Failed to process image file: ' + error.message);
            });
        });
    }

    // Execution Error Evaluation
    evaluateExecutionError(expectedToolpath: number[][], actualToolpath: number[][]): Observable<ExecutionErrorResponse> {
        const request: ExecutionErrorRequest = {
            expected_toolpath: expectedToolpath,
            actual_toolpath: actualToolpath
        };

        return this.http.post<ExecutionErrorResponse>(`${this.baseUrl}${data.gcodeReturner.endpoints.execErr}`, request)
            .pipe(
                catchError(this.handleError)
            );
    }

    // Health check for evaluation API
    checkHealth(): Observable<any> {
        return this.http.get(`${this.baseUrl}health/`)
            .pipe(
                catchError(this.handleError)
            );
    }

    private handleError = (error: any) => {
        console.error('Evaluation API Error:', error);

        let errorMessage = 'An error occurred during evaluation';

        if (error.error && typeof error.error === 'object') {
            if (error.error.details) {
                errorMessage = error.error.details;
            } else if (error.error.error) {
                errorMessage = error.error.error;
            }
        } else if (error.message) {
            errorMessage = error.message;
        }

        return throwError(() => errorMessage);
    };

    // Utility methods for toolpath validation
    validateToolpathFormat(toolpathText: string): { valid: boolean; toolpath?: number[][]; error?: string; format?: string } {
        const format = this.gcodeParser.detectInputFormat(toolpathText);
        
        switch (format) {
            case 'json':
                const jsonResult = this.gcodeParser.validateCoordinateArray(toolpathText);
                return {
                    valid: jsonResult.valid,
                    toolpath: jsonResult.coordinates,
                    error: jsonResult.error,
                    format: 'json'
                };
                
            case 'gcode':
                const gcodeResult = this.gcodeParser.parseGCode(toolpathText);
                return {
                    valid: gcodeResult.success,
                    toolpath: gcodeResult.coordinates,
                    error: gcodeResult.error,
                    format: 'gcode'
                };
                
            default:
                return {
                    valid: false,
                    error: 'Unknown input format. Please provide either G-code or JSON coordinate array.',
                    format: 'unknown'
                };
        }
    }

    // Get sample toolpath for demonstration (JSON format)
    getSampleToolpath(): string {
        return this.gcodeParser.getSampleCoordinateArray();
    }

    // Get sample G-code for demonstration
    getSampleGCode(): string {
        return this.gcodeParser.getSampleGCode();
    }

    // Convert G-code to coordinate array
    parseGCodeToCoordinates(gcodeText: string): GCodeParseResult {
        return this.gcodeParser.parseGCode(gcodeText);
    }
}
