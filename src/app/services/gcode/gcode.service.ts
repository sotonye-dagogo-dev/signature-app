import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpEventType } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { data } from '../../../environment/environment';

export interface GCodeConversionResult {
  success: boolean;
  gcode: string;
  message: string;
  metadata: {
    gcode_lines: number;
    gcode_size: number;
  };
}

export interface SSIMResult {
  success: boolean;
  ssim_score: number;
  similarity_percentage: number;
  message: string;
}

export interface SmoothnessResult {
  success: boolean;
  smoothness_score: number;
  smoothness_percentage: number;
  quality_rating: string;
  message: string;
}

export interface ExecutionErrorResult {
  success: boolean;
  mean_error: number;
  individual_errors: number[];
  max_error: number;
  min_error: number;
  error_std: number;
  accuracy_percentage: number;
  message: string;
}

export interface ApiProgress {
  progress: number;
  status: 'idle' | 'uploading' | 'processing' | 'completed' | 'error';
  message: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class GcodeService {
  private baseUrl = data.gcodeReturner.localApi;
  private progressSubject = new BehaviorSubject<ApiProgress>({
    progress: 0,
    status: 'idle',
    message: 'Ready'
  });

  public progress$ = this.progressSubject.asObservable();

  constructor(private http: HttpClient) { }

  private updateProgress(progress: Partial<ApiProgress>): void {
    this.progressSubject.next({
      ...this.progressSubject.value,
      ...progress
    });
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An error occurred while processing your request';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      switch (error.status) {
        case 400:
          errorMessage = 'Invalid request. Please check your input data.';
          break;
        case 413:
          errorMessage = 'File size too large. Maximum allowed size is 10MB.';
          break;
        case 429:
          errorMessage = 'Too many requests. Please wait before trying again.';
          break;
        case 500:
          errorMessage = 'Server error. Please try again later.';
          break;
        default:
          errorMessage = `Error: ${error.error?.details || error.message}`;
      }
    }

    this.updateProgress({
      status: 'error',
      error: errorMessage
    });

    return throwError(() => errorMessage);
  }

  /**
   * Convert SVG to G-code
   */
  convertSvgToGcode(svgData: File | string, isFile: boolean = false): Observable<GCodeConversionResult> {
    this.updateProgress({ status: 'uploading', progress: 10, message: 'Uploading SVG data...' });

    const formData = new FormData();
    if (isFile && svgData instanceof File) {
      formData.append('svg_file', svgData);
    } else {
      // For raw SVG string, ensure it's properly encoded as UTF-8
      const svgString = typeof svgData === 'string' ? svgData : svgData.toString();
      
      // Create a proper SVG blob with UTF-8 encoding
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      
      // You can either send as file or as raw data depending on API preference
      // Option 1: Send as file
      formData.append('svg_file', svgBlob, 'signature.svg');
      
      // Option 2: Send as raw data (uncomment if API prefers this)
      // formData.append('svg_data', svgString);
    }

    const headers = new HttpHeaders({
      'Accept': 'application/json'
    });

    return this.http.post<GCodeConversionResult>(`${this.baseUrl}convert/`, formData, {
      headers,
      reportProgress: true,
      observe: 'events'
    }).pipe(
      map(event => {
        switch (event.type) {
          case HttpEventType.UploadProgress:
            if (event.total) {
              const progress = Math.round(100 * event.loaded / event.total);
              this.updateProgress({
                progress: progress,
                status: 'uploading',
                message: `Uploading... ${progress}%`
              });
            }
            break;
          case HttpEventType.Response:
            this.updateProgress({
              progress: 100,
              status: 'completed',
              message: 'G-code conversion completed successfully!'
            });
            return event.body as GCodeConversionResult;
        }
        return null as any;
      }),
      tap(() => {
        this.updateProgress({
          status: 'processing',
          progress: 50,
          message: 'Processing SVG data...'
        });
      }),
      catchError(error => {
        console.error('G-code conversion failed:', error);
        return this.handleError(error);
      })
    );
  }

  /**
   * Evaluate SSIM between two images
   */
  evaluateSSIM(originalImage: File | string, reproducedImage: File | string): Observable<SSIMResult> {
    this.updateProgress({ status: 'uploading', progress: 10, message: 'Uploading images for SSIM evaluation...' });

    const formData = new FormData();

    if (originalImage instanceof File) {
      formData.append('original_image', originalImage);
    } else {
      formData.append('original_image_data', originalImage);
    }

    if (reproducedImage instanceof File) {
      formData.append('reproduced_image', reproducedImage);
    } else {
      formData.append('reproduced_image_data', reproducedImage);
    }

    return this.http.post<SSIMResult>(`${this.baseUrl}evaluate/ssim/`, formData, {
      reportProgress: true,
      observe: 'events'
    }).pipe(
      map(event => {
        switch (event.type) {
          case HttpEventType.UploadProgress:
            if (event.total) {
              const progress = Math.round(100 * event.loaded / event.total);
              this.updateProgress({
                progress: progress,
                status: 'uploading',
                message: `Uploading images... ${progress}%`
              });
            }
            break;
          case HttpEventType.Response:
            this.updateProgress({
              progress: 100,
              status: 'completed',
              message: 'SSIM evaluation completed!'
            });
            return event.body as SSIMResult;
        }
        return null as any;
      }),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Evaluate line smoothness
   */
  evaluateSmoothness(image: File | string): Observable<SmoothnessResult> {
    this.updateProgress({ status: 'uploading', progress: 10, message: 'Uploading image for smoothness evaluation...' });

    const formData = new FormData();

    if (image instanceof File) {
      formData.append('image', image);
    } else {
      formData.append('image_data', image);
    }

    return this.http.post<SmoothnessResult>(`${this.baseUrl}evaluate/smoothness/`, formData).pipe(
      tap(() => {
        this.updateProgress({
          status: 'processing',
          progress: 50,
          message: 'Analyzing line smoothness...'
        });
      }),
      tap(() => {
        this.updateProgress({
          progress: 100,
          status: 'completed',
          message: 'Smoothness evaluation completed!'
        });
      }),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Evaluate G-code execution error
   */
  evaluateExecutionError(expectedToolpath: number[][], actualToolpath: number[][]): Observable<ExecutionErrorResult> {
    this.updateProgress({ status: 'processing', progress: 20, message: 'Calculating execution error...' });

    const data = {
      expected_toolpath: expectedToolpath,
      actual_toolpath: actualToolpath
    };

    return this.http.post<ExecutionErrorResult>(`${this.baseUrl}evaluate/execution-error/`, data).pipe(
      tap(() => {
        this.updateProgress({
          progress: 100,
          status: 'completed',
          message: 'Execution error calculation completed!'
        });
      }),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Health check
   */
  healthCheck(): Observable<any> {
    return this.http.get(`${this.baseUrl}health/`).pipe(
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Reset progress state
   */
  resetProgress(): void {
    this.updateProgress({
      progress: 0,
      status: 'idle',
      message: 'Ready'
    });
  }

  /**
   * Get current progress state
   */
  getCurrentProgress(): ApiProgress {
    return this.progressSubject.value;
  }
}