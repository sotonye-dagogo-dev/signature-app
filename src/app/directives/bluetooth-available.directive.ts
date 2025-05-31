import { Directive, ElementRef, Input, OnInit, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appBluetoothAvailable]',
  standalone: true
})
export class BluetoothAvailableDirective implements OnInit {
  @Input() showIfUnavailable = false;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2
  ) { }

  ngOnInit() {
    this.checkBluetoothAvailability();
  }

  private async checkBluetoothAvailability() {
    const isAvailable = await this.isBluetoothAvailable();

    if ((!isAvailable && !this.showIfUnavailable) ||
      (isAvailable && this.showIfUnavailable)) {
      this.renderer.setStyle(this.el.nativeElement, 'display', 'none');
    }
  }

  private async isBluetoothAvailable(): Promise<boolean> {
    try {
      // Check if Web Bluetooth API is available
      if (!navigator.bluetooth) {
        return false;
      }

      // Check if browser supports required Bluetooth features
      if (!navigator.bluetooth.getAvailability) {
        return false;
      }

      return await navigator.bluetooth.getAvailability();
    } catch (error) {
      console.error('Error checking Bluetooth availability:', error);
      return false;
    }
  }
}
