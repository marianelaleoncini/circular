import { PostService } from './../../posts/posts.service';
import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

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

  constructor(private postService: PostService) {}

  onDelete(postId: string) {
    this.postService.deletePost(postId);
  }
}
