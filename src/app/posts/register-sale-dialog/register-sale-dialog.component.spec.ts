import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisterSaleDialogComponent } from './register-sale-dialog.component';

describe('RegisterSaleDialogComponent', () => {
  let component: RegisterSaleDialogComponent;
  let fixture: ComponentFixture<RegisterSaleDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterSaleDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RegisterSaleDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
