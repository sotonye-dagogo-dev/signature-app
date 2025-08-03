import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
    faChartLine, faImage, faCode, faPlay, faInfo, faSpinner,
    faCheck, faTimes, faDownload, faCopy, faLightbulb, faQuestionCircle
} from '@fortawesome/free-solid-svg-icons';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ModalComponent } from '../../components/modal/modal.component';
import { FileDropComponent } from '../../components/file-drop/file-drop.component';
import { FeedbackDisplayComponent, FeedbackConfig } from '../../components/feedback-display/feedback-display.component';
import {
    EvaluationService,
    EvaluationMetric,
    MetricInfo,
    SSIMResponse,
    SmoothnessResponse,
    ExecutionErrorResponse
} from '../../services/evaluation/evaluation.service';
import { FormUtilitiesService } from '../../services/form/form-utilities.service';

interface EvaluationResult {
    metric: EvaluationMetric;
    data: SSIMResponse | SmoothnessResponse | ExecutionErrorResponse;
    timestamp: Date;
}

@Component({
    selector: 'app-evaluation',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FontAwesomeModule,
        ModalComponent,
        FileDropComponent,
        FeedbackDisplayComponent
    ],
    templateUrl: './evaluation.component.html',
    styleUrls: ['./evaluation.component.scss']
})
export class EvaluationComponent implements OnInit, OnDestroy {

    // State
    selectedMetric: EvaluationMetric | null = null;
    showModal = false;
    isEvaluating = false;
    evaluationResults: EvaluationResult[] = [];

    // Forms
    ssimForm!: FormGroup;
    smoothnessForm!: FormGroup;
    executionErrorForm!: FormGroup;

    // Files
    originalImage: File | null = null;
    reproducedImage: File | null = null;
    signatureImage: File | null = null;

    // Feedback
    showFeedback = false;
    feedbackConfig: FeedbackConfig | null = null;

    // Icons
    faChartLine = faChartLine;
    faImage = faImage;
    faCode = faCode;
    faPlay = faPlay;
    faInfo = faInfo;
    faSpinner = faSpinner;
    faCheck = faCheck;
    faTimes = faTimes;
    faDownload = faDownload;
    faCopy = faCopy;
    faLightbulb = faLightbulb;
    faQuestionCircle = faQuestionCircle;

    // Add new properties for format handling
    expectedFormat: 'gcode' | 'json' | 'unknown' = 'unknown';
    actualFormat: 'gcode' | 'json' | 'unknown' = 'unknown';
    showFormatHelp = false;

    private destroy$ = new Subject<void>();

    constructor(
        private fb: FormBuilder,
        private evaluationService: EvaluationService,
        private formUtilities: FormUtilitiesService
    ) {
        this.initializeForms();
    }

    ngOnInit(): void {
        // Load any cached results if needed
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private initializeForms(): void {
        const validators = this.formUtilities.createEvaluationFormValidators();

        this.ssimForm = this.fb.group({
            originalImage: [null, Validators.required],
            reproducedImage: [null, Validators.required]
        });

        this.smoothnessForm = this.fb.group({
            signatureImage: [null, Validators.required]
        });

        this.executionErrorForm = this.fb.group({
            expectedToolpath: ['', [Validators.required, validators.toolpathValidator]],
            actualToolpath: ['', [Validators.required, validators.toolpathValidator]]
        });
    }

    // Metric selection and info
    get metricInfos(): MetricInfo[] {
        return this.evaluationService.getMetricInfos();
    }

    get selectedMetricInfo(): MetricInfo | null {
        return this.selectedMetric ? this.evaluationService.getMetricInfo(this.selectedMetric) || null : null;
    }

    selectMetric(metricId: EvaluationMetric): void {
        this.selectedMetric = metricId;
        this.showModal = true;
        this.resetCurrentForm();
    }

    showMetricInfo(metricId: EvaluationMetric): void {
        const metricInfo = this.evaluationService.getMetricInfo(metricId);
        if (!metricInfo) return;

        this.feedbackConfig = {
            type: 'info',
            message: metricInfo.name,
            subMessage: metricInfo.description,
            size: 'lg',
            position: 'modal',
            showCloseButton: true,
            data: {
                type: 'metric-info',
                tips: metricInfo.tips,
                outputDescription: metricInfo.outputDescription
            }
        };
        this.showFeedback = true;
    }

    // File handling
    onOriginalImageSelected(file: File): void {
        this.originalImage = file;
        this.ssimForm.patchValue({ originalImage: file });
    }

    onReproducedImageSelected(file: File): void {
        this.reproducedImage = file;
        this.ssimForm.patchValue({ reproducedImage: file });
    }

    onSignatureImageSelected(file: File): void {
        this.signatureImage = file;
        this.smoothnessForm.patchValue({ signatureImage: file });
    }

    onFileValidationError(error: string): void {
        this.showErrorFeedback('File Validation Error', error);
    }

    // Toolpath helpers
    insertSampleToolpath(field: 'expected' | 'actual'): void {
        const sample = this.evaluationService.getSampleToolpath();
        const control = field === 'expected' ? 'expectedToolpath' : 'actualToolpath';
        this.executionErrorForm.patchValue({ [control]: sample });
        this.updateToolpathFormat(field, sample);
    }

    insertSampleGCode(field: 'expected' | 'actual'): void {
        const sample = this.evaluationService.getSampleGCode();
        const control = field === 'expected' ? 'expectedToolpath' : 'actualToolpath';
        this.executionErrorForm.patchValue({ [control]: sample });
        this.updateToolpathFormat(field, sample);
    }

    onToolpathChange(field: 'expected' | 'actual', value: string): void {
        this.updateToolpathFormat(field, value);
    }

    private updateToolpathFormat(field: 'expected' | 'actual', value: string): void {
        if (!value.trim()) {
            if (field === 'expected') {
                this.expectedFormat = 'unknown';
            } else {
                this.actualFormat = 'unknown';
            }
            return;
        }

        const format = this.evaluationService.parseGCodeToCoordinates(value).success ? 'gcode' : 
                      this.evaluationService.validateToolpathFormat(value).format || 'unknown';

        if (field === 'expected') {
            this.expectedFormat = format as 'gcode' | 'json' | 'unknown';
        } else {
            this.actualFormat = format as 'gcode' | 'json' | 'unknown';
        }
    }

    toggleFormatHelp(): void {
        this.showFormatHelp = !this.showFormatHelp;
    }

    getFormatLabel(format: 'gcode' | 'json' | 'unknown'): string {
        switch (format) {
            case 'gcode':
                return 'G-Code Format';
            case 'json':
                return 'JSON Array';
            case 'unknown':
                return 'Unknown Format';
        }
    }

    getFormatDescription(format: 'gcode' | 'json' | 'unknown'): string {
        switch (format) {
            case 'gcode':
                return 'Standard G-code with movement commands (G0, G1) and coordinates (X, Y)';
            case 'json':
                return 'JSON array of coordinate pairs: [[x1,y1], [x2,y2], ...]';
            case 'unknown':
                return 'Please enter valid G-code or JSON coordinate array';
        }
    }

    // Evaluation execution
    runEvaluation(): void {
        if (!this.selectedMetric || this.isEvaluating) return;

        this.isEvaluating = true;

        switch (this.selectedMetric) {
            case 'ssim':
                this.runSSIMEvaluation();
                break;
            case 'smoothness':
                this.runSmoothnessEvaluation();
                break;
            case 'execErr':
                this.runExecutionErrorEvaluation();
                break;
        }
    }

    private runSSIMEvaluation(): void {
        if (!this.originalImage || !this.reproducedImage) {
            this.isEvaluating = false;
            this.showErrorFeedback('Missing Files', 'Please select both original and reproduced images');
            return;
        }

        this.evaluationService.evaluateSSIM(this.originalImage, this.reproducedImage)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (result) => {
                    this.handleEvaluationSuccess('ssim', result);
                },
                error: (error) => {
                    this.handleEvaluationError(error);
                }
            });
    }

    private runSmoothnessEvaluation(): void {
        if (!this.signatureImage) {
            this.isEvaluating = false;
            this.showErrorFeedback('Missing File', 'Please select a signature image');
            return;
        }

        this.evaluationService.evaluateSmoothness(this.signatureImage)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (result) => {
                    this.handleEvaluationSuccess('smoothness', result);
                },
                error: (error) => {
                    this.handleEvaluationError(error);
                }
            });
    }

    // Enhanced validation for execution error
    private runExecutionErrorEvaluation(): void {
        if (!this.executionErrorForm.valid) {
            this.isEvaluating = false;
            this.executionErrorForm.markAllAsTouched();
            this.showErrorFeedback('Invalid Input', 'Please check your toolpath data');
            return;
        }

        const expectedText = this.executionErrorForm.get('expectedToolpath')?.value;
        const actualText = this.executionErrorForm.get('actualToolpath')?.value;

        // Validate and convert both inputs to coordinate arrays
        const expectedValidation = this.validateAndConvertToolpath(expectedText, 'expected');
        const actualValidation = this.validateAndConvertToolpath(actualText, 'actual');

        if (!expectedValidation.valid || !actualValidation.valid) {
            this.isEvaluating = false;
            const error = expectedValidation.error || actualValidation.error || 'Invalid toolpath format';
            this.showErrorFeedback('Invalid Toolpath', error);
            return;
        }

        // Check if both toolpaths have the same number of points
        if (expectedValidation.coordinates!.length !== actualValidation.coordinates!.length) {
            this.isEvaluating = false;
            this.showErrorFeedback(
                'Toolpath Mismatch', 
                `Expected toolpath has ${expectedValidation.coordinates!.length} points, but actual toolpath has ${actualValidation.coordinates!.length} points. Both must have the same number of points.`
            );
            return;
        }

        this.evaluationService.evaluateExecutionError(expectedValidation.coordinates!, actualValidation.coordinates!)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (result) => {
                    this.handleEvaluationSuccess('execErr', result);
                },
                error: (error) => {
                    this.handleEvaluationError(error);
                }
            });
    }

    private validateAndConvertToolpath(input: string, fieldName: string): { valid: boolean; coordinates?: number[][]; error?: string } {
        // First try to detect format
        const format = this.evaluationService.parseGCodeToCoordinates(input).success ? 'gcode' : 'json';

        if (format === 'gcode') {
            const gcodeResult = this.evaluationService.parseGCodeToCoordinates(input);
            if (!gcodeResult.success) {
                return {
                    valid: false,
                    error: `${fieldName} G-code parsing failed: ${gcodeResult.error}`
                };
            }
            return {
                valid: true,
                coordinates: gcodeResult.coordinates
            };
        } else {
            const jsonValidation = this.evaluationService.validateToolpathFormat(input);
            if (!jsonValidation.valid) {
                return {
                    valid: false,
                    error: `${fieldName} JSON validation failed: ${jsonValidation.error}`
                };
            }
            return {
                valid: true,
                coordinates: jsonValidation.toolpath
            };
        }
    }

    // Get toolpath statistics for display
    getToolpathStats(field: 'expected' | 'actual'): { points: number; format: string } | null {
        const control = this.executionErrorForm.get(field === 'expected' ? 'expectedToolpath' : 'actualToolpath');
        const value = control?.value;
        
        if (!value?.trim()) return null;

        const validation = this.validateAndConvertToolpath(value, field);
        if (!validation.valid) return null;

        const format = field === 'expected' ? this.expectedFormat : this.actualFormat;
        
        return {
            points: validation.coordinates?.length || 0,
            format: this.getFormatLabel(format)
        };
    }

    // Form helpers
    private resetCurrentForm(): void {
        if (!this.selectedMetric) return;

        switch (this.selectedMetric) {
            case 'ssim':
                this.ssimForm.reset();
                this.originalImage = null;
                this.reproducedImage = null;
                break;
            case 'smoothness':
                this.smoothnessForm.reset();
                this.signatureImage = null;
                break;
            case 'execErr':
                this.executionErrorForm.reset();
                this.expectedFormat = 'unknown';
                this.actualFormat = 'unknown';
                this.showFormatHelp = false;
                break;
        }
    }

    get currentForm(): FormGroup | null {
        switch (this.selectedMetric) {
            case 'ssim':
                return this.ssimForm;
            case 'smoothness':
                return this.smoothnessForm;
            case 'execErr':
                return this.executionErrorForm;
            default:
                return null;
        }
    }

    get canRunEvaluation(): boolean {
        return !!this.currentForm?.valid && !this.isEvaluating;
    }

    // Results helpers
    getResultScore(result: EvaluationResult): number {
        switch (result.metric) {
            case 'ssim':
                return (result.data as SSIMResponse).ssim_score;
            case 'smoothness':
                return (result.data as SmoothnessResponse).smoothness_score;
            case 'execErr':
                return (result.data as ExecutionErrorResponse).mean_error;
            default:
                return 0;
        }
    }

    getResultInterpretation(result: EvaluationResult): string {
        return result.data?.interpretation || 'Nil';
    }

    formatScore(score: number, metric: EvaluationMetric): string {
        if (metric === 'execErr') {
            return score.toFixed(4); // More precision for error values
        }
        return score.toFixed(3);
    }

    metricInfoName(metric: any): string {
        return this.evaluationService.getMetricInfo(metric)?.name || 'Nil'
    }

    downloadResult(result: EvaluationResult): void {
        const filename = `evaluation-${result.metric}-${result.timestamp.toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
        const dataStr = JSON.stringify(result, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = filename;
        link.click();

        URL.revokeObjectURL(link.href);
    }

    // Feedback helpers
    private showSuccessFeedback(title: string, message: string): void {
        this.feedbackConfig = {
            type: 'success',
            message: title,
            subMessage: message,
            autoHide: true,
            autoHideDelay: 3000,
            position: 'toast'
        };
        this.showFeedback = true;
    }

    private showErrorFeedback(title: string, message: string): void {
        this.feedbackConfig = {
            type: 'error',
            message: title,
            subMessage: message,
            showCloseButton: true,
            position: 'toast'
        };
        this.showFeedback = true;
    }

    // Modal and feedback handlers
    onModalClose(): void {
        this.showModal = false;
        this.selectedMetric = null;
    }

    onFeedbackClose(): void {
        this.showFeedback = false;
        this.feedbackConfig = null;
    }

    onFeedbackAction(action: string): void {
        // Handle any feedback actions if needed
    }

    // Utility methods
    getMetricIcon(metricId: EvaluationMetric) {
        switch (metricId) {
            case 'ssim':
                return this.faImage;
            case 'smoothness':
                return this.faChartLine;
            case 'execErr':
                return this.faCode;
            default:
                return this.faQuestionCircle;
        }
    }

    clearResults(): void {
        this.evaluationResults = [];
    }
}
