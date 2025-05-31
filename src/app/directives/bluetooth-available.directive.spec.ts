import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { BluetoothAvailableDirective } from './bluetooth-available.directive';

@Component({
  template: `
    <div appBluetoothAvailable>Show if available</div>
    <div appBluetoothAvailable [showIfUnavailable]="true">Show if unavailable</div>
  `
})
class TestComponent { }

describe('BluetoothAvailableDirective', () => {
  let component: TestComponent;
  let fixture: ComponentFixture<TestComponent>;
  let bluetoothElements: DebugElement[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TestComponent],
      imports: [BluetoothAvailableDirective]
    }).compileComponents();

    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    bluetoothElements = fixture.debugElement.queryAll(By.directive(BluetoothAvailableDirective));
  });

  it('should create an instance', () => {
    const directive = bluetoothElements[0].injector.get(BluetoothAvailableDirective);
    expect(directive).toBeTruthy();
  });

  it('should handle browser without Bluetooth API', () => {
    // Mock browser without Bluetooth
    (window.navigator as any).bluetooth = undefined;

    fixture.detectChanges();

    const availableElement = bluetoothElements[0].nativeElement;
    const unavailableElement = bluetoothElements[1].nativeElement;

    expect(availableElement.style.display).toBe('none');
    expect(unavailableElement.style.display).not.toBe('none');
  });

  it('should handle browser with Bluetooth API', async () => {
    // Mock browser with Bluetooth
    (window.navigator as any).bluetooth = {
      getAvailability: () => Promise.resolve(true)
    };

    fixture.detectChanges();
    await fixture.whenStable();

    const availableElement = bluetoothElements[0].nativeElement;
    const unavailableElement = bluetoothElements[1].nativeElement;

    expect(availableElement.style.display).not.toBe('none');
    expect(unavailableElement.style.display).toBe('none');
  });

  it('should handle Bluetooth API availability check failure', async () => {
    // Mock Bluetooth API that throws an error
    (window.navigator as any).bluetooth = {
      getAvailability: () => Promise.reject(new Error('Not supported'))
    };

    fixture.detectChanges();
    await fixture.whenStable();

    const availableElement = bluetoothElements[0].nativeElement;
    const unavailableElement = bluetoothElements[1].nativeElement;

    expect(availableElement.style.display).toBe('none');
    expect(unavailableElement.style.display).not.toBe('none');
  });
});
