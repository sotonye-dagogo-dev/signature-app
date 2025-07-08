import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, from, throwError, BehaviorSubject, of } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';
import { data } from '../../../environment/environment';

export interface UserData {
  id: number;
  name: string;
  email: string;
  role: string;
  department?: string;
  faculty?: string;
  created_at: string;
  updated_at: string;
  submitted_at?: string;
}

export interface SignatureData {
  id: number;
  svg_data: string;
  gcode_data: string;
  metadata: {
    gcode_lines: number;
    gcode_size: number;
    movement_commands: number;
    setup_commands: number;
    estimated_duration: string;
  };
  created_at: string;
}

export interface UserRetrievalResult {
  success: boolean;
  user: UserData;
  signatures: SignatureData[];
}

export interface QueryState {
  lastSearchEmail: string | null;
  lastSearchResult: UserRetrievalResult | null;
  isSearching: boolean;
  searchError: string | null;
  searchTimestamp: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class DbService {
  private baseUrl = data.gcodeReturner.localApi;

  // Cache for query results
  private queryStateSubject = new BehaviorSubject<QueryState>({
    lastSearchEmail: null,
    lastSearchResult: null,
    isSearching: false,
    searchError: null,
    searchTimestamp: null
  });

  public queryState$ = this.queryStateSubject.asObservable();

  // Cache expiration time (30 minutes)
  private readonly CACHE_EXPIRY_MS = 30 * 60 * 1000;

  constructor(private http: HttpClient) { }

  /**
   * Generate HMAC signature for signed requests
   */
  private async generateHmacSignature(requestData: any): Promise<string> {
    const signingKey = data.gcodeReturner.signingKey;

    if (!signingKey) {
      throw new Error('Signing key not configured');
    }

    // Remove signature field from data
    const cleanData = { ...requestData };
    delete cleanData.request_signature;

    // Create canonical string EXACTLY like backend
    const sortedItems = Object.keys(cleanData).sort().map(key => [key, cleanData[key]]);
    const canonicalParts: string[] = [];

    for (const [key, value] of sortedItems) {
      let processedValue: string;

      if (typeof value === 'object' && value !== null) {
        processedValue = JSON.stringify(value);
      } else if (value === null || value === undefined) {
        processedValue = '';
      } else {
        processedValue = String(value);
      }

      const part = `${key}=${processedValue}`;
      canonicalParts.push(part);
    }

    const canonicalString = canonicalParts.join('&');

    // Generate HMAC-SHA256 signature
    const encoder = new TextEncoder();
    const keyData = encoder.encode(signingKey);
    const messageData = encoder.encode(canonicalString);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    const hexSignature = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return hexSignature;
  }

  /**
   * Get current query state
   */
  getCurrentQueryState(): QueryState {
    return this.queryStateSubject.value;
  }

  /**
   * Check if cached data is still valid
   */
  private isCacheValid(timestamp: number | null): boolean {
    if (!timestamp) return false;
    return (Date.now() - timestamp) < this.CACHE_EXPIRY_MS;
  }

  /**
   * Update query state
   */
  private updateQueryState(updates: Partial<QueryState>): void {
    this.queryStateSubject.next({
      ...this.queryStateSubject.value,
      ...updates
    });
  }

  /**
   * Clear cached query data
   */
  clearQueryCache(): void {
    this.updateQueryState({
      lastSearchEmail: null,
      lastSearchResult: null,
      isSearching: false,
      searchError: null,
      searchTimestamp: null
    });
  }

  /**
   * Set search loading state
   */
  setSearchLoading(email: string): void {
    this.updateQueryState({
      lastSearchEmail: email,
      isSearching: true,
      searchError: null
    });
  }

  /**
   * Set search error state
   */
  setSearchError(error: string): void {
    this.updateQueryState({
      isSearching: false,
      searchError: error,
      lastSearchResult: null,
      searchTimestamp: null
    });
  }

  /**
   * Retrieve user data by email with caching
   */
  retrieveUserData(email: string, forceRefresh: boolean = false): Observable<UserRetrievalResult> {
    const currentState = this.getCurrentQueryState();

    // Check if we have valid cached data for the same email
    if (!forceRefresh &&
      currentState.lastSearchEmail === email &&
      currentState.lastSearchResult &&
      this.isCacheValid(currentState.searchTimestamp)) {

      console.log('Returning cached user data for:', email);
      return of(currentState.lastSearchResult);
    }

    // Set loading state
    this.setSearchLoading(email);

    const requestData = { email };

    return from(this.generateHmacSignature(requestData)).pipe(
      switchMap(signature => {
        const signedData = {
          ...requestData,
          request_signature: signature
        };

        const headers = new HttpHeaders({
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Origin': window.location.origin
        });

        return this.http.post<UserRetrievalResult>(
          `${this.baseUrl}${data.gcodeReturner.endpoints.signedRetrieve}`,
          signedData,
          { headers }
        );
      }),
      tap(result => {
        // Cache successful result
        this.updateQueryState({
          lastSearchResult: result,
          isSearching: false,
          searchError: null,
          searchTimestamp: Date.now()
        });
        console.log('User data cached for:', email);
      }),
      catchError(error => {
        const errorMessage = this.getErrorMessage(error);
        this.setSearchError(errorMessage);
        return this.handleError(error);
      })
    );
  }

  /**
   * Refresh current search (if any)
   */
  refreshCurrentSearch(): Observable<UserRetrievalResult | null> {
    const currentState = this.getCurrentQueryState();

    if (currentState.lastSearchEmail) {
      return this.retrieveUserData(currentState.lastSearchEmail, true);
    }

    return of(null);
  }

  /**
   * Check if there's a cached search result
   */
  hasCachedResult(): boolean {
    const state = this.getCurrentQueryState();
    return !!(state.lastSearchResult && this.isCacheValid(state.searchTimestamp));
  }

  /**
   * Get last searched email
   */
  getLastSearchedEmail(): string | null {
    return this.getCurrentQueryState().lastSearchEmail;
  }

  /**
   * Download file helper method
   */
  downloadFile(content: string, filename: string, contentType: string = 'text/plain'): void {
    const blob = new Blob([content], { type: `${contentType};charset=utf-8` });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  /**
   * Copy to clipboard helper method
   */
  async copyToClipboard(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.error('Failed to copy text: ', err);
      return false;
    }
  }

  private getErrorMessage(error: HttpErrorResponse): string {
    if (error.error instanceof ErrorEvent) {
      return `Error: ${error.error.message}`;
    } else {
      switch (error.status) {
        case 400:
          return 'Invalid email address format.';
        case 403:
          return 'Access denied. Invalid signature or untrusted origin.';
        case 404:
          return 'User not found. Please check the email address.';
        case 429:
          return 'Too many requests. Please wait before trying again.';
        case 500:
          return 'Server error. Please try again later.';
        default:
          return error.error?.details || error.message || 'An error occurred while retrieving user data';
      }
    }
  }

  private handleError(error: HttpErrorResponse) {
    const errorMessage = this.getErrorMessage(error);
    return throwError(() => errorMessage);
  }
}
