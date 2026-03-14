import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-rating-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
  ],
  templateUrl: './rating-dialog.component.html',
  styleUrls: ['./rating-dialog.component.scss'],
})
export class RatingDialogComponent {
  ratingForm: FormGroup;
  stars: number[] = [1, 2, 3, 4, 5];
  currentRating: number = 0;
  hoveredRating: number = 0;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<RatingDialogComponent>,
    // Recibimos el nombre del usuario y a quién estamos calificando
    @Inject(MAT_DIALOG_DATA)
    public data: {
      userName: string;
      targetUserId: string;
      transactionId: string;
    },
  ) {
    this.ratingForm = this.fb.group({
      rating: [0, [Validators.required, Validators.min(1), Validators.max(5)]],
      comment: ['', [Validators.maxLength(300)]],
    });
  }

  setRating(rating: number) {
    this.currentRating = rating;
    this.ratingForm.patchValue({ rating: rating });
  }

  submitRating() {
    if (this.ratingForm.valid && this.currentRating > 0) {
      this.dialogRef.close(this.ratingForm.value);
    }
  }
}
