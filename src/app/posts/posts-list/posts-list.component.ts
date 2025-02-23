import { Component, Input } from '@angular/core';
import { PostService } from '../posts.service';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { PostCardComponent } from '../../common/post-card/post-card.component';

@Component({
  selector: 'app-posts-list',
  standalone: true,
  imports: [CommonModule, MatCardModule, PostCardComponent],
  templateUrl: './posts-list.component.html',
  styleUrl: './posts-list.component.scss',
})
export class PostsListComponent {
  postList: any[] = [];

  constructor(private postService: PostService) {}
  @Input() active = true;

  ngOnInit(): void {
    if (this.active) {
      this.postService.getActivePosts().subscribe((posts) => {
        this.postList = posts;
      });
    } else {
      this.postService.getInactivePosts().subscribe((posts) => {
        this.postList = posts;
      });
    }
  }
}
