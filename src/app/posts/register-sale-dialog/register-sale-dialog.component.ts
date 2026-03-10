import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-register-sale-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ],
  templateUrl: './register-sale-dialog.component.html',
  styleUrls: ['./register-sale-dialog.component.scss']
})
export class RegisterSaleDialogComponent implements OnInit {
  saleForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<RegisterSaleDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { originalPrice: number, potentialBuyers: any[] }
  ) {
    this.saleForm = this.fb.group({
      buyerId: ['', Validators.required],
      finalPrice: [this.data.originalPrice, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {}

  confirmSale() {
    if (this.saleForm.valid) {
      this.dialogRef.close(this.saleForm.value);
    }
  }
}