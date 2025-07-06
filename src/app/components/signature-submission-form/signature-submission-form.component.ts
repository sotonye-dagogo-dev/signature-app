import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { FormUtilitiesService, SignatureSubmissionData, FormFieldConfig, SelectOption } from '../../services/form/form-utilities.service';
import { GcodeService, ApiProgress } from '../../services/gcode/gcode.service';
import { FeedbackDisplayComponent, FeedbackConfig } from '../feedback-display/feedback-display.component';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faDownload } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-signature-submission-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, FeedbackDisplayComponent, FontAwesomeModule],
  templateUrl: './signature-submission-form.component.html',
  styleUrls: ['./signature-submission-form.component.scss']
})
export class SignatureSubmissionFormComponent implements OnInit, OnDestroy {
  @Input() svgData = '';
  @Output() uponSubmit = new EventEmitter<SignatureSubmissionData>();
  @Output() onCancel = new EventEmitter<void>();

  form!: FormGroup;
  isSubmitting = false;
  formErrors: { [key: string]: string } = {};
  formFields: FormFieldConfig[] = [];

  // Dynamic options
  departmentOptions: SelectOption[] = [];
  selectedFaculty = '';

  // Progress tracking
  apiProgress$: Observable<ApiProgress>;
  feedbackConfig: FeedbackConfig | null = null;
  showFeedback = false;

  destroy$: Subject<void> = new Subject<void>();

  private gcodeService = inject(GcodeService);
  private formUtilities = inject(FormUtilitiesService);

  FaDownload = faDownload;

  constructor(
    private sanitizer: DomSanitizer
  ) {
    this.apiProgress$ = this.gcodeService.progress$;
  }

  ngOnInit() {
    this.form = this.formUtilities.createSignatureSubmissionForm();
    this.formFields = this.formUtilities.getFormFieldsConfig();
    this.departmentOptions = this.formUtilities.getDepartmentOptions();

    // Watch for form changes to update errors
    this.form.valueChanges.subscribe(() => {
      this.formErrors = this.formUtilities.getFormErrors(this.form);
    });

    // Watch for faculty changes to filter departments
    this.form.get('faculty')?.valueChanges.subscribe((faculty: string) => {
      this.selectedFaculty = faculty;
      if (faculty) {
        this.departmentOptions = this.formUtilities.getDepartmentsByFaculty(faculty);
        // Reset department when faculty changes
        this.form.get('department')?.setValue('');
      } else {
        this.departmentOptions = this.formUtilities.getDepartmentOptions();
      }
    });

    // Subscribe to API progress
    this.apiProgress$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(progress => {
      this.updateFeedbackFromProgress(progress);
    });
  }

  ngOnDestroy() {
    this.gcodeService.resetProgress();
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Sanitized SVG for safe HTML binding
  get sanitizedSvgData(): SafeHtml {
    if (!this.svgData) {
      return this.sanitizer.bypassSecurityTrustHtml('<p class="no-signature">No signature provided</p>');
    }
    
    // Ensure the SVG has proper dimensions and styling
    let processedSvg = this.svgData;
    
    // If SVG doesn't have width/height, add them
    if (!processedSvg.includes('width=') || !processedSvg.includes('height=')) {
      processedSvg = processedSvg.replace(
        '<svg',
        '<svg width="100%" height="200" style="max-width: 400px; border: 1px solid #e5e7eb; background: white;"'
      );
    } else {
      // Add styling to existing SVG
      processedSvg = processedSvg.replace(
        '<svg',
        '<svg style="width: 100%; max-width: 400px; height: auto; min-height: 150px; border: 1px solid #e5e7eb; background: white;"'
      );
    }
    
    return this.sanitizer.bypassSecurityTrustHtml(processedSvg);
  }

  // Check if SVG data exists and is valid
  get hasSvgData(): boolean {
    return !!(this.svgData && this.svgData.trim().toLowerCase().includes('<svg'));
  }

  async onFormSubmit() {
    if (this.form.valid && !this.isSubmitting) {
      this.isSubmitting = true;

      const formData = this.form.value;
      const submissionData: SignatureSubmissionData = {
        ...formData,
        svgData: this.svgData
      };

      try {
        const success = await this.formUtilities.submitSignatureData(submissionData);
        if (success) {
          this.uponSubmit.emit(submissionData);
        }
      } catch (error) {
        console.error('Submission failed:', error);
      } finally {
        this.isSubmitting = false;
      }
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.form.controls).forEach(key => {
        this.form.get(key)?.markAsTouched();
      });
      this.formErrors = this.formUtilities.getFormErrors(this.form);
    }
  }

  onCancelClick() {
    this.onCancel.emit();
  }

  getFieldError(fieldName: string): string {
    return this.formErrors[fieldName] || '';
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.form.get(fieldName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getFieldOptions(fieldName: string): SelectOption[] {
    const field = this.formFields.find(f => f.name === fieldName);
    if (fieldName === 'department') {
      return this.departmentOptions;
    }
    return field?.options || [];
  }

  getSelectPlaceholder(fieldName: string): string {
    const placeholders: { [key: string]: string } = {
      role: 'Select your role',
      faculty: 'Select your faculty',
      department: this.selectedFaculty ? 'Select your department' : 'Please select a faculty first'
    };
    return placeholders[fieldName] || 'Select an option';
  }

  private updateFeedbackFromProgress(progress: ApiProgress): void {
    if (progress.status === 'idle') {
      this.showFeedback = false;
      return;
    }

    this.showFeedback = true;

    switch (progress.status) {
      case 'uploading':
      case 'processing':
        this.feedbackConfig = {
          type: 'progress',
          message: progress.message,
          progress: progress.progress,
          size: 'md',
          position: 'inline'
        };
        break;

      case 'completed':
        // Will be updated when we get the actual result
        break;

      case 'error':
        this.feedbackConfig = {
          type: 'error',
          message: 'Conversion Failed',
          subMessage: progress.error || progress.message,
          size: 'md',
          position: 'inline',
          showCloseButton: true,
          autoHide: true,
          autoHideDelay: 5000
        };
        break;
    }
  }

  async onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    try {
      this.isSubmitting = true;
      this.gcodeService.resetProgress();

      const formData: SignatureSubmissionData = {
        ...this.form.value,
        svgData: this.svgData,
        submittedAt: new Date().toISOString()
      };

      console.log('Starting signature submission:', formData);

      // Convert SVG to G-code
      this.gcodeService.convertSvgToGcode(this.svgData).subscribe({
        next: (result) => {
          console.log('G-code conversion successful:', result);

          // Display G-code result
          this.feedbackConfig = {
            type: 'custom',
            message: 'G-Code Generated Successfully!',
            subMessage: 'Your signature has been converted to G-Code format',
            size: 'lg',
            position: 'modal',
            showCloseButton: true,
            showActionButtons: true,
            actionButtons: [
              {
                label: 'Download G-Code',
                action: 'download',
                style: 'primary',
                icon: this.FaDownload
              },
              {
                label: 'Send to Device',
                action: 'send-to-device',
                style: 'success'
              }
            ],
            data: {
              type: 'gcode',
              gcode: result.gcode,
              metadata: result.metadata
            }
          };

          // Log complete submission data
          const completeSubmission = {
            formData,
            gcodeResult: result,
            timestamp: new Date().toISOString()
          };

          console.log('Complete submission data:', completeSubmission);

          this.isSubmitting = false;
        },
        error: (error) => {
          console.error('G-code conversion failed:', error);
          this.isSubmitting = false;
        }
      });

    } catch (error) {
      console.error('Submission error:', error);
      this.isSubmitting = false;

      this.feedbackConfig = {
        type: 'error',
        message: 'Submission Failed',
        subMessage: 'An unexpected error occurred. Please try again.',
        size: 'md',
        position: 'inline',
        showCloseButton: true
      };
    }
  }

  onFeedbackAction(action: string): void {
    switch (action) {
      case 'download':
        this.downloadGCode();
        break;
      case 'send-to-device':
        this.sendToDevice();
        break;
      case 'copied':
        // Show temporary success message
        setTimeout(() => {
          this.feedbackConfig = {
            ...this.feedbackConfig!,
            message: 'Copied to Clipboard!',
            type: 'success'
          };
        }, 100);
        break;
    }
  }

  private downloadGCode(): void {
    if (this.feedbackConfig?.data?.gcode) {
      const blob = new Blob([this.feedbackConfig.data.gcode], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `signature-gcode-${Date.now()}.gcode`;
      link.click();
      window.URL.revokeObjectURL(url);
    }
  }

  private sendToDevice(): void {
    // This will integrate with Arduino service later
    console.log('Sending G-code to device...');
    // TODO: Integrate with Arduino service
  }

  onFeedbackClose(): void {
    this.showFeedback = false;
    this.feedbackConfig = null;
    this.gcodeService.resetProgress();
  }

}
