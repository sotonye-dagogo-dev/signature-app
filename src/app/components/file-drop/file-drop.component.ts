import { Component, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCloudUpload, faFile, faImage, faTimes } from '@fortawesome/free-solid-svg-icons';
import { FormUtilitiesService, FileValidationResult } from '../../services/form/form-utilities.service';

export type FileDropType = 'image' | 'json' | 'any';

@Component({
    selector: 'app-file-drop',
    standalone: true,
    imports: [CommonModule, FontAwesomeModule],
    templateUrl: './file-drop.component.html',
    styleUrls: ['./file-drop.component.scss']
})
export class FileDropComponent {
    @Input() fileType: FileDropType = 'any';
    @Input() label = 'Drop file here or click to browse';
    @Input() required = true;
    @Input() disabled = false;
    @Input() multiple = false;

    @Output() fileSelected = new EventEmitter<File | File[]>();
    @Output() fileRemoved = new EventEmitter<void>();
    @Output() validationError = new EventEmitter<string>();

    @ViewChild('fileInput', { static: true }) fileInput!: ElementRef<HTMLInputElement>;

    selectedFiles: File[] = [];
    dragOver = false;
    validationError$ = '';

    // Icons
    faCloudUpload = faCloudUpload;
    faFile = faFile;
    faImage = faImage;
    faTimes = faTimes;

    constructor(private formUtilities: FormUtilitiesService) { }

    get acceptTypes(): string {
        switch (this.fileType) {
            case 'image':
                return 'image/*';
            case 'json':
                return '.json,.txt';
            default:
                return '*/*';
        }
    }

    get icon() {
        switch (this.fileType) {
            case 'image':
                return this.faImage;
            default:
                return this.faFile;
        }
    }

    onDragOver(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        if (!this.disabled) {
            this.dragOver = true;
        }
    }

    onDragLeave(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.dragOver = false;
    }

    onDrop(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.dragOver = false;

        if (this.disabled) return;

        const files = Array.from(event.dataTransfer?.files || []);
        this.handleFiles(files);
    }

    onFileInputChange(event: Event): void {
        const input = event.target as HTMLInputElement;
        const files = Array.from(input.files || []);
        this.handleFiles(files);
    }

    openFileBrowser(): void {
        if (!this.disabled) {
            this.fileInput.nativeElement.click();
        }
    }

    private handleFiles(files: File[]): void {
        if (files.length === 0) return;

        // If not multiple, take only the first file
        const filesToProcess = this.multiple ? files : [files[0]];

        // Validate files
        const validFiles: File[] = [];
        for (const file of filesToProcess) {
            const validation = this.validateFile(file);
            if (validation.valid && validation.file) {
                validFiles.push(validation.file);
            } else {
                this.validationError$ = validation.error || 'Invalid file';
                this.validationError.emit(this.validationError$);
                return;
            }
        }

        // Clear validation error
        this.validationError$ = '';
        this.selectedFiles = validFiles;

        // Emit the result
        if (this.multiple) {
            this.fileSelected.emit(validFiles);
        } else {
            this.fileSelected.emit(validFiles[0]);
        }
    }

    imageIsFile(file: File): boolean {
        return this.formUtilities.isImageFile(file) || false;
    }

    private validateFile(file: File): FileValidationResult {
        switch (this.fileType) {
            case 'image':
                return this.formUtilities.validateImageFile(file, this.required);
            case 'json':
                return this.formUtilities.validateJsonFile(file, this.required);
            default:
                return { valid: true, file };
        }
    }

    removeFile(index: number): void {
        this.selectedFiles.splice(index, 1);

        if (this.selectedFiles.length === 0) {
            this.fileRemoved.emit();
            // Reset file input
            this.fileInput.nativeElement.value = '';
        } else {
            // Re-emit remaining files
            if (this.multiple) {
                this.fileSelected.emit(this.selectedFiles);
            } else {
                this.fileSelected.emit(this.selectedFiles[0]);
            }
        }
    }

    formatFileSize(bytes: number): string {
        return this.formUtilities.formatFileSize(bytes);
    }

    getFileExtension(filename: string): string {
        return this.formUtilities.getFileExtension(filename);
    }
}
