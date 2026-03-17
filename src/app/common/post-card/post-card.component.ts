import { ChatService } from './../../chat/chat.service';
import { PostService } from './../../posts/posts.service';
import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { RegisterSaleDialogComponent } from '../../posts/register-sale-dialog/register-sale-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
  ],
  templateUrl: './post-card.component.html',
  styleUrl: './post-card.component.scss',
})
export class PostCardComponent {
  @Input() post: any;
  @Input() use: 'home' | 'active-post' | 'inactive-post' | 'search-results' =
    'home';

  imageLoaded = false;
  averageRating: number = 0;
  totalReviews: number = 0;

  constructor(
    private postService: PostService,
    private chatService: ChatService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit() {
    if (this.post && this.post.userId) {
      this.loadSellerRating(this.post.userId);
    }
  }

  onDelete(postId: string) {
    this.postService.deletePost(postId);
  }

  onToggleActive(postId: string, isActive: boolean) {
    this.postService.toggleActive(postId, !isActive);
  }

  onEdit(postId: string) {
    this.router.navigate(['/posts/' + postId]);
    this.postService.setEditMode(true);
    this.postService.setSelectedTab(0);
  }

  onChat(userId: string) {
    this.chatService.startChatWithUser(userId).subscribe((chatId) => {
      if (chatId) {
        this.router.navigate(['/chat'], { state: { selectedChatId: chatId } });
      }
    });
  }

  onMarkAsSold(post: any) {
    this.chatService.getPotentialBuyers().subscribe((buyers) => {
      const dialogRef = this.dialog.open(RegisterSaleDialogComponent, {
        width: '400px',
        data: {
          originalPrice: post.price,
          potentialBuyers: buyers,
        },
      });

      dialogRef.afterClosed().subscribe((result) => {
        if (result) {
          // Buscamos el objeto completo del comprador usando el ID que eligió
          const selectedBuyer = buyers.find((b) => b.id === result.buyerId);

          // Si eligió "Alguien externo", armamos un objeto genérico
          const buyerData = selectedBuyer || {
            id: 'external',
            name: 'Usuario externo',
            photoURL: null,
          };

          this.postService
            .registerTransaction(post, buyerData, result.finalPrice)
            .then(() => {
              this.snackBar.open('¡Venta registrada con éxito!', 'Cerrar', {
                duration: 3000,
              });
            })
            .catch((error) => {
              console.error('Error al registrar:', error);
              this.snackBar.open('Error al procesar la venta.', 'Cerrar', {
                duration: 3000,
              });
            });
        }
      });
    });
  }

  loadSellerRating(userId: string) {
    this.postService.getUserRatings(userId).subscribe((ratings) => {
      this.totalReviews = ratings.length;
      if (this.totalReviews > 0) {
        const sum = ratings.reduce((acc, curr) => acc + curr.rating, 0);
        this.averageRating = sum / this.totalReviews;
      } else {
        this.averageRating = 0;
      }
    });
  }

  getStarsArray(): number[] {
    return [1, 2, 3, 4, 5];
  }

  onSeeReviews() {
    this.router.navigate(['/perfil-publico', this.post.userId]);
  }
}
