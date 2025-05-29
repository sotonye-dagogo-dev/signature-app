import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BluetoothControlComponent } from './bluetooth-control.component';

describe('BluetoothControlComponent', () => {
  let component: BluetoothControlComponent;
  let fixture: ComponentFixture<BluetoothControlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BluetoothControlComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BluetoothControlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
