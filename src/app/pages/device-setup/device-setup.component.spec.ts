import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { DeviceSetupComponent } from './device-setup.component';
import { ArduinoService } from '../../services/arduino/arduino.service';
import { BluetoothControlComponent } from '../../components/bluetooth-control/bluetooth-control.component';
import { BehaviorSubject } from 'rxjs';

describe('DeviceSetupComponent', () => {
  let component: DeviceSetupComponent;
  let fixture: ComponentFixture<DeviceSetupComponent>;
  let mockArduinoService: jasmine.SpyObj<ArduinoService>;

  beforeEach(async () => {
    mockArduinoService = jasmine.createSpyObj('ArduinoService',
      ['sendCommand', 'resetDevice'],
      {
        status$: new BehaviorSubject({
          isReady: true,
          currentOperation: 'idle',
          error: null
        })
      }
    );

    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        DeviceSetupComponent,
        BluetoothControlComponent
      ],
      providers: [
        { provide: ArduinoService, useValue: mockArduinoService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DeviceSetupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with default values', () => {
    expect(component.configForm.value).toEqual({
      baudRate: 115200,
      stepperSpeed: 500,
      acceleration: 1000
    });
  });

  it('should validate form inputs', () => {
    const form = component.configForm;

    form.patchValue({
      stepperSpeed: 0,
      acceleration: -1
    });

    expect(form.valid).toBeFalse();
    expect(form.get('stepperSpeed')?.errors?.['min']).toBeTruthy();
    expect(form.get('acceleration')?.errors?.['min']).toBeTruthy();

    form.patchValue({
      stepperSpeed: 1500,
      acceleration: 3000
    });

    expect(form.valid).toBeFalse();
    expect(form.get('stepperSpeed')?.errors?.['max']).toBeTruthy();
    expect(form.get('acceleration')?.errors?.['max']).toBeTruthy();
  });

  it('should test connection', async () => {
    mockArduinoService.sendCommand.and.returnValue(Promise.resolve());

    await component.testConnection();

    expect(mockArduinoService.sendCommand).toHaveBeenCalledWith('M114');
  });

  it('should handle test connection failure', async () => {
    mockArduinoService.sendCommand.and.returnValue(Promise.reject(new Error('Connection failed')));

    spyOn(console, 'error');

    await component.testConnection();

    expect(console.error).toHaveBeenCalled();
  });

  it('should reset device', async () => {
    mockArduinoService.resetDevice.and.returnValue(Promise.resolve());

    await component.resetDevice();

    expect(mockArduinoService.resetDevice).toHaveBeenCalled();
  });

  it('should save configuration when form is valid', async () => {
    mockArduinoService.sendCommand.and.returnValue(Promise.resolve());

    component.configForm.patchValue({
      baudRate: 115200,
      stepperSpeed: 500,
      acceleration: 1000
    });

    await component.saveConfiguration();

    expect(mockArduinoService.sendCommand).toHaveBeenCalledTimes(3);
    expect(mockArduinoService.sendCommand).toHaveBeenCalledWith('M92 X500 Y500');
    expect(mockArduinoService.sendCommand).toHaveBeenCalledWith('M201 X1000 Y1000');
    expect(mockArduinoService.sendCommand).toHaveBeenCalledWith('M500');
  });

  it('should not save configuration when form is invalid', async () => {
    component.configForm.patchValue({
      stepperSpeed: 0, // Invalid value
      acceleration: 1000
    });

    await component.saveConfiguration();

    expect(mockArduinoService.sendCommand).not.toHaveBeenCalled();
  });

  it('should handle save configuration failure', async () => {
    mockArduinoService.sendCommand.and.returnValue(Promise.reject(new Error('Save failed')));

    spyOn(console, 'error');

    component.configForm.patchValue({
      baudRate: 115200,
      stepperSpeed: 500,
      acceleration: 1000
    });

    await component.saveConfiguration();

    expect(console.error).toHaveBeenCalled();
  });
});