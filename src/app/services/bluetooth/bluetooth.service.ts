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

  private readonly SERVICE_UUID = {
    ARDUINO_UART: '0000ffe0-0000-1000-8000-00805f9b34fb', // HC-05 typically uses this
    ARDUINO_UART_ALT: '0000fff0-0000-1000-8000-00805f9b34fb' // Alternative service
  };

  private readonly CHARACTERISTIC_UUID = {
    ARDUINO_UART: '0000ffe1-0000-1000-8000-00805f9b34fb', // HC-05 typically uses this
    ARDUINO_UART_ALT: '0000fff1-0000-1000-8000-00805f9b34fb' // Alternative characteristic
  };
  private pairedDevicesSubject = new BehaviorSubject<BluetoothDeviceInfo[]>([]);
  private availableDevicesSubject = new BehaviorSubject<BluetoothDeviceInfo[]>([]);

  public pairedDevices$ = this.pairedDevicesSubject.asObservable();
  public availableDevices$ = this.availableDevicesSubject.asObservable();
  public device$ = this.deviceSubject.asObservable();
  public isConnected$ = this.connectionStatusSubject.asObservable();
  public isScanning$ = this.scanningSubject.asObservable();
  public error$ = this.errorSubject.asObservable();

  private readonly MAX_RECONNECT_ATTEMPTS = 10;
  private readonly KEEPALIVE_INTERVAL = 2000; // 2 seconds
  private keepaliveInterval: any;
  private reconnectAttempts = 0;

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
        acceptAllDevices: true,
        /* filters: [
          //{ name: 'HC-SR2025' }, // Specific device name
          { namePrefix: 'HC' }, // Common prefix for HC-05/HC-06 modules
          { services: [this.SERVICE_UUID.ARDUINO_UART] }
        ], */
        optionalServices: [
          this.SERVICE_UUID.ARDUINO_UART,
          this.SERVICE_UUID.ARDUINO_UART_ALT
        ]
      });

      /* console.log('Found device:', {
        name: device.name,
        id: device.id,
        gatt: device.gatt
      }); */

      const deviceInfo: BluetoothDeviceInfo = {
        device,
        name: device.name || 'HC-05',
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
      console.error('Scanning error:', error); // Debug info
      if (error instanceof Error && error.name !== 'NotFoundError') {
        this.errorSubject.next(error.message);
      } else {
        this.errorSubject.next('Device selection cancelled');
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
      // Clear any existing keepalive
      if (this.keepaliveInterval) {
        clearInterval(this.keepaliveInterval);
      }
      const server = await this.device.gatt?.connect();
      // console.log('GATT server connected:', server); // Debug info

      if (!server) throw new Error('Failed to connect to GATT server');

      // Try primary service
      let service;
      try {
        service = await server.getPrimaryService(this.SERVICE_UUID.ARDUINO_UART);
        // console.log('Found primary service (UART)');
      } catch (e) {
       // console.log('Trying alternative service...');
        service = await server.getPrimaryService(this.SERVICE_UUID.ARDUINO_UART_ALT);
        // console.log('Found alternative service');
      }

      // List available services for debugging
      const services = await server.getPrimaryServices();
      // console.log('Available services:', services.map(s => s.uuid));

      // Get characteristic
      this.characteristic = await service.getCharacteristic(
        this.CHARACTERISTIC_UUID.ARDUINO_UART
      );
      
      // console.log('Characteristic found:', this.characteristic.uuid);

      this.connectionStatusSubject.next(true);
      this.updateDeviceStatus(true);

      // Start keepalive after successful connection
      this.startKeepAlive();
    } catch (error) {
      console.error('Connection error:', error); // Debug info
      this.errorSubject.next(error instanceof Error ? 
        `Connection failed: ${error.message}` : 
        'Connection failed');
      this.connectionStatusSubject.next(false);
      
      /* // Additional debug info
      if (this.device.gatt) {
        console.log('GATT state:', {
          connected: this.device.gatt.connected,
          device: this.device.name,
          id: this.device.id
        });
      } */
    }
  }

  async disconnect(): Promise<void> {
    if (this.keepaliveInterval) {
      clearInterval(this.keepaliveInterval);
    }

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

    private startKeepAlive(): void {
    this.keepaliveInterval = setInterval(async () => {
      if (this.device?.gatt?.connected) {
        try {
          // Send a small ping to keep connection alive
          await this.sendData('~'); // Using a simple ping command
        } catch (error) {
          console.warn('Keepalive failed, attempting reconnect...');
          this.handleReconnection();
        }
      }
    }, this.KEEPALIVE_INTERVAL);
  }

  private async handleReconnection(): Promise<void> {
    if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
      this.handleDisconnection();
      this.errorSubject.next('Connection lost - max reconnection attempts reached');
      return;
    }

    try {
      this.reconnectAttempts++;
      // console.log(`Reconnection attempt ${this.reconnectAttempts}...`);
      await this.connect();
      this.reconnectAttempts = 0; // Reset on successful connection
    } catch (error) {
      console.error('Reconnection failed:', error);
      setTimeout(() => this.handleReconnection(), 1000); // Wait 1s before next attempt
    }
  }

  async sendData(data: string): Promise<void> {
    if (!this.characteristic || !this.device?.gatt?.connected) {
      throw new Error('Device not connected');
    }

    try {
      const encoder = new TextEncoder();
      // Add command termination character and encode
      const commandWithTerminator = `${data}\n`;
      const dataArray = encoder.encode(commandWithTerminator);
      
      // Send as a single packet
      await this.characteristic.writeValueWithResponse(dataArray);
      
      // console.log(`Sent command: ${data} as packet:`, dataArray);
    } catch (error) {
      this.errorSubject.next(error instanceof Error ? error.message : 'Failed to send data');
      throw error;
    }
  }

  private handleDisconnection(): void {
    if (this.keepaliveInterval) {
      clearInterval(this.keepaliveInterval);
    }
    this.reconnectAttempts = 0;
  
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
        optionalServices: [
        this.SERVICE_UUID.ARDUINO_UART,
        this.SERVICE_UUID.ARDUINO_UART_ALT
      ]
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
