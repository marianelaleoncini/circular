import { PostService } from './../../posts/posts.service';
import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { Router } from '@angular/router';

@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule],
  templateUrl: './post-card.component.html',
  styleUrl: './post-card.component.scss',
})
export class PostCardComponent {
  @Input() post: any;
  @Input() use: 'home' | 'active-post' | 'inactive-post' = 'home';
  imageLoaded = false;

  constructor(private postService: PostService, private router: Router) {}

  onDelete(postId: string) {
    this.postService.deletePost(postId);
  }

  onToggleActive(postId: string, isActive: boolean) {
    this.postService.toggleActive(postId, !isActive);
  }

  onEdit(postId: string) {
    this.router.navigate(['/posts/' + postId]);
    this.postService.setSelectedTab(0);
  }
}
