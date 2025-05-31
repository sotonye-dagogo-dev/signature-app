import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { BluetoothService } from '../bluetooth/bluetooth.service';

export interface ArduinoStatus {
  isReady: boolean;
  currentOperation: string | null;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class ArduinoService {
  private statusSubject = new BehaviorSubject<ArduinoStatus>({
    isReady: false,
    currentOperation: null,
    error: null
  });

  public status$ = this.statusSubject.asObservable();

  constructor(private bluetoothService: BluetoothService) {
    this.initializeStatusMonitoring();
  }

  private initializeStatusMonitoring(): void {
    this.bluetoothService.isConnected$.subscribe((connected: boolean) => {
      this.updateStatus({
        isReady: connected,
        currentOperation: connected ? 'idle' : null,
        error: null
      });
    });
  }

  private updateStatus(status: Partial<ArduinoStatus>): void {
    this.statusSubject.next({
      ...this.statusSubject.value,
      ...status
    });
  }

  async validateGCode(gcode: string): Promise<boolean> {
    // Basic G-code validation
    const lines = gcode.split('\n');
    const validCommands = ['G0', 'G1', 'G2', 'G3', 'M0', 'M1', 'M2', 'M3'];

    try {
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed === '' || trimmed.startsWith(';')) continue;

        const command = trimmed.split(' ')[0];
        if (!validCommands.some(valid => command.startsWith(valid))) {
          throw new Error(`Invalid G-code command: ${command}`);
        }
      }
      return true;
    } catch (error) {
      this.updateStatus({
        error: error instanceof Error ? error.message : 'Invalid G-code'
      });
      return false;
    }
  }

  async sendCommand(command: string): Promise<void> {
    try {
      this.updateStatus({ currentOperation: 'sending' });

      // Format command for Arduino
      const formattedCommand = this.formatArduinoCommand(command);

      // Send via Bluetooth
      await this.bluetoothService.sendData(formattedCommand);

      this.updateStatus({
        currentOperation: 'idle',
        error: null
      });
    } catch (error) {
      this.updateStatus({
        currentOperation: 'error',
        error: error instanceof Error ? error.message : 'Command failed'
      });
      throw error;
    }
  }

  async executeGCode(gcode: string): Promise<void> {
    if (!await this.validateGCode(gcode)) {
      throw new Error('Invalid G-code');
    }

    try {
      this.updateStatus({ currentOperation: 'executing' });

      const lines = gcode.split('\n').filter(line =>
        line.trim() !== '' && !line.trim().startsWith(';')
      );

      for (const line of lines) {
        await this.sendCommand(line.trim());
        // Add delay between commands to prevent buffer overflow
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      this.updateStatus({
        currentOperation: 'completed',
        error: null
      });
    } catch (error) {
      this.updateStatus({
        currentOperation: 'error',
        error: error instanceof Error ? error.message : 'G-code execution failed'
      });
      throw error;
    }
  }

  private formatArduinoCommand(command: string): string {
    // Add command terminator and format for Arduino
    return `${command}\n`;
  }

  async resetDevice(): Promise<void> {
    try {
      await this.sendCommand('M0'); // Stop all operations
      await this.sendCommand('G28'); // Home all axes

      this.updateStatus({
        currentOperation: 'idle',
        error: null
      });
    } catch (error) {
      this.updateStatus({
        currentOperation: 'error',
        error: error instanceof Error ? error.message : 'Reset failed'
      });
      throw error;
    }
  }
}
