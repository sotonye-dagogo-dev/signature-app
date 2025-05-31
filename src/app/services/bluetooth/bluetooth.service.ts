/// <reference types="web-bluetooth" />

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface BluetoothDeviceInfo {
  device: BluetoothDevice;
  name: string;
  id: string;
  connected: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class BluetoothService {
  private device: BluetoothDevice | null = null;
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null;

  private deviceSubject = new BehaviorSubject<BluetoothDeviceInfo | null>(null);
  private connectionStatusSubject = new BehaviorSubject<boolean>(false);
  private scanningSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);
  // Define the service UUID for Arduino
  private ARDUINO_SERVICE_UUID = '0000ffe0-0000-1000-8000-00805f9b34fb';
  private ARDUINO_CHARACTERISTIC_UUID = '0000ffe1-0000-1000-8000-00805f9b34fb';
  private pairedDevicesSubject = new BehaviorSubject<BluetoothDeviceInfo[]>([]);
  private availableDevicesSubject = new BehaviorSubject<BluetoothDeviceInfo[]>([]);

  public pairedDevices$ = this.pairedDevicesSubject.asObservable();
  public availableDevices$ = this.availableDevicesSubject.asObservable();
  public device$ = this.deviceSubject.asObservable();
  public isConnected$ = this.connectionStatusSubject.asObservable();
  public isScanning$ = this.scanningSubject.asObservable();
  public error$ = this.errorSubject.asObservable();

  constructor() { }

  async startScanning(): Promise<void> {
    if (!navigator.bluetooth) {
      this.errorSubject.next('Bluetooth not supported');
      return;
    }

    try {
      this.scanningSubject.next(true);
      this.errorSubject.next(null);

      const device = await navigator.bluetooth.requestDevice({
        filters: [
          { services: [this.ARDUINO_SERVICE_UUID] }
        ],
        optionalServices: [this.ARDUINO_SERVICE_UUID]
      });

      const deviceInfo: BluetoothDeviceInfo = {
        device,
        name: device.name || 'Unknown Device',
        id: device.id,
        connected: false
      };

      // Update both available and current device
      this.updateAvailableDevices(deviceInfo);
      this.device = device;
      this.deviceSubject.next(deviceInfo);

      device.addEventListener('gattserverdisconnected', () => {
        this.handleDisconnection();
      });

    } catch (error) {
      // Don't show error for user cancellation
      if (error instanceof Error && error.name !== 'NotFoundError') {
        this.errorSubject.next(error.message);
      }
    } finally {
      this.scanningSubject.next(false);
    }
  }
  
  private updateAvailableDevices(deviceInfo: BluetoothDeviceInfo): void {
    const pairedDevices = this.pairedDevicesSubject.value;
    if (!pairedDevices.some(d => d.id === deviceInfo.id)) {
      const currentAvailable = this.availableDevicesSubject.value;
      if (!currentAvailable.some(d => d.id === deviceInfo.id)) {
        this.availableDevicesSubject.next([...currentAvailable, deviceInfo]);
      }
    }
  }

  async connect(): Promise<void> {
    if (!this.device) {
      this.errorSubject.next('No device selected');
      return;
    }

    try {
      this.errorSubject.next(null);
      const server = await this.device.gatt?.connect();
      if (!server) throw new Error('Failed to connect to GATT server');

      const service = await server.getPrimaryService('arduino');
      this.characteristic = await service.getCharacteristic('tx');

      this.connectionStatusSubject.next(true);
      this.updateDeviceStatus(true);

    } catch (error) {
      this.errorSubject.next(error instanceof Error ? error.message : 'Connection failed');
      this.connectionStatusSubject.next(false);
    }
  }

  async disconnect(): Promise<void> {
    if (!this.device?.gatt?.connected) {
      return;
    }

    try {
      this.device.gatt.disconnect();
      this.handleDisconnection();
    } catch (error) {
      this.errorSubject.next(error instanceof Error ? error.message : 'Disconnection failed');
    }
  }

  async sendData(data: string): Promise<void> {
    if (!this.characteristic || !this.device?.gatt?.connected) {
      throw new Error('Device not connected');
    }

    try {
      const encoder = new TextEncoder();
      const dataArray = encoder.encode(data);
      await this.characteristic.writeValue(dataArray);
    } catch (error) {
      this.errorSubject.next(error instanceof Error ? error.message : 'Failed to send data');
      throw error;
    }
  }

  private handleDisconnection(): void {
    this.connectionStatusSubject.next(false);
    this.updateDeviceStatus(false);
    this.characteristic = null;
  }

  private updateDeviceStatus(connected: boolean): void {
    const currentDevice = this.deviceSubject.value;
    if (currentDevice) {
      this.deviceSubject.next({
        ...currentDevice,
        connected
      });
    }
  }

   // Add a new method to request devices
  async getPairedDevices(): Promise<void> {
    if (!navigator.bluetooth) {
      this.errorSubject.next('Bluetooth not supported');
      return;
    }

    try {
      this.scanningSubject.next(true);
      this.errorSubject.next(null);

      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [this.ARDUINO_SERVICE_UUID]
      });

      // Create device info
      const deviceInfo: BluetoothDeviceInfo = {
        device,
        name: device.name || 'Unknown Device',
        id: device.id,
        connected: device.gatt?.connected || false
      };
// Add to paired devices if not already present
      const currentPairedDevices = this.pairedDevicesSubject.value;
      if (!currentPairedDevices.some(d => d.id === deviceInfo.id)) {
        this.pairedDevicesSubject.next([...currentPairedDevices, deviceInfo]);
      }

    } catch (error) {
      this.errorSubject.next(error instanceof Error ? error.message : 'Failed to get devices');
    } finally {
      this.scanningSubject.next(false);
    }
  }

  async pair(deviceInfo: BluetoothDeviceInfo): Promise<void> {
    try {
      await this.connect();
      const pairedDevices = this.pairedDevicesSubject.value;
      this.pairedDevicesSubject.next([...pairedDevices, deviceInfo]);
      
      // Remove from available devices
      const availableDevices = this.availableDevicesSubject.value
        .filter(d => d.id !== deviceInfo.id);
      this.availableDevicesSubject.next(availableDevices);
    } catch (error) {
      this.errorSubject.next(error instanceof Error ? error.message : 'Failed to pair device');
    }
  }
}
