import { TestBed } from '@angular/core/testing';
import { ArduinoService } from '../arduino.service';
import { BluetoothService } from './bluetooth.service';
import { BehaviorSubject, firstValueFrom } from 'rxjs';

describe('ArduinoService', () => {
  let service: ArduinoService;
  let mockBluetoothService: jasmine.SpyObj<BluetoothService>;

  beforeEach(() => {
    mockBluetoothService = jasmine.createSpyObj('BluetoothService', ['sendData'], {
      isConnected$: new BehaviorSubject<boolean>(true)
    });

    TestBed.configureTestingModule({
      providers: [
        ArduinoService,
        { provide: BluetoothService, useValue: mockBluetoothService }
      ]
    });
    service = TestBed.inject(ArduinoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should validate correct G-code', async () => {
    const validGCode = `
      G1 X100 Y100
      G2 X150 Y150 I25 J0
      M3 S1000
    `;

    const result = await service.validateGCode(validGCode);
    expect(result).toBe(true);
  });

  it('should reject invalid G-code', async () => {
    const invalidGCode = `
      G1 X100 Y100
      INVALID X150 Y150
      M3 S1000
    `;

    const result = await service.validateGCode(invalidGCode);
    expect(result).toBe(false);
  });

  it('should send formatted commands', async () => {
    mockBluetoothService.sendData.and.returnValue(Promise.resolve());

    await service.sendCommand('G1 X100 Y100');

    expect(mockBluetoothService.sendData).toHaveBeenCalledWith('G1 X100 Y100\n');
  });

  it('should handle command errors', async () => {
    mockBluetoothService.sendData.and.returnValue(Promise.reject(new Error('Send failed')));

    try {
      await service.sendCommand('G1 X100 Y100');
      fail('Should have thrown an error');
    } catch (error) {
      const status = await firstValueFrom(service.status$);
      expect(status.error).toBe('Send failed');
      expect(status.currentOperation).toBe('error');
    }
  });

  it('should execute G-code sequence', async () => {
    mockBluetoothService.sendData.and.returnValue(Promise.resolve());

    const gcode = `
      G1 X100 Y100
      G1 X150 Y150
    `;

    await service.executeGCode(gcode);

    expect(mockBluetoothService.sendData).toHaveBeenCalledTimes(2);

    const status = await firstValueFrom(service.status$);
    expect(status.currentOperation).toBe('completed');
  });

  it('should reset device', async () => {
    mockBluetoothService.sendData.and.returnValue(Promise.resolve());

    await service.resetDevice();

    expect(mockBluetoothService.sendData).toHaveBeenCalledWith('M0\n');
    expect(mockBluetoothService.sendData).toHaveBeenCalledWith('G28\n');

    const status = await firstValueFrom(service.status$);
    expect(status.currentOperation).toBe('idle');
  });

  it('should handle device reset errors', async () => {
    mockBluetoothService.sendData.and.returnValue(Promise.reject(new Error('Reset failed')));

    try {
      await service.resetDevice();
      fail('Should have thrown an error');
    } catch (error) {
      const status = await firstValueFrom(service.status$);
      expect(status.error).toBe('Reset failed');
      expect(status.currentOperation).toBe('error');
    }
  });

  it('should update status when bluetooth connection changes', async () => {
    (mockBluetoothService.isConnected$ as BehaviorSubject<boolean>).next(false);

    const status = await firstValueFrom(service.status$);
    expect(status.isReady).toBe(false);
    expect(status.currentOperation).toBeNull();
  });
});
