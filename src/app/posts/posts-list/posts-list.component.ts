import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { PostService } from '../posts.service';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { PostCardComponent } from '../../common/post-card/post-card.component';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-posts-list',
  standalone: true,
  imports: [CommonModule, MatCardModule, PostCardComponent, MatIconModule],
  templateUrl: './posts-list.component.html',
  styleUrl: './posts-list.component.scss',
})
export class PostsListComponent implements OnInit, OnChanges {
  postList: any[] = [];
  @Input() externalPosts: any[] | null = null;
  @Input() use: 'home' | 'active-post' | 'inactive-post' | 'search-results' =
    'home';

  constructor(private postService: PostService) {}

  ngOnInit(): void {
    this.loadPosts();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['externalPosts'] && this.use === 'search-results') {
      if (this.externalPosts) {
        this.postList = this.externalPosts;
      }
    }
  }

  loadPosts() {
    if (this.use === 'search-results' && this.externalPosts) {
      this.postList = this.externalPosts;
      return;
    }

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
        });
        break;
    }
  }
}
