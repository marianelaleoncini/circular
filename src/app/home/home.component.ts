import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LocationService } from '../common/services/location.service';
import { PostsListComponent } from '../posts/posts-list/posts-list.component';
import { Observable, Subscription } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SearchFilterComponent } from './search-filter/search-filter.component';
import { PostService } from '../posts/posts.service';
import { MatExpansionModule } from '@angular/material/expansion';
import { AuthService } from '../auth/auth.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    PostsListComponent,
    SearchFilterComponent,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatExpansionModule,
    RouterModule,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  allPosts: any[] = [];
  provinces$: Observable<any[]>;
  filteredPosts: any[] = [];
  isLoading = true;
  isFiltering = false;

  constructor(
    private postService: PostService,
    private locationService: LocationService,
    private authService: AuthService,
    private router: Router
  ) {
    this.provinces$ = this.locationService.getProvinces();
  }

  userStats = {
    sales: 0,
    purchases: 0,
    activePosts: 0,
  };
  private subs: Subscription = new Subscription();

  ngOnInit() {
    this.loadUserStats();
    this.postService.getHomePosts().subscribe({
      next: (posts) => {
        this.allPosts = posts;
        this.filteredPosts = posts;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
      },
    });
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
  loadUserStats() {
    this.subs.add(
      this.authService.getCurrentUser().subscribe((user) => {
        if (user) {
          this.subs.add(
            this.postService.getUserSales(user.uid).subscribe((sales) => {
              this.userStats.sales = sales.length;
            }),
          );

          this.subs.add(
            this.postService
              .getUserPurchases(user.uid)
              .subscribe((purchases) => {
                this.userStats.purchases = purchases.length;
              }),
          );

          this.subs.add(
            this.postService.getActivePosts().subscribe((posts) => {
              this.userStats.activePosts = posts.length;
            }),
          );
        }
      }),
    );
  }

  onFilterChange(filters: any) {
    if (!this.allPosts.length) return;

    this.isFiltering = !!(
      filters.search ||
      filters.province ||
      filters.city ||
      filters.minPrice != null ||
      filters.maxPrice != null
    );

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

  goToPurchases() {
    this.router.navigate(['/profile'], { queryParams: { tab: 'compras' } });
  }

  goToSales() {
    this.router.navigate(['/profile'], { queryParams: { tab: 'ventas' } });
  }

  goToActivePosts() {
    this.postService.setSelectedTab(1);
    this.router.navigate(['/posts']);
  }
}
