import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SummaryClient } from './summary-client';

describe('SummaryClient', () => {
  let component: SummaryClient;
  let fixture: ComponentFixture<SummaryClient>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SummaryClient]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SummaryClient);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
