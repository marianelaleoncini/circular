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
import { RouterModule } from '@angular/router';

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
  ) {
    this.provinces$ = this.locationService.getProvinces();
  }

  // --- Variables para Estadísticas ---
  userStats = {
    sales: 0,
    purchases: 0,
    activePosts: 0,
  };
  private subs: Subscription = new Subscription();

  // --- Variables para FAQs ---
  // Acá podés reemplazar estos textos por los que armaron en el documento
  faqs = [
    {
      question: '¿Cómo coordino la entrega de un producto?',
      answer:
        'Una vez que inicies un chat con el vendedor, podrán acordar un punto de encuentro seguro o coordinar el envío.',
    },
    {
      question: '¿Qué pasa si el producto no es lo que esperaba?',
      answer:
        'Circular cuenta con un sistema de calificación. Te recomendamos revisar la reputación del vendedor antes de concretar y calificar tu experiencia al finalizar.',
    },
    {
      question: '¿Tiene algún costo publicar?',
      answer:
        'No, publicar en Circular es totalmente gratuito para fomentar la economía circular y la reutilización de materiales.',
    },
  ];

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
          // 1. Buscamos sus ventas
          this.subs.add(
            this.postService.getUserSales(user.uid).subscribe((sales) => {
              this.userStats.sales = sales.length;
            }),
          );

          // 2. Buscamos sus compras
          this.subs.add(
            this.postService
              .getUserPurchases(user.uid)
              .subscribe((purchases) => {
                this.userStats.purchases = purchases.length;
              }),
          );

          // 3. Buscamos sus publicaciones activas
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

    // NUEVO: Detectamos si el usuario tiene al menos un filtro activo
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
}
