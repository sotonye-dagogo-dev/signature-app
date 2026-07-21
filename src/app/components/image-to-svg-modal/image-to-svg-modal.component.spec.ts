import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ImageToSvgModalComponent } from './image-to-svg-modal.component';

describe('ImageToSvgModalComponent', () => {
  let component: ImageToSvgModalComponent;
  let fixture: ComponentFixture<ImageToSvgModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImageToSvgModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImageToSvgModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set isOpen to true when open() is called', () => {
    component.open();
    expect(component.isOpen).toBeTrue();
  });

  it('should reset state when open() is called', () => {
    component.errorMessage = 'previous error';
    component.rawSvgData = 'old data';
    component.open();
    expect(component.errorMessage).toBe('');
    expect(component.rawSvgData).toBe('');
    expect(component.isLoading).toBeFalse();
  });

  it('should set isOpen to false and emit cancel when close() is called', () => {
    spyOn(component.onCancel, 'emit');
    component.open();
    component.close();
    expect(component.isOpen).toBeFalse();
    expect(component.onCancel.emit).toHaveBeenCalled();
  });

  it('should emit svg data and close on confirm()', () => {
    spyOn(component.onSvgReady, 'emit');
    component.rawSvgData = '<svg></svg>';
    component.confirm();
    expect(component.onSvgReady.emit).toHaveBeenCalledWith('<svg></svg>');
    expect(component.isOpen).toBeFalse();
  });
});
