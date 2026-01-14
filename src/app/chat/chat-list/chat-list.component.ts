import { Component, EventEmitter, Output, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatService } from '../chat.service';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { Observable, combineLatest, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-chat-list',
  standalone: true,
  imports: [CommonModule, MatListModule, MatDividerModule],
  templateUrl: './chat-list.component.html',
  styleUrls: ['./chat-list.component.scss'],
})
export class ChatListComponent implements OnInit {
  chats$: Observable<any[]> = of([]);

  @Output() chatSelected = new EventEmitter<string>();
  @Input() selectedChatId: string | null = null;

  constructor(private chatService: ChatService) {}

  ngOnInit() {
    this.chats$ = this.chatService.getUserChats().pipe(
      switchMap((chats) => {
        if (!chats || chats.length === 0) return of([]);

        const myId = this.chatService.getUserId();

        const enrichedChats$ = chats.map((chat) => {
          const otherId = chat.participants.find((p: string) => p !== myId);

          return this.chatService.getUserData(otherId).pipe(
            map((userData) => ({
              ...chat,
              displayName: userData.displayName,
              photoURL: userData.photoURL
            }))
          );
        });

        return combineLatest(enrichedChats$);
      })
    );
  }

  selectChat(chatId: string) {
    this.selectedChatId = chatId;
    this.chatSelected.emit(chatId);
  }

  trackByChatId(index: number, chat: any): string {
    return chat.id;
  }
}