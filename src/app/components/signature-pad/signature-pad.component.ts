import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, PLATFORM_ID, Inject, HostListener } from '@angular/core';
import SignaturePad from 'signature_pad';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faTrash, faDownload, faPaperPlane, faUndo, faRedo, faCode, faCamera } from '@fortawesome/free-solid-svg-icons';
import { ModalComponent } from '../modal/modal.component';
import { SignatureSubmissionFormComponent } from '../signature-submission-form/signature-submission-form.component';
import { SignatureSubmissionData } from '../../services/form/form-utilities.service';
import { GcodeService } from '../../services/gcode/gcode.service';
import { FeedbackDisplayComponent, FeedbackConfig } from '../feedback-display/feedback-display.component';
import { ImageToSvgModalComponent } from '../image-to-svg-modal/image-to-svg-modal.component';

@Component({
  selector: 'app-signature-pad',
  standalone: true,
  imports: [FontAwesomeModule, CommonModule, ModalComponent, SignatureSubmissionFormComponent, FeedbackDisplayComponent, ImageToSvgModalComponent],
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
  faCamera = faCamera;

  // Undo/Redo functionality
  private undoStack: any[] = [];
  private redoStack: any[] = [];
  private maxUndoSteps = 20;

  // Modal state
  isSubmissionModalOpen = false;
  currentSvgData = '';

  // Image-to-SVG modal
  @ViewChild('imageToSvgModal') imageToSvgModal!: ImageToSvgModalComponent;

  // G-code conversion
  showGCodeFeedback = false;
  gcodeFeedbackConfig: FeedbackConfig | null = null;

  // Canvas sizing constants
  private readonly MAX_HEIGHT_PERCENTAGE = 0.75; // 75% of screen height
  private readonly ASPECT_RATIO = 4 / 3; // Preferred aspect ratio
  private readonly MIN_HEIGHT = 400; // Minimum height in pixels

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
    if (!isPlatformBrowser(this.platformId)) return;

    const canvas = this.signaturePadElement.nativeElement;
    const wrapper = canvas.parentElement;

    // Preserve existing signature data before resizing
    let existingData: any[] = [];
    if (this.signaturePad && !this.signaturePad.isEmpty()) {
      existingData = this.signaturePad.toData();
    }

    // Calculate optimal dimensions
    const dimensions = this.calculateOptimalDimensions(wrapper);
    
    // Apply dimensions to canvas element
    canvas.style.width = `${dimensions.width}px`;
    canvas.style.height = `${dimensions.height}px`;

    // Scale canvas for high DPI displays
    canvas.width = dimensions.width * this.ratio;
    canvas.height = dimensions.height * this.ratio;

    // Scale context to counter the HiDPI scaling
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(this.ratio, this.ratio);
    }

    // Restore existing data if signature pad exists and has data
    if (this.signaturePad && existingData.length > 0) {
      // Small delay to ensure canvas is ready
      setTimeout(() => {
        this.signaturePad.fromData(existingData);
      }, 0);
    }
  }

  private calculateOptimalDimensions(wrapper: HTMLElement): { width: number; height: number } {
    // Get available space
    const containerWidth = wrapper.clientWidth;
    const maxHeight = Math.floor(window.innerHeight * this.MAX_HEIGHT_PERCENTAGE);
    
    // Calculate dimensions based on aspect ratio
    let width = containerWidth;
    let height = Math.floor(width / this.ASPECT_RATIO);
    
    // Ensure height doesn't exceed maximum
    if (height > maxHeight) {
      height = maxHeight;
      width = Math.floor(height * this.ASPECT_RATIO);
    }
    
    // Ensure minimum height
    if (height < this.MIN_HEIGHT) {
      height = this.MIN_HEIGHT;
      width = Math.floor(height * this.ASPECT_RATIO);
    }
    
    // Ensure width doesn't exceed container
    if (width > containerWidth) {
      width = containerWidth;
      height = Math.floor(width / this.ASPECT_RATIO);
    }

    return { width, height };
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
        // console.log('G-code conversion result:', result);
        
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
    // console.log('Signature submitted successfully:', data);
    this.isSubmissionModalOpen = false;

    // Optionally clear the signature pad after successful submission
    this.clear();

    // Show success message
    alert('Signature submitted successfully!');
  }

  onSubmissionCancel(): void {
    this.isSubmissionModalOpen = false;
  }

  openImageToSvgModal(): void {
    if (!this.imageToSvgModal) return;
    this.imageToSvgModal.open();
  }

  onImageSvgReady(svgData: string): void {
    if (!svgData) return;

    this.gcodeService.resetProgress();
    this.showGCodeFeedback = true;

    this.gcodeService.convertSvgToGcode(svgData, false).subscribe({
      next: (result) => {
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

  onImageSvgCancel(): void {
    // Modal closed without confirming
  }
}