import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-report-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, 
    MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule
  ],
  templateUrl: './report-dialog.component.html',
  styleUrls: ['./report-dialog.component.scss']
})
export class ReportDialogComponent {
  reportForm: FormGroup;

  reasons = [
    'Comportamiento abusivo o insultos',
    'Fraude o intento de estafa',
    'Venta de artículos prohibidos',
    'Perfil falso o suplantación de identidad',
    'Otro'
  ];

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ReportDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { userName: string, userId: string }
  ) {
    this.reportForm = this.fb.group({
      reason: ['', Validators.required],
      details: ['', [Validators.required, Validators.maxLength(500)]]
    });
  }

  submitReport() {
    if (this.reportForm.valid) {
      this.dialogRef.close(this.reportForm.value);
    }
  }
}