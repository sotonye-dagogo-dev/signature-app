import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faSpinner, faCheck, faTimes, faExclamationTriangle,
  faInfo, faCopy, faDownload, faRefresh
} from '@fortawesome/free-solid-svg-icons';
import { Subject, takeUntil, interval } from 'rxjs';

export type FeedbackType = 'loading' | 'success' | 'error' | 'warning' | 'info' | 'progress' | 'timer' | 'custom';
export type FeedbackSize = 'sm' | 'md' | 'lg' | 'xl';
export type FeedbackPosition = 'inline' | 'modal' | 'toast';

export interface FeedbackConfig {
  type: FeedbackType;
  message: string;
  subMessage?: string;
  progress?: number;
  maxProgress?: number;
  duration?: number; // for timers
  size?: FeedbackSize;
  position?: FeedbackPosition;
  showCloseButton?: boolean;
  showActionButtons?: boolean;
  actionButtons?: FeedbackButton[];
  autoHide?: boolean;
  autoHideDelay?: number;
  customIcon?: string;
  customClass?: string;
  data?: any; // for custom content
}

export interface FeedbackButton {
  label: string;
  action: string;
  style?: 'primary' | 'secondary' | 'success' | 'error' | 'warning';
  icon?: any;
}

@Component({
  selector: 'app-feedback-display',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './feedback-display.component.html',
  styleUrls: ['./feedback-display.component.scss']
})
export class FeedbackDisplayComponent implements OnInit, OnDestroy {
  @Input() config: FeedbackConfig = {
    type: 'info',
    message: '',
    size: 'md',
    position: 'inline'
  };

  @Input() visible: boolean = true;
  @Output() onAction = new EventEmitter<string>();
  @Output() onClose = new EventEmitter<void>();
  @Output() onHide = new EventEmitter<void>();

  private destroy$ = new Subject<void>();
  private timerCount = 0;

  // Icons
  faSpinner = faSpinner;
  faCheck = faCheck;
  faTimes = faTimes;
  faExclamationTriangle = faExclamationTriangle;
  faInfo = faInfo;
  faCopy = faCopy;
  faDownload = faDownload;
  faRefresh = faRefresh;

  ngOnInit(): void {
    if (this.config.autoHide && this.config.autoHideDelay) {
      setTimeout(() => {
        this.hide();
      }, this.config.autoHideDelay);
    }

    if (this.config.type === 'timer' && this.config.duration) {
      this.startTimer();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get iconClass(): string {
    switch (this.config.type) {
      case 'loading':
        return 'text-blue-500';
      case 'success':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
      case 'warning':
        return 'text-yellow-500';
      case 'info':
        return 'text-blue-500';
      default:
        return 'text-gray-500';
    }
  }

  get containerClass(): string {
    const baseClass = 'feedback-display';
    const sizeClass = `feedback-${this.config.size || 'md'}`;
    const typeClass = `feedback-${this.config.type}`;
    const positionClass = `feedback-${this.config.position || 'inline'}`;
    const customClass = this.config.customClass || '';

    return `${baseClass} ${sizeClass} ${typeClass} ${positionClass} ${customClass}`.trim();
  }

  get progressPercentage(): number {
    if (this.config.type === 'progress' && this.config.progress !== undefined) {
      const max = this.config.maxProgress || 100;
      return Math.round((this.config.progress / max) * 100);
    }
    return 0;
  }

  get timerDisplay(): string {
    if (this.config.type === 'timer' && this.config.duration) {
      const remaining = this.config.duration - this.timerCount;
      const minutes = Math.floor(remaining / 60);
      const seconds = remaining % 60;
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return '00:00';
  }

  private startTimer(): void {
    interval(1000).pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.timerCount++;
      if (this.config.duration && this.timerCount >= this.config.duration) {
        this.onAction.emit('timer-complete');
      }
    });
  }

  handleAction(action: string): void {
    this.onAction.emit(action);
  }

  close(): void {
    this.onClose.emit();
  }

  hide(): void {
    this.visible = false;
    this.onHide.emit();
  }

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      // Optionally show a toast notification
      this.onAction.emit('copied');
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  }
}
