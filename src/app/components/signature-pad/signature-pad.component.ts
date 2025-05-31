import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, PLATFORM_ID, Inject, HostListener } from '@angular/core';
import SignaturePad from 'signature_pad';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faTrash, faDownload } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-signature-pad',
  standalone: true,
  imports: [FontAwesomeModule, CommonModule],
  templateUrl: './signature-pad.component.html',
  styleUrls: ['./signature-pad.component.scss']
})
export class SignaturePadComponent implements AfterViewInit, OnDestroy {
  @ViewChild('signaturePad') signaturePadElement!: ElementRef;
  private signaturePad!: SignaturePad;
  private ratio = 1;
  faTrash = faTrash;
  faDownload = faDownload;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object
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

  clear(): void {
    if (this.signaturePad) {
      this.signaturePad.clear();
    }
  }

  download(): void {
    if (!this.signaturePad) return;
    if (this.signaturePad.isEmpty()) {
      alert('Please provide a signature first.');
      return;
    }

    // Get the SVG data
    const svgData = this.signaturePad.toDataURL('image/svg+xml');

    // Create a download link
    const link = document.createElement('a');
    link.download = `signature-${Date.now()}.svg`;
    link.href = svgData;
    link.click();
  }
}
