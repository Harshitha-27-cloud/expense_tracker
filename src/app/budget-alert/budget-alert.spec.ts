import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BudgetAlert } from './budget-alert';

describe('BudgetAlert', () => {
  let component: BudgetAlert;
  let fixture: ComponentFixture<BudgetAlert>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BudgetAlert],
    }).compileComponents();

    fixture = TestBed.createComponent(BudgetAlert);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
