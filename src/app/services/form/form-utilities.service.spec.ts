import { TestBed } from '@angular/core/testing';
import { FormUtilitiesService } from './form-utilities.service';

describe('FormUtilitiesService', () => {
  let service: FormUtilitiesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FormUtilitiesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should create signature submission form with proper validation', () => {
    const form = service.createSignatureSubmissionForm();
    
    expect(form.get('name')).toBeTruthy();
    expect(form.get('email')).toBeTruthy();
    expect(form.get('role')).toBeTruthy();
    expect(form.get('consent')).toBeTruthy();
  });

  it('should return form errors correctly', () => {
    const form = service.createSignatureSubmissionForm();
    form.get('name')?.markAsTouched();
    form.get('email')?.markAsTouched();
    
    const errors = service.getFormErrors(form);
    expect(errors['name']).toBeTruthy();
    expect(errors['email']).toBeTruthy();
  });
});
