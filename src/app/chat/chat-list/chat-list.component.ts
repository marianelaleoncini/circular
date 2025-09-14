import { Component, EventEmitter, Output, OnInit, input, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatService } from '../chat.service';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { Observable, switchMap, of, map, forkJoin, tap } from 'rxjs';

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
        console.log(chats)
        const enrichedChats$ = chats.map((chat) => {
          const otherId = chat.participants.find(
            (p: string) => p !== this.chatService.getUserId()
          );
          return this.chatService
            .getUserDisplayName(otherId)
            .pipe(map((displayName) => ({ ...chat, displayName })));
        });

        return forkJoin(enrichedChats$);
      })
    );
  }

  selectChat(chatId: string) {
    this.selectedChatId = chatId;
    this.chatSelected.emit(chatId);
  }
}
