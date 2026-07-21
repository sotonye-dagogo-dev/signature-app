import { Component, EventEmitter, Output, Inject, PLATFORM_ID, ElementRef, ViewChild } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faCamera, faImage, faTimes,
  faCircleNotch, faCheck, faSun, faAdjust
} from '@fortawesome/free-solid-svg-icons';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

export type ImageSource = 'file' | 'paste';

@Component({
  selector: 'app-image-to-svg-modal',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './image-to-svg-modal.component.html',
  styleUrls: ['./image-to-svg-modal.component.scss']
})
export class ImageToSvgModalComponent {
  @ViewChild('previewCanvas') previewCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @Output() onSvgReady = new EventEmitter<string>();
  @Output() onCancel = new EventEmitter<void>();

  isOpen = false;
  isLoading = false;
  errorMessage = '';

  selectedFileName = '';
  selectedFile: File | null = null;
  previewSvg: SafeHtml | null = null;
  rawSvgData = '';

  invertEnabled = false;
  thresholdValue = 128;

  faCamera = faCamera;
  faImage = faImage;
  faTimes = faTimes;
  faCircleNotch = faCircleNotch;
  faCheck = faCheck;
  faSun = faSun;
  faAdjust = faAdjust;

  private isBrowser: boolean;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private sanitizer: DomSanitizer
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  open(): void {
    this.isOpen = true;
    this.errorMessage = '';
    this.previewSvg = null;
    this.rawSvgData = '';
    this.selectedFileName = '';
    this.invertEnabled = false;
    this.thresholdValue = 128;
    this.isLoading = false;
  }

  close(): void {
    this.isOpen = false;
    this.onCancel.emit();
  }

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    this.selectedFileName = file.name;
    this.selectedFile = file;
    this.errorMessage = '';

    if (file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')) {
      this.handleSvgFile(file);
    } else if (file.type.startsWith('image/')) {
      this.handleRasterImage(file);
    } else {
      this.errorMessage = 'Please select an image file (SVG, PNG, JPEG, etc.)';
    }

    input.value = '';
  }

  private handleSvgFile(file: File): void {
    this.isLoading = true;
    const reader = new FileReader();
    reader.onload = () => {
      const svgText = reader.result as string;
      if (!svgText.trim().startsWith('<svg') && !svgText.trim().startsWith('<?xml')) {
        this.errorMessage = 'File does not appear to be a valid SVG';
        this.isLoading = false;
        return;
      }
      this.rawSvgData = svgText;
      this.renderSvgPreview(svgText);
      this.isLoading = false;
    };
    reader.onerror = () => {
      this.errorMessage = 'Failed to read SVG file';
      this.isLoading = false;
    };
    reader.readAsText(file);
  }

  private handleRasterImage(file: File): void {
    this.isLoading = true;
    const reader = new FileReader();
    reader.onload = () => {
      const imageUrl = reader.result as string;
      this.convertRasterToSvg(imageUrl);
    };
    reader.onerror = () => {
      this.errorMessage = 'Failed to read image file';
      this.isLoading = false;
    };
    reader.readAsDataURL(file);
  }

  private convertRasterToSvg(imageUrl: string): void {
    const img = new Image();
    img.onload = () => {
      try {
        const svg = this.generateSvgFromImage(img);
        this.rawSvgData = svg;
        this.renderSvgPreview(svg);
      } catch (e) {
        this.errorMessage = 'Failed to convert image to SVG';
      }
      this.isLoading = false;
    };
    img.onerror = () => {
      this.errorMessage = 'Failed to load image';
      this.isLoading = false;
    };
    img.src = imageUrl;
  }

  private generateSvgFromImage(img: HTMLImageElement): string {
    const canvas = this.previewCanvas?.nativeElement;
    if (!canvas) return '';

    const maxDim = 800;
    let w = img.naturalWidth;
    let h = img.naturalHeight;
    if (w > maxDim || h > maxDim) {
      const scale = Math.min(maxDim / w, maxDim / h);
      w = Math.round(w * scale);
      h = Math.round(h * scale);
    }

    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0, w, h);

    const imageData = ctx.getImageData(0, 0, w, h);
    const pixels = imageData.data;

    if (this.invertEnabled) {
      for (let i = 0; i < pixels.length; i += 4) {
        pixels[i] = 255 - pixels[i];
        pixels[i + 1] = 255 - pixels[i + 1];
        pixels[i + 2] = 255 - pixels[i + 2];
      }
      ctx.putImageData(imageData, 0, 0);
    }

    const tracedSvg = this.tracePixelsToSvgPath(pixels, w, h);
    return tracedSvg || this.createEmbeddedSvg(canvas, w, h);
  }

  private tracePixelsToSvgPath(pixels: Uint8ClampedArray, w: number, h: number): string {
    const threshold = this.thresholdValue;
    const coloredPixels: { x: number; y: number }[] = [];

    for (let y = 0; y < h; y += 2) {
      for (let x = 0; x < w; x += 2) {
        const i = (y * w + x) * 4;
        const brightness = 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
        if (brightness < threshold) {
          coloredPixels.push({ x, y });
        }
      }
    }

    if (coloredPixels.length < 10) return '';

    const grouped = this.groupProximatePixels(coloredPixels, 4);
    let pathD = '';

    for (const group of grouped) {
      if (group.length < 3) continue;

      const sorted = [...group].sort((a, b) => a.x - b.x || a.y - b.y);
      const cx = sorted.reduce((s, p) => s + p.x, 0) / sorted.length;
      const cy = sorted.reduce((s, p) => s + p.y, 0) / sorted.length;
      const sortedByAngle = sorted.sort((a, b) => {
        return Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx);
      });

      if (pathD) pathD += ' ';
      pathD += `M ${sortedByAngle[0].x} ${sortedByAngle[0].y}`;
      for (let i = 1; i < sortedByAngle.length; i++) {
        pathD += ` L ${sortedByAngle[i].x} ${sortedByAngle[i].y}`;
      }
      pathD += ' Z';
    }

    if (!pathD) return '';

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <rect width="${w}" height="${h}" fill="white"/>
  <path d="${pathD}" fill="black"/>
</svg>`;
  }

  private groupProximatePixels(pixels: { x: number; y: number }[], maxDist: number): { x: number; y: number }[][] {
    const groups: { x: number; y: number }[][] = [];
    const assigned = new Set<number>();

    for (let i = 0; i < pixels.length; i++) {
      if (assigned.has(i)) continue;

      const group: { x: number; y: number }[] = [pixels[i]];
      assigned.add(i);
      let ptr = 0;

      while (ptr < group.length) {
        const p = group[ptr];
        for (let j = i + 1; j < pixels.length; j++) {
          if (assigned.has(j)) continue;
          const dx = p.x - pixels[j].x;
          const dy = p.y - pixels[j].y;
          if (Math.sqrt(dx * dx + dy * dy) <= maxDist) {
            group.push(pixels[j]);
            assigned.add(j);
          }
        }
        ptr++;
      }
      groups.push(group);
    }
    return groups;
  }

  private createEmbeddedSvg(canvas: HTMLCanvasElement, w: number, h: number): string {
    const dataUrl = canvas.toDataURL('image/png');
    return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <image xlink:href="${dataUrl}" width="${w}" height="${h}"/>
</svg>`;
  }

  private renderSvgPreview(svg: string): void {
    this.previewSvg = this.sanitizer.bypassSecurityTrustHtml(
      svg.replace('<svg', '<svg style="max-width:100%;max-height:400px;background:white;display:block;margin:0 auto;border:1px solid #d1d5db;border-radius:0.375rem;"')
    );
  }

  applyInvert(): void {
    this.invertEnabled = !this.invertEnabled;

    if (!this.selectedFileName) return;
    const isSvg = this.selectedFileName.toLowerCase().endsWith('.svg');

    if (isSvg && this.rawSvgData) {
      if (this.invertEnabled) {
        const inverted = this.invertSvgColors(this.rawSvgData);
        this.renderSvgPreview(inverted);
        this.rawSvgData = inverted;
      } else {
        this.reprocessImage();
      }
      return;
    }

    if (!isSvg) {
      this.reprocessImage();
    }
  }

  private invertSvgColors(svg: string): string {
    return svg
      .replace(/fill="black"/gi, 'fill="white"')
      .replace(/fill="#000"/gi, 'fill="#fff"')
      .replace(/fill="#000000"/gi, 'fill="#ffffff"')
      .replace(/stroke="black"/gi, 'stroke="white"')
      .replace(/stroke="#000"/gi, 'stroke="#fff"')
      .replace(/stroke="#000000"/gi, 'stroke="#ffffff"')
      .replace(/fill="white"/gi, 'fill="black"')
      .replace(/fill="#fff"/gi, 'fill="#000"')
      .replace(/fill="#ffffff"/gi, 'fill="#000000"')
      .replace(/stroke="white"/gi, 'stroke="black"')
      .replace(/stroke="#fff"/gi, 'stroke="#000"')
      .replace(/stroke="#ffffff"/gi, 'stroke="#000000"');
  }

  private reprocessImage(): void {
    if (!this.selectedFile) {
      this.isLoading = false;
      return;
    }
    this.isLoading = true;
    if (this.selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        this.convertRasterToSvg(reader.result as string);
      };
      reader.readAsDataURL(this.selectedFile);
    } else {
      this.isLoading = false;
    }
  }

  setThreshold(value: number): void {
    this.thresholdValue = value;
    this.reprocessImage();
  }

  confirm(): void {
    if (this.rawSvgData) {
      this.onSvgReady.emit(this.rawSvgData);
      this.isOpen = false;
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }

  onThresholdChange(value: string): void {
    const num = parseInt(value, 10);
    if (!isNaN(num)) {
      this.setThreshold(num);
    }
  }
}
