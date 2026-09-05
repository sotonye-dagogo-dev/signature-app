import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, PLATFORM_ID, Inject, HostListener } from '@angular/core';
import SignaturePad from 'signature_pad';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faTrash, faDownload, faPaperPlane, faUndo, faRedo, faCode, faCamera, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { ModalComponent } from '../modal/modal.component';
import { SignatureSubmissionFormComponent } from '../signature-submission-form/signature-submission-form.component';
import { SignatureSubmissionData } from '../../services/form/form-utilities.service';
import { GcodeService } from '../../services/gcode/gcode.service';
import { FeedbackDisplayComponent, FeedbackConfig } from '../feedback-display/feedback-display.component';
import { ImageToSvgModalComponent } from '../image-to-svg-modal/image-to-svg-modal.component';
import { Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

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
  faSpinner = faSpinner;

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
  isConverting = false;

  private destroy$ = new Subject<void>();
  private progressSub: Subscription | null = null;

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
    if (this.signaturePad) {
      this.signaturePad.off();
    }
    this.progressSub?.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('window:resize')
  onResize() {
    this.resizeCanvas();
  }

  private initializeSignaturePad() {
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

    this.signaturePad.addEventListener('endStroke', () => {
      this.saveState();
    });

    this.saveState();
  }

  private resizeCanvas(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const canvas = this.signaturePadElement.nativeElement;
    const wrapper = canvas.parentElement;

    let existingData: any[] = [];
    if (this.signaturePad && !this.signaturePad.isEmpty()) {
      existingData = this.signaturePad.toData();
    }

    const dimensions = this.calculateOptimalDimensions(wrapper);
    
    canvas.style.width = `${dimensions.width}px`;
    canvas.style.height = `${dimensions.height}px`;

    canvas.width = dimensions.width * this.ratio;
    canvas.height = dimensions.height * this.ratio;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(this.ratio, this.ratio);
    }

    if (this.signaturePad && existingData.length > 0) {
      setTimeout(() => {
        this.signaturePad.fromData(existingData);
      }, 0);
    }
  }

  private calculateOptimalDimensions(wrapper: HTMLElement): { width: number; height: number } {
    const containerWidth = wrapper.clientWidth;
    const maxHeight = Math.floor(window.innerHeight * this.MAX_HEIGHT_PERCENTAGE);
    
    let width = containerWidth;
    let height = Math.floor(width / this.ASPECT_RATIO);
    
    if (height > maxHeight) {
      height = maxHeight;
      width = Math.floor(height * this.ASPECT_RATIO);
    }
    
    if (height < this.MIN_HEIGHT) {
      height = this.MIN_HEIGHT;
      width = Math.floor(height * this.ASPECT_RATIO);
    }
    
    if (width > containerWidth) {
      width = containerWidth;
      height = Math.floor(width / this.ASPECT_RATIO);
    }

    return { width, height };
  }

  private saveState(): void {
    if (!this.signaturePad) return;

    const currentState = this.signaturePad.toData();
    this.undoStack.push(JSON.parse(JSON.stringify(currentState)));
    
    if (this.undoStack.length > this.maxUndoSteps) {
      this.undoStack.shift();
    }
    
    this.redoStack = [];
  }

  undo(): void {
    if (!this.signaturePad || this.undoStack.length <= 1) return;

    const currentState = this.undoStack.pop();
    if (currentState) {
      this.redoStack.push(currentState);
    }

    const previousState = this.undoStack[this.undoStack.length - 1];
    if (previousState) {
      this.signaturePad.fromData(previousState);
    }
  }

  redo(): void {
    if (!this.signaturePad || this.redoStack.length === 0) return;

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

    const svgContent = this.signaturePad.toSVG();

    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.download = `signature-${Date.now()}.svg`;
    link.href = url;
    link.click();
    
    window.URL.revokeObjectURL(url);
  }

  submit(): void {
    if (!this.signaturePad) return;
    if (this.signaturePad.isEmpty()) {
      alert('Please provide a signature first.');
      return;
    }

    this.currentSvgData = this.signaturePad.toSVG();
    this.isSubmissionModalOpen = true;
  }

  convertToGCode(): void {
    if (!this.signaturePad) return;
    if (this.isConverting) return;
    if (this.signaturePad.isEmpty()) {
      alert('Please provide a signature first.');
      return;
    }

    const svgContent = this.signaturePad.toSVG();
    this.startGcodeConversion(svgContent);
  }

  private startGcodeConversion(svgData: string): void {
    this.isConverting = true;
    this.gcodeService.resetProgress();
    this.showGCodeFeedback = true;
    this.gcodeFeedbackConfig = {
      type: 'progress',
      message: 'Preparing conversion...',
      progress: 5,
      size: 'md',
      position: 'modal'
    };

    this.progressSub?.unsubscribe();
    this.progressSub = this.gcodeService.progress$.pipe(takeUntil(this.destroy$)).subscribe(progress => {
      if (progress.status === 'uploading' || progress.status === 'processing') {
        // Don't overwrite success/error final state if already completed
        if (!this.showGCodeFeedback) return;
        // Only show progress if not yet in success/error custom state with same progress subscription race
        // Allow progress to update until completed
        if (this.gcodeFeedbackConfig?.type === 'custom' || this.gcodeFeedbackConfig?.type === 'error') {
          // If we already have final state, don't downgrade to progress
          if (progress.status !== 'uploading' && progress.status !== 'processing') return;
        }
        // During active conversion, show progress
        if (this.isConverting) {
          this.gcodeFeedbackConfig = {
            type: 'progress',
            message: progress.message,
            progress: progress.progress,
            size: 'md',
            position: 'modal'
          };
        }
      } else if (progress.status === 'error') {
        // Error is also handled in subscribe error callback; ensure message if not already set
        if (this.isConverting && this.gcodeFeedbackConfig?.type !== 'error') {
          this.gcodeFeedbackConfig = {
            type: 'error',
            message: 'Conversion Failed',
            subMessage: progress.error || progress.message || 'Unable to process. Please try again.',
            size: 'md',
            position: 'modal',
            showCloseButton: true
          };
        }
      }
    });

    this.gcodeService.convertSvgToGcode(svgData, false).pipe(takeUntil(this.destroy$)).subscribe({
      next: (result) => {
        this.isConverting = false;
        this.gcodeFeedbackConfig = {
          type: 'custom',
          message: 'G-Code Generated!',
          subMessage: `${result?.metadata?.gcode_lines ?? 0} lines generated`,
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
        this.isConverting = false;
        const sanitized = typeof error === 'string' ? error : 'Unable to connect to the service. Please try again.';
        this.gcodeFeedbackConfig = {
          type: 'error',
          message: 'Conversion Failed',
          subMessage: sanitized,
          size: 'md',
          position: 'modal',
          showCloseButton: true
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
    this.isConverting = false;
    this.showGCodeFeedback = false;
    this.gcodeFeedbackConfig = null;
    this.progressSub?.unsubscribe();
    this.progressSub = null;
    this.gcodeService.resetProgress();
  }

  onSubmissionComplete(data: SignatureSubmissionData): void {
    this.isSubmissionModalOpen = false;
    this.clear();
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
    if (!svgData || this.isConverting) return;
    this.startGcodeConversion(svgData);
  }

  onImageSvgCancel(): void {
    // Modal closed without confirming
  }
}
