import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AsyncPipe, CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { ArduinoService, ArduinoStatus } from '../../services/arduino/arduino.service';
import { BluetoothControlComponent } from '../../components/bluetooth-control/bluetooth-control.component';

interface DeviceConfig {
  baudRate: number;
}

@Component({
  selector: 'app-device-setup',
  templateUrl: './device-setup.component.html',
  styleUrls: ['./device-setup.component.scss'],
  imports: [AsyncPipe, CommonModule, ReactiveFormsModule, BluetoothControlComponent],
  standalone: true
})
export class DeviceSetupComponent {
  arduinoStatus$: Observable<ArduinoStatus>;
  configForm: FormGroup;

  constructor(
    private arduinoService: ArduinoService,
    private fb: FormBuilder
  ) {
    this.arduinoStatus$ = this.arduinoService.status$;
    this.configForm = this.fb.group({
      baudRate: [115200, [Validators.required]],
      });
  }

  async testConnection() {
    try {
      // Send a test command
      await this.arduinoService.sendCommand('M114'); // Get current position
    } catch (error) {
      console.error('Connection test failed:', error);
    }
  }

  async resetDevice() {
    try {
      await this.arduinoService.resetDevice();
    } catch (error) {
      console.error('Device reset failed:', error);
    }
  }

  async saveConfiguration() {
    if (this.configForm.valid) {
      const config: DeviceConfig = this.configForm.value;
      try {
        await this.arduinoService.sendCommand('M500'); // Save to EEPROM
      } catch (error) {
        console.error('Failed to save configuration:', error);
      }
    }
  }
}
