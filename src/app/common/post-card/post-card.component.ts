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

@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatDialogModule],
  templateUrl: './post-card.component.html',
  styleUrl: './post-card.component.scss',
})
export class PostCardComponent {
  @Input() post: any;
  @Input() use: 'home' | 'active-post' | 'inactive-post' | 'search-results' =
    'home';

  imageLoaded = false;

  constructor(
    private postService: PostService,
    private chatService: ChatService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
  ) {}

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
          this.postService
            .registerTransaction(post, result.buyerId, result.finalPrice)
            .then(() => {
              this.snackBar.open('¡Venta registrada con éxito!', 'Cerrar', {
                duration: 3000,
              });
            })
            .catch((error) => {
              console.error('Error al registrar la venta:', error);
              this.snackBar.open(
                'Error al procesar la venta. Intenta nuevamente.',
                'Cerrar',
                { duration: 3000 },
              );
            });
        }
      });
    });
  }
}
