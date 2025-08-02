import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpEventType } from '@angular/common/http';
import { BehaviorSubject, Observable, from, throwError } from 'rxjs';
import { map, catchError, tap, switchMap } from 'rxjs/operators';
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

export interface SignedSubmissionData {
  name: string;
  email: string;
  role: string;
  faculty: string;
  department: string;
  svg_data: string;
  submitted_at: string;
}

export interface SignedSubmissionResult {
  success: boolean;
  user_id: number;
  signature_id: number;
  message: string;
  gcode: string;
  metadata: {
    gcode_lines: number;
    gcode_size: number;
    movement_commands: number;
    setup_commands: number;
    estimated_duration: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class GcodeService {
  private baseUrl = data.gcodeReturner.localApi;
  //private baseUrl = data.gcodeReturner.prodApi;
  private cachedSigningKey: string | null = null;
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

  /**
   * Fetch signing key for HMAC signature generation
   */
  async getSigningKey(): Promise<string> {
    if (this.cachedSigningKey) {
      return this.cachedSigningKey;
    }

    try {
      // This is still not truly secure, but adds a layer of obfuscation.
      // The following code decrypts the signing key using AES-256-CBC.

      // Convert the hex-encoded key derivation salt to a Uint8Array
    const keyDerivationSalt = new Uint8Array(
      data.gcodeReturner.keyDerivationSalt.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
    );

    // For AES-CBC decryption, we need to use the key directly, not derive it with PBKDF2
    // Since your build script uses the encryptionKey directly for AES-CBC
    const key = await crypto.subtle.importKey(
      'raw',
      keyDerivationSalt, // This is actually the encryption key, not a salt
      { name: 'AES-CBC', length: 256 },
      false,
      ['decrypt']
    );

    // Convert the hex-encoded encrypted data to a Uint8Array
    const encryptedDataHex = data.gcodeReturner.encryptedSigningKey;
    const encryptedDataBytes = new Uint8Array(encryptedDataHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));

    // For AES-CBC, the IV is 16 bytes (128 bits)
    const iv = encryptedDataBytes.slice(0, 16);
    const ciphertext = encryptedDataBytes.slice(16);

    // Decrypt the data using AES-CBC
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-CBC',
        iv: iv
      },
      key,
      ciphertext
    );

    // Decode the decrypted ArrayBuffer into a UTF-8 string
    this.cachedSigningKey = new TextDecoder().decode(decrypted);

    return this.cachedSigningKey;
    } catch (error) {
      console.error('Error decrypting signing key:', error);
      throw error;
    }
  }

    /**
   * Generate HMAC signature for signed requests
   */
  async generateHmacSignature(submissionData: any): Promise<string> {
    const signingKey = data.production ? await this.getSigningKey() : data.gcodeReturner.signingKey;
    // console.log('Signing key:', signingKey); // debugging

    if (!signingKey) {
      throw new Error('Signing key not configured');
    }

    // Remove signature field from data (matching backend)
    const cleanData = { ...submissionData };
    delete cleanData.request_signature;

    // Create canonical string EXACTLY like backend
    // Backend uses: sorted_items = sorted(clean_data.items())
    const sortedItems = Object.keys(cleanData).sort().map(key => [key, cleanData[key]]);

    const canonicalParts: string[] = [];

    for (const [key, value] of sortedItems) {

      let processedValue: string;

      // Match backend logic exactly:
      // if isinstance(value, dict):
      //     value = json.dumps(value, sort_keys=True)
      // elif isinstance(value, list):
      //     value = json.dumps(value, sort_keys=True)
      // elif value is None:
      //     value = ''
      // else:
      //     value = str(value)

      if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
          // Handle arrays
          processedValue = JSON.stringify(value);
        } else {
          // Handle objects - use sort_keys=True equivalent
          processedValue = JSON.stringify(value, Object.keys(value).sort());
        }
      } else if (value === null || value === undefined) {
        processedValue = '';
      } else {
        processedValue = String(value);
      }

      const part = `${key}=${processedValue}`;
      canonicalParts.push(part);
    }

    // Backend uses: canonical_string = "&".join(canonical_parts)
    const canonicalString = canonicalParts.join('&');

    // Generate HMAC-SHA256 signature (same as backend)
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

    /* console.log('Frontend generated signature:', hexSignature);
    console.log('Frontend signature length:', hexSignature.length); */

    return hexSignature;
  }

    /**
   * Submit signed form data with user information and signature
   */
  submitSignedData(submissionData: SignedSubmissionData): Observable<SignedSubmissionResult> {
    this.updateProgress({
      status: 'uploading',
      progress: 10,
      message: 'Preparing signed submission...'
    });

    // Ensure the data format matches what the backend expects
    const formattedData = {
      name: submissionData.name,
      email: submissionData.email,
      role: submissionData.role,
      faculty: submissionData.faculty,
      department: submissionData.department,
      svg_data: submissionData.svg_data
    };

    return from(this.generateHmacSignature(formattedData)).pipe(
      switchMap(signature => {
        const signedData = {
          ...formattedData,
          request_signature: signature
        };

        const headers = new HttpHeaders({
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Origin': window.location.origin
        });

        this.updateProgress({
          status: 'uploading',
          progress: 30,
          message: 'Submitting form data...'
        });

        return this.http.post<SignedSubmissionResult>(
          `${this.baseUrl}${data.gcodeReturner.endpoints.signedSubmit}`,
          signedData,
          {
            headers,
            reportProgress: true,
            observe: 'events'
          }
        );
      }),
      map(event => {
        switch (event.type) {
          case HttpEventType.UploadProgress:
            if (event.total) {
              const progress = Math.round(100 * event.loaded / event.total);
              this.updateProgress({
                progress: 30 + (progress * 0.4), // 30-70% for upload
                status: 'uploading',
                message: `Uploading... ${progress}%`
              });
            }
            break;
          case HttpEventType.Response:
            this.updateProgress({
              progress: 100,
              status: 'completed',
              message: 'Form submitted successfully!'
            });
            return event.body as SignedSubmissionResult;
        }
        return null as any;
      }),
      tap(() => {
        this.updateProgress({
          status: 'processing',
          progress: 70,
          message: 'Processing submission and generating G-code...'
        });
      }),
      catchError(error => {
        console.error('Signed submission failed:', error);
        return this.handleError(error);
      })
    );
  }
}