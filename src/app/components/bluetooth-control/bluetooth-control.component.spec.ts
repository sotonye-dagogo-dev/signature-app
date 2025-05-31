import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BluetoothControlComponent } from './bluetooth-control.component';
import { BluetoothService } from '../../services/bluetooth/bluetooth.service';
import { BehaviorSubject } from 'rxjs';

describe('BluetoothControlComponent', () => {
  let component: BluetoothControlComponent;
  let fixture: ComponentFixture<BluetoothControlComponent>;
  let mockBluetoothService: jasmine.SpyObj<BluetoothService>;

  beforeEach(async () => {
    mockBluetoothService = jasmine.createSpyObj('BluetoothService',
      ['startScanning', 'connect', 'disconnect'],
      {
        device$: new BehaviorSubject(null),
        isConnected$: new BehaviorSubject(false),
        isScanning$: new BehaviorSubject(false),
        error$: new BehaviorSubject(null)
      }
    );

    await TestBed.configureTestingModule({
      imports: [BluetoothControlComponent],
      providers: [
        { provide: BluetoothService, useValue: mockBluetoothService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BluetoothControlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start scanning when scan button is clicked', async () => {
    mockBluetoothService.startScanning.and.returnValue(Promise.resolve());

    await component.startScanning();

    expect(mockBluetoothService.startScanning).toHaveBeenCalled();
  });

  it('should connect to device when connect button is clicked', async () => {
    mockBluetoothService.connect.and.returnValue(Promise.resolve());

    await component.connect();

    expect(mockBluetoothService.connect).toHaveBeenCalled();
  });

  it('should disconnect from device when disconnect button is clicked', async () => {
    mockBluetoothService.disconnect.and.returnValue(Promise.resolve());

    await component.disconnect();

    expect(mockBluetoothService.disconnect).toHaveBeenCalled();
  });

  it('should handle scan errors', async () => {
    const error = new Error('Scan failed');
    mockBluetoothService.startScanning.and.returnValue(Promise.reject(error));

    try {
      await component.startScanning();
    } catch (e) {
      expect(e).toBeTruthy();
    }
  });

  it('should display error messages', () => {
    const errorMessage = 'Test error message';
    (mockBluetoothService.error$ as BehaviorSubject<string | null>)
      .next(errorMessage);

    fixture.detectChanges();

    const errorElement = fixture.nativeElement.querySelector('.bg-error-light');
    expect(errorElement.textContent.trim()).toBe(errorMessage);
  });

  it('should update connection status display', () => {
    (mockBluetoothService.isConnected$ as BehaviorSubject<boolean>)
      .next(true);

    fixture.detectChanges();

    const statusElement = fixture.nativeElement.querySelector('.text-success');
    expect(statusElement.textContent.trim()).toBe('Connected');
  });
});
