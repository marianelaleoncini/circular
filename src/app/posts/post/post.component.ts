import { UtilsService } from './../../common/services/utils.service';
import { Component, Input, SimpleChanges, ViewChild } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormGroupDirective,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { PostService } from '../posts.service';
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
    'Cartón',
    'Electrónica',
    'Madera',
    'Metales',
    'Neumáticos',
    'Papel',
    'Plásticos',
    'Textiles',
    'Vidrio',
    'Otros',
  ];
  imageUrl: string | null = null;
  isLoading = false;
  uploadingImage = false;
  postId: string = '';
  editMode: boolean = false;
  @Input() shouldResetForm = false;
  @ViewChild(FormGroupDirective) formDirective!: FormGroupDirective;

  constructor(
    private fb: FormBuilder,
    private postService: PostService,
    private snackBar: MatSnackBar,
    private route: ActivatedRoute,
    private postsService: PostService,
    private utilsService: UtilsService,
  ) {
    this.postForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(50)]],
      description: ['', [Validators.required, Validators.maxLength(500)]],
      price: ['', [Validators.required, Validators.min(0)]],
      category: ['', Validators.required],
      isActive: [true],
      imageUrl: [null, Validators.required],
    });

    this.route.paramMap.subscribe((params) => {
      this.postId = params.get('id') || '';

      if (this.postId) {
        this.loadPostData();
        this.postService.setEditMode(true);
      }
    });
  }

  ngOnInit() {
    this.postService.editMode$.subscribe((value) => {
      this.editMode = value;
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['shouldResetForm']) {
      this.updateData();
    }
  }

  updateData() {
    this.resetForm();
  }

  resetForm() {
    if (this.formDirective) {
      this.formDirective.resetForm();
    }

    this.postForm.reset({ isActive: true });
    this.imageUrl = null;
  }

  loadPostData() {
    this.postsService.getPost(this.postId).subscribe((post: any) => {
      if (post) {
        this.postForm.patchValue(post); // Rellena los campos con los datos del post
        this.imageUrl = post.imageUrl || null;
      }
    });
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.uploadingImage = true;
      this.utilsService.uploadImage(file).subscribe((url) => {
        this.imageUrl = url;
        this.postForm.patchValue({ imageUrl: url });
        this.uploadingImage = false;
      });
    }
  }

  onSubmit(): void {
    if (this.postForm.invalid) {
      if (!this.postForm.get('imageUrl')?.value) {
        this.snackBar.open(
          'Es obligatorio subir una foto para la publicación.',
          'Entendido',
          { duration: 4000 },
        );
      } else {
        this.snackBar.open(
          'Por favor, completá todos los campos correctamente.',
          'Entendido',
          { duration: 4000 },
        );
      }
      return;
    }

    this.isLoading = true;

    const postData = this.postForm.value;

    if (this.postId) {
      this.postService
        .updatePost(this.postId, postData)
        .then(() => this.onSuccess('Publicación actualizada con éxito'));
    } else {
      this.postService
        .addPost(postData)
        .then(() => this.onSuccess('Publicación creada con éxito'));
    }
  }

  private onSuccess(message: string): void {
    this.isLoading = false;
    this.snackBar.open(message, 'Cerrar', { duration: 4000 });
    if (this.postForm.value.isActive) {
      this.postService.setSelectedTab(1);
    } else {
      this.postService.setSelectedTab(2);
    }
    this.resetForm();
  }
}
