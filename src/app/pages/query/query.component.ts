import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faSearch, faDownload, faCopy, faEye, faUser, faEnvelope,
  faUserTag, faBuilding, faGraduationCap, faCalendarAlt,
  faCode, faFileCode, faSpinner, faRefresh, faTimes
} from '@fortawesome/free-solid-svg-icons';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil, startWith } from 'rxjs/operators';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

import { DbService, UserData, SignatureData, UserRetrievalResult, QueryState } from '../../services/db/db.service';
import { FeedbackDisplayComponent, FeedbackConfig } from '../../components/feedback-display/feedback-display.component';

@Component({
  selector: 'app-query',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FontAwesomeModule,
    FeedbackDisplayComponent
  ],
  templateUrl: './query.component.html',
  styleUrls: ['./query.component.scss']
})
export class QueryComponent implements OnInit, OnDestroy {
  searchForm!: FormGroup;

  // State managed by DbService
  queryState: QueryState = {
    lastSearchEmail: null,
    lastSearchResult: null,
    isSearching: false,
    searchError: null,
    searchTimestamp: null
  };

  // Feedback for preview modals
  showFeedback = false;
  feedbackConfig: FeedbackConfig | null = null;

  // Icons
  faSearch = faSearch;
  faDownload = faDownload;
  faCopy = faCopy;
  faEye = faEye;
  faUser = faUser;
  faEnvelope = faEnvelope;
  faUserTag = faUserTag;
  faBuilding = faBuilding;
  faGraduationCap = faGraduationCap;
  faCalendarAlt = faCalendarAlt;
  faCode = faCode;
  faFileCode = faFileCode;
  faSpinner = faSpinner;
  faRefresh = faRefresh;
  faTimes = faTimes;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private dbService: DbService,
    private sanitizer: DomSanitizer
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    // Subscribe to query state changes
    this.dbService.queryState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.queryState = state;

        // Restore form value if we have a cached search
        if (state.lastSearchEmail && !this.searchForm.get('email')?.value) {
          this.searchForm.patchValue({ email: state.lastSearchEmail }, { emitEvent: false });
        }
      });

    // Check if we have cached data on component init
    const cachedState = this.dbService.getCurrentQueryState();
    /* if (cachedState.lastSearchEmail) {
      console.log('Restored cached search state for:', cachedState.lastSearchEmail);
    } */
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.searchForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSearch(): void {
    if (this.searchForm.valid && !this.queryState.isSearching) {
      const email = this.searchForm.get('email')?.value?.trim();

      if (email) {
        this.searchUser(email);
      }
    } else {
      this.searchForm.markAllAsTouched();
    }
  }

  onRefresh(): void {
    if (this.queryState.lastSearchEmail && !this.queryState.isSearching) {
      // console.log('Refreshing search for:', this.queryState.lastSearchEmail);
      this.searchUser(this.queryState.lastSearchEmail, true);
    }
  }

  private searchUser(email: string, forceRefresh: boolean = false): void {
    this.dbService.retrieveUserData(email, forceRefresh)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result: UserRetrievalResult) => {
          // console.log('User data retrieved:', result);
          // State is managed by DbService, component just reacts to changes
        },
        error: (error: string) => {
          console.error('Search failed:', error);
          // Error state is managed by DbService
        }
      });
  }

  // Computed properties based on cached state
  get userData(): UserData | null {
    return this.queryState.lastSearchResult?.user || null;
  }

  get signatures(): SignatureData[] {
    return this.queryState.lastSearchResult?.signatures || [];
  }

  get isSearching(): boolean {
    return this.queryState.isSearching;
  }

  get searchError(): string | null {
    return this.queryState.searchError;
  }

  get hasUserData(): boolean {
    return !!this.userData;
  }

  get hasSignatures(): boolean {
    return this.signatures.length > 0;
  }

  get hasCachedData(): boolean {
    return this.dbService.hasCachedResult();
  }

  get cacheAge(): string {
    if (!this.queryState.searchTimestamp) return '';

    const ageMs = Date.now() - this.queryState.searchTimestamp;
    const ageMinutes = Math.floor(ageMs / (1000 * 60));

    if (ageMinutes < 1) return 'Just now';
    if (ageMinutes === 1) return '1 minute ago';
    if (ageMinutes < 60) return `${ageMinutes} minutes ago`;

    const ageHours = Math.floor(ageMinutes / 60);
    if (ageHours === 1) return '1 hour ago';
    return `${ageHours} hours ago`;
  }

  get formattedJoinDate(): string {
    if (!this.userData?.created_at) return 'Unknown';
    return new Date(this.userData.created_at).toLocaleDateString();
  }

  get formattedLastUpdate(): string {
    if (!this.userData?.updated_at) return 'Unknown';
    return new Date(this.userData.updated_at).toLocaleDateString();
  }

  // SVG operations
  sanitizeSvg(svgData: string): SafeHtml {
    if (!svgData) return '';

    let processedSvg = svgData;
    if (!processedSvg.includes('style=')) {
      processedSvg = processedSvg.replace(
        '<svg',
        '<svg style="width: 100%; max-width: 300px; height: auto; min-height: 150px; border: 1px solid #e5e7eb; background: white;"'
      );
    }

    return this.sanitizer.bypassSecurityTrustHtml(processedSvg);
  }

  previewSvg(signature: SignatureData): void {
    this.feedbackConfig = {
      type: 'custom',
      message: 'SVG Signature Preview',
      subMessage: `Created on ${new Date(signature.created_at).toLocaleDateString()}`,
      size: 'lg',
      position: 'modal',
      showCloseButton: true,
      showActionButtons: true,
      actionButtons: [
        {
          label: 'Download SVG',
          action: 'download-svg',
          style: 'primary',
          icon: this.faDownload
        }
      ],
      data: {
        type: 'svg-preview',
        signature: signature
      }
    };
    this.showFeedback = true;
  }

  previewGCode(signature: SignatureData): void {
    this.feedbackConfig = {
      type: 'custom',
      message: 'G-Code Preview',
      subMessage: `${signature.metadata.gcode_lines} lines | Estimated duration: ${signature.metadata.estimated_duration}`,
      size: 'lg',
      position: 'modal',
      showCloseButton: true,
      showActionButtons: true,
      actionButtons: [
        {
          label: 'Download G-Code',
          action: 'download-gcode',
          style: 'primary',
          icon: this.faDownload
        },
        {
          label: 'Copy G-Code',
          action: 'copy-gcode',
          style: 'secondary',
          icon: this.faCopy
        }
      ],
      data: {
        type: 'gcode-preview',
        signature: signature
      }
    };
    this.showFeedback = true;
  }

  // Download operations
  downloadSvg(signature: SignatureData): void {
    const filename = `signature-${signature.id}-${new Date(signature.created_at).toISOString().slice(0, 10)}.svg`;
    this.dbService.downloadFile(signature.svg_data, filename, 'image/svg+xml');
  }

  downloadGCode(signature: SignatureData): void {
    const filename = `signature-${signature.id}-${new Date(signature.created_at).toISOString().slice(0, 10)}.gcode`;
    this.dbService.downloadFile(signature.gcode_data, filename, 'text/plain');
  }

  // Copy operations
  async copyGCode(signature: SignatureData): Promise<void> {
    const success = await this.dbService.copyToClipboard(signature.gcode_data);
    /* if (success) {
      // Show temporary success feedback
      console.log('G-Code copied to clipboard');
    } */
  }

  // Feedback handlers
  onFeedbackAction(action: string): void {
    const signature = this.feedbackConfig?.data?.signature;
    if (!signature) return;

    switch (action) {
      case 'download-svg':
        this.downloadSvg(signature);
        break;
      case 'download-gcode':
        this.downloadGCode(signature);
        break;
      case 'copy-gcode':
        this.copyGCode(signature);
        break;
    }
  }

  onFeedbackClose(): void {
    this.showFeedback = false;
    this.feedbackConfig = null;
  }

  // Form helpers
  get emailError(): string {
    const control = this.searchForm.get('email');
    if (control?.errors && (control.dirty || control.touched)) {
      if (control.errors['required']) {
        return 'Email is required';
      }
      if (control.errors['email']) {
        return 'Please enter a valid email address';
      }
    }
    return '';
  }

  clearSearch(): void {
    this.searchForm.reset();
    this.dbService.clearQueryCache();
  }

  dateValue(givenDate: any): string {
    // handle timestamps or all types of date values
    return new Date(givenDate)?.toLocaleDateString() || 'Unknown';
  }
}
