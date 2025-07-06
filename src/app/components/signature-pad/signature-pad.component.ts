import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, PLATFORM_ID, Inject, HostListener } from '@angular/core';
import SignaturePad from 'signature_pad';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faTrash, faDownload, faPaperPlane, faUndo, faRedo } from '@fortawesome/free-solid-svg-icons';
import { ModalComponent } from '../modal/modal.component';
import { SignatureSubmissionFormComponent } from '../signature-submission-form/signature-submission-form.component';
import { SignatureSubmissionData } from '../../services/form/form-utilities.service';
import { GcodeService } from '../../services/gcode/gcode.service';
import { FeedbackDisplayComponent, FeedbackConfig } from '../feedback-display/feedback-display.component';
import { faCode } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-signature-pad',
  standalone: true,
  imports: [FontAwesomeModule, CommonModule, ModalComponent, SignatureSubmissionFormComponent, FeedbackDisplayComponent],
  templateUrl: './signature-pad.component.html',
  styleUrls: ['./signature-pad.component.scss']
})
export class SignaturePadComponent implements AfterViewInit, OnDestroy {
  @ViewChild('signaturePad') signaturePadElement!: ElementRef;
  private signaturePad!: SignaturePad;
  private ratio = 1;

  faTrash = faTrash;
  faDownload = faDownload;
  faPaperPlane = faPaperPlane;
  faCode = faCode;
  faUndo = faUndo;
  faRedo = faRedo;

  // Undo/Redo functionality
  private undoStack: any[] = [];
  private redoStack: any[] = [];
  private maxUndoSteps = 20;

  // Modal state
  isSubmissionModalOpen = false;
  currentSvgData = '';

  // G-code conversion
  showGCodeFeedback = false;
  gcodeFeedbackConfig: FeedbackConfig | null = null;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private gcodeService: GcodeService
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.ratio = Math.max(window.devicePixelRatio || 1, 1);
    }
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.initializeSignaturePad();
    }
  }

  ngOnDestroy() {
    // Clean up
    if (this.signaturePad) {
      this.signaturePad.off();
    }
  }

  @HostListener('window:resize')
  onResize() {
    this.resizeCanvas();
  }

  private initializeSignaturePad() {
    // Initialize the signature pad
    const canvas = this.signaturePadElement.nativeElement;
    this.resizeCanvas();

    this.signaturePad = new SignaturePad(canvas, {
      backgroundColor: 'rgb(255, 255, 255)',
      penColor: 'rgb(0, 0, 0)',
      velocityFilterWeight: 0.7,
      minWidth: 0.5,
      maxWidth: 2.5,
      throttle: 16, // max 60fps
    });

    // Add event listeners for undo/redo functionality
    this.signaturePad.addEventListener('endStroke', () => {
      this.saveState();
    });

    // Save initial empty state
    this.saveState();
  }

  private resizeCanvas(): void {
    const canvas = this.signaturePadElement.nativeElement;
    const wrapper = canvas.parentElement;

    // Set canvas width and height based on parent container
    const width = wrapper.clientWidth;
    const height = wrapper.clientHeight || wrapper.clientWidth / 2; // 2:1 aspect ratio if height not set
    // Scale canvas for high DPI displays
    canvas.width = width * this.ratio;
    canvas.height = height * this.ratio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    // Scale context to counter the HiDPI scaling
    const ctx = canvas.getContext('2d');
    ctx.scale(this.ratio, this.ratio);

    // Clear existing data when resizing
    if (this.signaturePad) {
      this.signaturePad.clear();
    }
  }

  // Undo/Redo functionality
  private saveState(): void {
    if (!this.signaturePad) return;

    const currentState = this.signaturePad.toData();
    this.undoStack.push(JSON.parse(JSON.stringify(currentState)));
    
    // Limit undo stack size
    if (this.undoStack.length > this.maxUndoSteps) {
      this.undoStack.shift();
    }
    
    // Clear redo stack when new action is performed
    this.redoStack = [];
  }

   undo(): void {
    if (!this.signaturePad || this.undoStack.length <= 1) return;

    // Move current state to redo stack
    const currentState = this.undoStack.pop();
    if (currentState) {
      this.redoStack.push(currentState);
    }

    // Apply previous state
    const previousState = this.undoStack[this.undoStack.length - 1];
    if (previousState) {
      this.signaturePad.fromData(previousState);
    }
  }

  redo(): void {
    if (!this.signaturePad || this.redoStack.length === 0) return;

    // Move state from redo to undo stack
    const stateToRedo = this.redoStack.pop();
    if (stateToRedo) {
      this.undoStack.push(stateToRedo);
      this.signaturePad.fromData(stateToRedo);
    }
  }

  canUndo(): boolean {
    return this.undoStack.length > 1;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  clear(): void {
    if (this.signaturePad) {
      this.signaturePad.clear();
      // Reset undo/redo stacks
      this.undoStack = [];
      this.redoStack = [];
      this.saveState();
    }
  }

  download(): void {
    if (!this.signaturePad || !isPlatformBrowser(this.platformId)) return;
    if (this.signaturePad.isEmpty()) {
      alert('Please provide a signature first.');
      return;
    }

    // Get the raw SVG content using toSVG()
    const svgContent = this.signaturePad.toSVG();

    // Create a blob with UTF-8 encoding
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);

    // Create a download link
    const link = document.createElement('a');
    link.download = `signature-${Date.now()}.svg`;
    link.href = url;
    link.click();
    
    // Clean up
    window.URL.revokeObjectURL(url);
  }

  submit(): void {
    if (!this.signaturePad) return;
    if (this.signaturePad.isEmpty()) {
      alert('Please provide a signature first.');
      return;
    }

    // Get the SVG data
    this.currentSvgData = this.signaturePad.toSVG();
    this.isSubmissionModalOpen = true;
  }

  convertToGCode(): void {
    if (!this.signaturePad) return;
    if (this.signaturePad.isEmpty()) {
      alert('Please provide a signature first.');
      return;
    }

    // Get the raw SVG content using toSVG() method
    const svgContent = this.signaturePad.toSVG();
    
    this.gcodeService.resetProgress();
    this.showGCodeFeedback = true;

    this.gcodeService.convertSvgToGcode(svgContent, false).subscribe({
      next: (result) => {
        console.log('G-code conversion result:', result);
        
        this.gcodeFeedbackConfig = {
          type: 'custom',
          message: 'G-Code Generated!',
          subMessage: `${result?.metadata?.gcode_lines} lines generated`,
          size: 'lg',
          position: 'modal',
          showCloseButton: true,
          showActionButtons: true,
          actionButtons: [
            {
              label: 'Download G-Code',
              action: 'download',
              style: 'primary',
              icon: this.faDownload
            },
            {
              label: 'Copy to Clipboard',
              action: 'copy',
              style: 'secondary',
              icon: this.faCode
            }
          ],
          data: {
            type: 'gcode',
            gcode: result?.gcode,
            metadata: result?.metadata
          }
        };
      },
      error: (error) => {
        console.error('G-code conversion failed:', error);
        this.gcodeFeedbackConfig = {
          type: 'error',
          message: 'Conversion Failed',
          subMessage: error,
          size: 'md',
          position: 'modal',
          showCloseButton: true
        };
      }
    });

    // Subscribe to progress
    this.gcodeService.progress$.subscribe(progress => {
      if (progress.status === 'uploading' || progress.status === 'processing') {
        this.gcodeFeedbackConfig = {
          type: 'progress',
          message: progress.message,
          progress: progress.progress,
          size: 'md',
          position: 'modal'
        };
      }
    });
  }

  onGCodeAction(action: string): void {
    switch (action) {
      case 'download':
        if (this.gcodeFeedbackConfig?.data?.gcode) {
          const blob = new Blob([this.gcodeFeedbackConfig.data.gcode], { type: 'text/plain;charset=utf-8' });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `signature-${Date.now()}.gcode`;
          link.click();
          window.URL.revokeObjectURL(url);
        }
        break;
      case 'copy':
        if (this.gcodeFeedbackConfig?.data?.gcode) {
          navigator.clipboard.writeText(this.gcodeFeedbackConfig.data.gcode);
        }
        break;
    }
  }

  onGCodeFeedbackClose(): void {
    this.showGCodeFeedback = false;
    this.gcodeFeedbackConfig = null;
  }

  onSubmissionComplete(data: SignatureSubmissionData): void {
    console.log('Signature submitted successfully:', data);
    this.isSubmissionModalOpen = false;

    // Optionally clear the signature pad after successful submission
    this.clear();

    // Show success message
    alert('Signature submitted successfully!');
  }

  onSubmissionCancel(): void {
    this.isSubmissionModalOpen = false;
  }
}
