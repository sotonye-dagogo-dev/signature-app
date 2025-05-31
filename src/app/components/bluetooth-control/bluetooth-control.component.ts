import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BluetoothService, BluetoothDeviceInfo } from '../../services/bluetooth/bluetooth.service';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faSpinner, faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-bluetooth-control',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './bluetooth-control.component.html',
  styleUrls: ['./bluetooth-control.component.scss']
})
export class BluetoothControlComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Observables
  connectedDevice$: Observable<BluetoothDeviceInfo | null>;
  pairedDevices$: Observable<BluetoothDeviceInfo[]>;
  availableDevices$: Observable<BluetoothDeviceInfo[]>;
  isScanning$: Observable<boolean>;
  error$: Observable<string | null>;

  // Icons
  faSpinner = faSpinner;
  faCheck = faCheck;
  faTimes = faTimes;

  // SVG path for Bluetooth icon
  bluetoothIconPath = `M12 0c-0.5 0-1 0.4-1 1v6.1L7.1 3.7C6.8 3.4 6.4 3.4 6.1 3.7c-0.3 0.3-0.3 0.7 0 1l4.9 4.3-4.9 4.3c-0.3 0.3-0.3 0.7 0 1 0.3 0.3 0.7 0.3 1 0L11 11v6.1c0 0.5 0.4 1 1 1s1-0.4 1-1V1c0-0.5-0.4-1-1-1z`;

  constructor(
    private bluetoothService: BluetoothService
  ) {
    this.connectedDevice$ = this.bluetoothService.device$;
    this.pairedDevices$ = this.bluetoothService.pairedDevices$;
    this.availableDevices$ = this.bluetoothService.availableDevices$;
    this.isScanning$ = this.bluetoothService.isScanning$;
    this.error$ = this.bluetoothService.error$;
  }

  ngOnInit(): void {
    // Get initial list of paired devices
    this.bluetoothService.getPairedDevices().catch(error => {
      console.error('Failed to get paired devices:', error);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async startScanning(): Promise<void> {
    try {
      await this.bluetoothService.startScanning();
    } catch (error) {
      console.error('Scanning failed:', error);
    }
  }

  async connect(device: BluetoothDeviceInfo): Promise<void> {
    try {
      await this.bluetoothService.connect();
    } catch (error) {
      console.error('Connection failed:', error);
    }
  }

  async disconnect(device: BluetoothDeviceInfo): Promise<void> {
    try {
      await this.bluetoothService.disconnect();
    } catch (error) {
      console.error('Disconnection failed:', error);
    }
  }

  async pair(device: BluetoothDeviceInfo): Promise<void> {
    try {
      await this.bluetoothService.pair(device);
    } catch (error) {
      console.error('Pairing failed:', error);
    }
  }
}