import { TestBed } from '@angular/core/testing';

import { GcodeService } from './gcode.service';

describe('GcodeService', () => {
  let service: GcodeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GcodeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
