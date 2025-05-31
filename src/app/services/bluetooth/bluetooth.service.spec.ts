import { TestBed } from '@angular/core/testing';
import { BluetoothService, BluetoothDeviceInfo } from './bluetooth.service';
import { firstValueFrom } from 'rxjs';

describe('BluetoothService', () => {
  let service: BluetoothService;
  let mockBluetoothDevice: Partial<BluetoothDevice>;
  let mockGATTServer: any;
  let mockService: any;
  let mockCharacteristic: any;

  beforeEach(() => {
    // Mock Bluetooth device and GATT setup
    mockCharacteristic = {
      writeValue: jasmine.createSpy('writeValue').and.returnValue(Promise.resolve())
    };

    mockService = {
      getCharacteristic: jasmine.createSpy('getCharacteristic').and.returnValue(Promise.resolve(mockCharacteristic))
    };

    mockGATTServer = {
      connect: jasmine.createSpy('connect').and.returnValue(Promise.resolve()),
      getPrimaryService: jasmine.createSpy('getPrimaryService').and.returnValue(Promise.resolve(mockService)),
      connected: true,
      disconnect: jasmine.createSpy('disconnect')
    };

    mockBluetoothDevice = {
      id: 'test-device-id',
      name: 'Test Arduino Device',
      gatt: mockGATTServer,
      addEventListener: jasmine.createSpy('addEventListener')
    };

    // Mock navigator.bluetooth
    (global as any).navigator = {
      bluetooth: {
        requestDevice: jasmine.createSpy('requestDevice').and.returnValue(Promise.resolve(mockBluetoothDevice))
      }
    };

    TestBed.configureTestingModule({
      providers: [BluetoothService]
    });
    service = TestBed.inject(BluetoothService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start scanning and find a device', async () => {
    await service.startScanning();

    const deviceInfo = await firstValueFrom(service.device$);
    expect(deviceInfo).toBeTruthy();
    expect(deviceInfo?.id).toBe('test-device-id');
    expect(deviceInfo?.name).toBe('Test Arduino Device');
  });

  it('should handle scanning errors', async () => {
    (navigator as any).bluetooth.requestDevice.and.returnValue(Promise.reject(new Error('Scan failed')));

    await service.startScanning();

    const error = await firstValueFrom(service.error$);
    expect(error).toBe('Scan failed');
  });

  it('should connect to a device successfully', async () => {
    await service.startScanning();
    await service.connect();

    const isConnected = await firstValueFrom(service.isConnected$);
    expect(isConnected).toBe(true);
  });

  it('should handle connection errors', async () => {
    mockGATTServer.connect.and.returnValue(Promise.reject(new Error('Connection failed')));

    await service.startScanning();
    await service.connect();

    const error = await firstValueFrom(service.error$);
    expect(error).toBe('Connection failed');
  });

  it('should disconnect from device', async () => {
    await service.startScanning();
    await service.connect();
    await service.disconnect();

    const isConnected = await firstValueFrom(service.isConnected$);
    expect(isConnected).toBe(false);
  });

  it('should send data successfully', async () => {
    await service.startScanning();
    await service.connect();

    await service.sendData('test data');

    expect(mockCharacteristic.writeValue).toHaveBeenCalled();
  });

  it('should handle data transmission errors', async () => {
    mockCharacteristic.writeValue.and.returnValue(Promise.reject(new Error('Transmission failed')));

    await service.startScanning();
    await service.connect();

    try {
      await service.sendData('test data');
      fail('Should have thrown an error');
    } catch (error) {
      const errorMessage = await firstValueFrom(service.error$);
      expect(errorMessage).toBe('Failed to send data');
    }
  });
});
