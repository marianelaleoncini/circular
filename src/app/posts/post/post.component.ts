import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { PostService } from '../posts.service';
import { AuthService } from '../../auth/auth.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-post',
  templateUrl: './post.component.html',
  styleUrls: ['./post.component.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
})
export class PostComponent {
  postForm: FormGroup;
  categories = [
    'Plásticos',
    'Metales',
    'Textiles',
    'Electrónica',
    'Papel',
    'Vidrio',
    'Otros',
  ];
  imageUrl: string | null = null;
  isLoading = false;
  uploadingImage = false;

  constructor(
    private fb: FormBuilder,
    private postService: PostService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    this.postForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(50)]],
      description: ['', [Validators.required, Validators.maxLength(500)]],
      price: ['', [Validators.required, Validators.min(0)]],
      category: ['', Validators.required],
      isActive: [true],
    });
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.uploadingImage = true;
      this.postService.uploadImage(file).subscribe((url) => {
        this.imageUrl = url;
        this.uploadingImage = false;
      });
    }
  }

  onSubmit(): void {
    if (this.postForm.valid && this.imageUrl) {
      const userId = this.authService.currentUser.uid; // Obtén el ID del usuario autenticado
      const post = {
        ...this.postForm.value,
        imageUrl: this.imageUrl,
        userId,
      };
      this.isLoading = true;
      this.postService.addPost(post).then(() => {
        this.isLoading = false;
        this.snackBar.open('Publicación guardada con éxito', 'Cerrar', {
          duration: 4000,
        });
        this.router.navigate(['/home']); // Redirigir a la página principal
      });
    } else {
      this.isLoading = false;
    }
  }
}
