import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LocationService } from '../common/services/location.service';
import { PostsListComponent } from '../posts/posts-list/posts-list.component';
import { Observable } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SearchFilterComponent } from './search-filter/search-filter.component';
import { PostService } from '../posts/posts.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    PostsListComponent,
    SearchFilterComponent,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  allPosts: any[] = [];
  provinces$: Observable<any[]>;
  filteredPosts: any[] = [];
  isLoading = true;

  constructor(
    private postService: PostService,
    private locationService: LocationService
  ) {
    this.provinces$ = this.locationService.getProvinces();
  }

  ngOnInit() {
    this.postService.getHomePosts().subscribe({
      next: (posts) => {
        this.allPosts = posts;
        this.filteredPosts = posts;
        this.isLoading = false;
        console.log('Home loaded:', posts.length, 'posts');
      },
      error: (err) => {
        console.error('Error loading posts', err);
        this.isLoading = false;
      },
    });
  }

  onFilterChange(filters: any) {
    if (!this.allPosts.length) return;

    this.filteredPosts = this.allPosts.filter((post) => {
      const searchTerm = filters.search?.toLowerCase() || '';
      const matchesSearch =
        !searchTerm ||
        (post.title && post.title.toLowerCase().includes(searchTerm)) ||
        (post.description &&
          post.description.toLowerCase().includes(searchTerm));

      const matchesProvince =
        !filters.province || post.authorProvince == filters.province;

      const matchesCity = !filters.city || post.authorCity == filters.city;

      const matchesMinPrice =
        filters.minPrice == null || post.price >= filters.minPrice;
      const matchesMaxPrice =
        filters.maxPrice == null || post.price <= filters.maxPrice;

      return (
        matchesSearch &&
        matchesProvince &&
        matchesCity &&
        matchesMinPrice &&
        matchesMaxPrice
      );
    });
  }
}
