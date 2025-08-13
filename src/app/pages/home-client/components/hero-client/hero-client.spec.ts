import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeroClient } from './hero-client';

describe('HeroClient', () => {
  let component: HeroClient;
  let fixture: ComponentFixture<HeroClient>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeroClient]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HeroClient);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
