import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SignatureSubmissionFormComponent } from './signature-submission-form.component';

describe('SignatureSubmissionFormComponent', () => {
  let component: SignatureSubmissionFormComponent;
  let fixture: ComponentFixture<SignatureSubmissionFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SignatureSubmissionFormComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(SignatureSubmissionFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
