import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, HostListener, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss']
})
export class ModalComponent implements OnInit, OnDestroy {
  @Input() isOpen = false;
  @Input() title = '';
  @Input() size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
  @Input() closable = true;
  @Input() closeOnEscape = true;
  @Input() closeOnBackdrop = true;

  @Output() onOpen = new EventEmitter<void>();
  @Output() onClose = new EventEmitter<void>();

  faTimes = faTimes;
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit() {
    if (this.isOpen) {
      this.open();
    }
  }

  ngOnDestroy() {
    this.close();
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent) {
    if (this.closeOnEscape && this.isOpen && this.isBrowser) {
      this.close();
    }
  }

  open() {
    this.isOpen = true;
    if (this.isBrowser) {
      document.body.style.overflow = 'hidden';
    }
    this.onOpen.emit();
  }

  close() {
    this.isOpen = false;
    if (this.isBrowser) {
      document.body.style.overflow = 'auto';
    }
    this.onClose.emit();
  }

  onBackdropClick(event: MouseEvent) {
    if (this.closeOnBackdrop && event.target === event.currentTarget) {
      this.close();
    }
  }
}
