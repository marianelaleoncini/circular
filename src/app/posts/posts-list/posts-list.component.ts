import { 
  Component, Input, OnInit, OnChanges, SimpleChanges, 
  ViewChild, ElementRef, AfterViewInit, OnDestroy 
} from '@angular/core';
import { PostService } from '../posts.service';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { PostCardComponent } from '../../common/post-card/post-card.component';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-posts-list',
  standalone: true,
  imports: [CommonModule, MatCardModule, PostCardComponent, MatIconModule, MatProgressSpinnerModule], 
  templateUrl: './posts-list.component.html',
  styleUrl: './posts-list.component.scss',
})
export class PostsListComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  postList: any[] = [];
  @Input() externalPosts: any[] = [];
  @Input() use: 'active-post' | 'inactive-post' | 'search-results' = 'search-results';

  // --- Variables de Paginación ---
  lastVisibleDoc: any = null; // Para Firebase
  localPage: number = 1;      // NUEVO: Para paginar la búsqueda local
  hasMore: boolean = true;
  isLoading: boolean = false;
  batchSize: number = 5; 

  @ViewChild('scrollSentinel') scrollSentinel!: ElementRef;
  private observer!: IntersectionObserver;

  constructor(private postService: PostService) {}

  ngOnInit(): void {
    if (this.use !== 'search-results') {
      this.loadPosts();
    } else if (!this.externalPosts || this.externalPosts.length === 0) {
      // Si estamos en search-results pero no hay búsqueda activa, cargamos desde Firebase
      this.loadMore();
    }
  }

  ngAfterViewInit(): void {
    if (this.use === 'search-results') {
      this.setupIntersectionObserver();
    }
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['externalPosts'] && this.use === 'search-results') {
      // Cuando nos llega una búsqueda nueva, reseteamos todo y cargamos el primer lote
      this.localPage = 1;
      this.postList = [];
      this.lastVisibleDoc = null; 
      this.hasMore = true;
      this.loadMore(); 
    }
  }

  loadPosts() {
    switch (this.use) {
      case 'active-post':
        this.postService.getActivePosts().subscribe((posts) => { this.postList = posts; });
        break;
      case 'inactive-post':
        this.postService.getInactivePosts().subscribe((posts) => { this.postList = posts; });
        break;
    }
  }

  setupIntersectionObserver() {
    const options = {
      root: null,
      rootMargin: '100px',
      threshold: 0
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && this.hasMore && !this.isLoading) {
          this.loadMore(); // Llama a nuestra función unificada
        }
      });
    }, options);

    if (this.scrollSentinel) {
      this.observer.observe(this.scrollSentinel.nativeElement);
    }
  }

  // --- FUNCIÓN UNIFICADA DE CARGA ---
  loadMore() {
    if (this.isLoading) return;
    this.isLoading = true;

    // CASO A: Paginación LOCAL (El usuario está viendo resultados de búsqueda)
    if (this.externalPosts && this.externalPosts.length > 0) {
      // Simulamos un pequeño delay de 400ms para que se vea el spinner (UX)
      setTimeout(() => {
        const limit = this.localPage * this.batchSize;
        this.postList = this.externalPosts.slice(0, limit); // Cortamos de a 5
        
        this.hasMore = this.externalPosts.length > this.postList.length;
        this.localPage++;
        this.isLoading = false;
      }, 400); 
    } 
    // CASO B: Paginación FIREBASE (El usuario no buscó nada, mostramos el feed general)
    else {
      this.postService.getHomePostsPaginated(this.batchSize, this.lastVisibleDoc).subscribe((result) => {
        this.postList = [...this.postList, ...result.posts];
        this.lastVisibleDoc = result.lastDoc;
        this.hasMore = result.hasMore;
        this.isLoading = false;
      });
    }
  }
}