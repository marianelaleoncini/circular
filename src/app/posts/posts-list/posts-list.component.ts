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
  active: boolean = false;

  constructor(private postService: PostService) {}
  @Input() use: 'home' | 'active-post' | 'inactive-post' = 'home';

  ngOnInit(): void {
    switch (this.use) {
      case 'active-post':
      this.postService.getActivePosts().subscribe((posts) => {
        this.postList = posts;
      });
      break;
      case 'inactive-post':
      this.postService.getInactivePosts().subscribe((posts) => {
        this.postList = posts;
      });
      break;
      case 'home':
      this.postService.getHomePosts().subscribe((posts) => {
        this.postList = posts;
        console.log('Posts from home:', this.postList);
      });
      break;
    }
  }
}
