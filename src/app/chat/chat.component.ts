import { Component } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ChatListComponent } from './chat-list/chat-list.component';
import { ChatRoomComponent } from './chat-room/chat-room.component';
import { MatCardModule } from '@angular/material/card';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    ChatListComponent,
    ChatRoomComponent,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
})
export class ChatComponent {
  selectedChatId: string | null = null;
  isMobile = false;

  constructor(
    breakpointObserver: BreakpointObserver,
    private router: Router,
    private location: Location
  ) {
    breakpointObserver
      .observe([Breakpoints.Handset])
      .subscribe((result) => (this.isMobile = result.matches));
  }

  ngOnInit() {
    const state = this.location.getState() as { selectedChatId?: string };
    if (state?.selectedChatId) {
      this.selectedChatId = state.selectedChatId;
      // this.loadMessages();

      // ✅ Limpiar el state para que no quede persistente
      history.replaceState({}, '', this.location.path());
    }
  }

  selectChat(chatId: string) {
    this.selectedChatId = chatId;
  }

  clearSelection() {
    this.selectedChatId = null;
  }

  showChatList(): boolean {
    return !this.isMobile || !this.selectedChatId;
  }

  showChatRoom(): boolean {
    return !this.isMobile || !!this.selectedChatId;
  }

  showToolbar(): boolean {
    return !this.isMobile || !this.selectedChatId;
  }

  goBack() {
    this.router.navigate(['/home']);
  }
}
