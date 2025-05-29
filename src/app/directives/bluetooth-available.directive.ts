import { Directive } from '@angular/core';

@Directive({
  selector: '[appBluetoothAvailable]',
  standalone: true
})
export class BluetoothAvailableDirective {

  constructor() { }

}
