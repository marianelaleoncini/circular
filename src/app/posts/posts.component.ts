import { PostService } from './posts.service';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTabsModule } from '@angular/material/tabs';
import { PostComponent } from './post/post.component';
import { PostsListComponent } from './posts-list/posts-list.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-posts',
  standalone: true,
  imports: [
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    PostComponent,
    PostsListComponent,
  ],
  templateUrl: './posts.component.html',
  styleUrl: './posts.component.scss',
})
export class PostsComponent {
  selectedTab = 0;
  shouldResetForm = false;

  constructor(private postService: PostService, private router: Router) {}

  ngOnInit() {
    // Escuchar cambios en el servicio
    this.postService.selectedTab$.subscribe((index) => {
      this.selectedTab = index;
    });
  }

  onTabChange() {
    if (this.selectedTab === 0) {
      this.shouldResetForm = true;
    } else {
      this.postService.setSelectedTab(this.selectedTab);
      this.router.navigate(['/posts'], { replaceUrl: true });
    }
  }

  goBack() {
    this.router.navigate(['/home']);
  }
}
