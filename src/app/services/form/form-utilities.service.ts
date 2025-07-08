import { Injectable } from '@angular/core';
import { FormGroup, FormControl, Validators, AbstractControl } from '@angular/forms';
import { GcodeService } from '../gcode/gcode.service';

export interface SignatureSubmissionData {
  name: string;
  email: string;
  role: 'student' | 'lecturer' | 'other';
  faculty: string;
  department: string;
  consent?: boolean; // Make optional since it won't be sent to backend
  svgData: string;
  submittedAt?: string;
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface FormFieldConfig {
  name: string;
  label: string;
  type: 'text' | 'email' | 'select' | 'checkbox';
  placeholder?: string;
  required: boolean;
  validators?: any[];
  options?: SelectOption[];
  dependsOn?: string; // Field that this field depends on
}

@Injectable({
  providedIn: 'root'
})
export class FormUtilitiesService {

  // Define dynamic form options
  private readonly roleOptions: SelectOption[] = [
    { value: 'student', label: 'Student' },
    { value: 'lecturer', label: 'Lecturer' },
    { value: 'hod', label: 'Head of Department' },
    { value: 'dean', label: 'Dean' },
    { value: 'other', label: 'Other' }
  ];

  private readonly facultyOptions: SelectOption[] = [
    { value: 'engineering', label: 'Engineering' },
    { value: 'law', label: 'Law' },
    { value: 'humanities', label: 'Humanities' },
    { value: 'sciences', label: 'Sciences' },
    { value: 'medicine', label: 'Medicine' },
    { value: 'business', label: 'Business Administration' },
    { value: 'education', label: 'Education' },
    { value: 'arts', label: 'Arts' }
  ];

  private readonly departmentOptions: SelectOption[] = [
    // Engineering departments
    { value: 'computer-engineering', label: 'Computer Engineering' },
    { value: 'mechanical-engineering', label: 'Mechanical Engineering' },
    { value: 'electrical-engineering', label: 'Electrical Engineering' },
    { value: 'civil-engineering', label: 'Civil Engineering' },
    { value: 'ict-engineering', label: 'ICT Engineering' },
    { value: 'automotive-engineering', label: 'Automotive Engineering' },

    // Law departments
    { value: 'commercial-law', label: 'Commercial Law' },
    { value: 'criminal-law', label: 'Criminal Law' },
    { value: 'constitutional-law', label: 'Constitutional Law' },

    // Humanities departments
    { value: 'english', label: 'English' },
    { value: 'history', label: 'History' },
    { value: 'philosophy', label: 'Philosophy' },
    { value: 'linguistics', label: 'Linguistics' },

    // Sciences departments
    { value: 'computer-science', label: 'Computer Science' },
    { value: 'mathematics', label: 'Mathematics' },
    { value: 'physics', label: 'Physics' },
    { value: 'chemistry', label: 'Chemistry' },
    { value: 'biology', label: 'Biology' },
    { value: 'geology', label: 'Geology' },

    // Medicine departments
    { value: 'anatomy', label: 'Anatomy' },
    { value: 'physiology', label: 'Physiology' },
    { value: 'surgery', label: 'Surgery' },
    { value: 'internal-medicine', label: 'Internal Medicine' },

    // Business departments
    { value: 'accounting', label: 'Accounting' },
    { value: 'finance', label: 'Finance' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'management', label: 'Management' },

    // Education departments
    { value: 'educational-psychology', label: 'Educational Psychology' },
    { value: 'curriculum-studies', label: 'Curriculum Studies' },
    { value: 'educational-administration', label: 'Educational Administration' },

    // Arts departments
    { value: 'fine-arts', label: 'Fine Arts' },
    { value: 'music', label: 'Music' },
    { value: 'theatre-arts', label: 'Theatre Arts' }
  ];

  // Define form field configuration
  private readonly formFieldsConfig: FormFieldConfig[] = [
    {
      name: 'name',
      label: 'Full Name',
      type: 'text',
      placeholder: 'Enter your full name',
      required: true,
      validators: [Validators.required, Validators.minLength(2), Validators.maxLength(100)]
    },
    {
      name: 'email',
      label: 'Email Address',
      type: 'email',
      placeholder: 'Enter your email address',
      required: true,
      validators: [Validators.required, Validators.email]
    },
    {
      name: 'role',
      label: 'Role',
      type: 'select',
      required: true,
      validators: [Validators.required],
      options: this.roleOptions
    },
    {
      name: 'faculty',
      label: 'Faculty',
      type: 'select',
      required: true,
      validators: [Validators.required],
      options: this.facultyOptions
    },
    {
      name: 'department',
      label: 'Department',
      type: 'select',
      required: true,
      validators: [Validators.required],
      options: this.departmentOptions,
      dependsOn: 'faculty'
    },
    {
      name: 'consent',
      label: 'I consent to the use of my signature for testing purposes. I understand that my information will be kept private and secure.',
      type: 'checkbox',
      required: true,
      validators: [Validators.requiredTrue]
    }
  ];

  constructor(private gcodeService: GcodeService) { }

  createSignatureSubmissionForm(): FormGroup {
    const formControls: { [key: string]: FormControl } = {};

    this.formFieldsConfig.forEach(field => {
      const defaultValue = field.type === 'checkbox' ? false : '';
      const isInitiallyDisabled = field.dependsOn === 'faculty'; // Department starts disabled

      formControls[field.name] = new FormControl(
        { value: defaultValue, disabled: isInitiallyDisabled },
        field.validators || []
      );
    });

    return new FormGroup(formControls);
  }

  // Method to enable/disable department based on faculty selection
  updateDepartmentControl(form: FormGroup, facultyValue: string): void {
    const departmentControl = form.get('department');
    if (!departmentControl) return;

    if (facultyValue) {
      // Enable department and reset its value
      departmentControl.enable();
      departmentControl.setValue('');
    } else {
      // Disable department and reset its value
      departmentControl.disable();
      departmentControl.setValue('');
    }
  }

  getFormFieldsConfig(): FormFieldConfig[] {
    return this.formFieldsConfig;
  }

  getRoleOptions(): SelectOption[] {
    return this.roleOptions;
  }

  getFacultyOptions(): SelectOption[] {
    return this.facultyOptions;
  }

  getDepartmentOptions(): SelectOption[] {
    return this.departmentOptions;
  }

  // Get departments filtered by faculty
  getDepartmentsByFaculty(faculty: string): SelectOption[] {
    const facultyDepartmentMap: { [key: string]: string[] } = {
      'engineering': [
        'computer-engineering', 'mechanical-engineering', 'electrical-engineering',
        'civil-engineering', 'chemical-engineering', 'petroleum-engineering'
      ],
      'law': ['commercial-law', 'criminal-law', 'constitutional-law'],
      'humanities': ['english', 'history', 'philosophy', 'linguistics'],
      'sciences': [
        'computer-science', 'mathematics', 'physics', 'chemistry', 'biology', 'geology'
      ],
      'medicine': ['anatomy', 'physiology', 'surgery', 'internal-medicine'],
      'business': ['accounting', 'finance', 'marketing', 'management'],
      'education': [
        'educational-psychology', 'curriculum-studies', 'educational-administration'
      ],
      'arts': ['fine-arts', 'music', 'theatre-arts']
    };

    const departmentValues = facultyDepartmentMap[faculty] || [];
    return this.departmentOptions.filter(dept => departmentValues.includes(dept.value));
  }

  getFormErrors(form: FormGroup): { [key: string]: string } {
    const errors: { [key: string]: string } = {};

    Object.keys(form.controls).forEach(key => {
      const control = form.get(key);
      if (control && control.invalid && (control.dirty || control.touched)) {
        errors[key] = this.getControlErrorMessage(key, control);
      }
    });

    return errors;
  }

  private getControlErrorMessage(controlName: string, control: AbstractControl): string {
    if (control.errors) {
      if (control.errors['required']) {
        return `${this.getFieldDisplayName(controlName)} is required`;
      }
      if (control.errors['email']) {
        return 'Please enter a valid email address';
      }
      if (control.errors['minlength']) {
        return `${this.getFieldDisplayName(controlName)} must be at least ${control.errors['minlength'].requiredLength} characters`;
      }
      if (control.errors['maxlength']) {
        return `${this.getFieldDisplayName(controlName)} cannot exceed ${control.errors['maxlength'].requiredLength} characters`;
      }
      if (control.errors['requiredTrue']) {
        return 'You must accept the consent agreement';
      }
    }
    return '';
  }

  private getFieldDisplayName(controlName: string): string {
    const field = this.formFieldsConfig.find(f => f.name === controlName);
    return field ? field.label : controlName;
  }

  async submitSignatureData(data: SignatureSubmissionData): Promise<{ success: boolean; result?: any; error?: string }> {
    try {
      // Prepare submission data for the API - exclude consent field
      const submissionData = {
        name: data.name,
        email: data.email,
        role: data.role,
        faculty: data.faculty,
        department: data.department,
        svg_data: data.svgData,
        submitted_at: data.submittedAt || new Date().toISOString()
        // Note: consent field is intentionally excluded from API submission
      };

      console.log('Submitting signature data to API (consent excluded):', {
        ...submissionData,
        svg_data: submissionData.svg_data.substring(0, 100) + '...' // Log truncated SVG for privacy
      });

      // Use the GCode service for signed submission
      const result = await this.gcodeService.submitSignedData(submissionData).toPromise();

      console.log('API submission successful:', result);
      return { success: true, result };

    } catch (error) {
      console.error('Failed to submit signature data to API:', error);
      return {
        success: false,
        error: typeof error === 'string' ? error : 'Failed to submit data to server'
      };
    }
  }
}
