import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Prevention } from './prevention';

describe('Prevention', () => {
  let component: Prevention;
  let fixture: ComponentFixture<Prevention>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Prevention]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Prevention);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
