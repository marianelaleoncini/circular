import {
  Component,
  Input,
  Output,
  EventEmitter,
  SimpleChanges,
  ViewChild,
  ElementRef,
  OnDestroy,
} from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ChatService } from '../chat.service';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Observable, Subscription, take } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'app-chat-room',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
  ],
  templateUrl: './chat-room.component.html',
  styleUrls: ['./chat-room.component.scss'],
})
export class ChatRoomComponent implements OnDestroy {
  @Input() chatId: string | null = null;
  @Output() back = new EventEmitter<void>();

  messages$: Observable<any[]> = new Observable();
  newMessage = '';
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  otherUser: any = null;
  lastReadTime: any = null;

  private chatSubscription: Subscription | null = null;

  constructor(
    public chatService: ChatService,
    private location: Location,
  ) {}

  ngOnDestroy() {
    this.unsubscribeChat();
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }
  /* 
  private scrollToBottom(): void {
    try {
      this.messagesContainer.nativeElement.scrollTop =
        this.messagesContainer.nativeElement.scrollHeight;
    } catch (err) {}
  } */

  ngOnChanges(changes: SimpleChanges) {
    if (changes['chatId'] && changes['chatId'].currentValue) {
      this.loadMessages();
    }
  }

  private unsubscribeChat() {
    if (this.chatSubscription) {
      this.chatSubscription.unsubscribe();
      this.chatSubscription = null;
    }
  }

  private loadMessages() {
    if (this.chatId) {
      this.unsubscribeChat();

      this.chatSubscription = this.chatService
        .getChatById(this.chatId)
        .subscribe((chat) => {
          if (!chat) return;

          const myId = this.chatService.getUserId();
          if (!myId) return;

          const otherId = chat.participants.find((p: any) => p !== myId);

          this.lastReadTime = chat.lastReadTimestamp?.[myId];

          if (otherId && (!this.otherUser || this.otherUser.uid !== otherId)) {
            this.chatService.getUserData(otherId).subscribe((u) => {
              this.otherUser = { ...u, uid: otherId };
            });
          }

          if (chat.unreadCounts?.[myId] > 0) {
            this.chatService.markChatAsRead(this.chatId!);
          }
        });

      this.messages$ = this.chatService.getMessages(this.chatId);
    }
  }

  send() {
    if (this.newMessage.trim() && this.chatId) {
      this.chatService
        .sendMessage(this.chatId, this.newMessage)
        .then(() => {
          this.newMessage = '';
        })
        .catch((err) => console.error('Error enviando:', err));
    }
  }

  shouldShowNewMessageDivider(msgIndex: number, messages: any[]): boolean {
    if (!messages || messages.length === 0) return false;
    if (!this.lastReadTime) return false;

    const msg = messages[msgIndex];
    if (!msg) return false;
    const prevMsg = messages[msgIndex - 1];

    const currentUserId = this.chatService.getUserId();
    if (!currentUserId) return false;

    if (msg.senderId === currentUserId) return false;

    const msgDate = msg.timestamp?.toDate();
    const lastReadDate = this.lastReadTime?.toDate();

    if (!msgDate || !lastReadDate) return false;

    const isNew = msgDate > lastReadDate;
    const prevIsOld =
      !prevMsg ||
      !prevMsg.timestamp ||
      prevMsg.timestamp.toDate() <= lastReadDate;

    return isNew && prevIsOld;
  }

  goBack() {
    this.back.emit();
  }

  onInputFocus() {
    this.scrollToBottom();

    setTimeout(() => this.scrollToBottom(), 100);

    setTimeout(() => this.scrollToBottom(), 300);
  }

  private scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop =
          this.messagesContainer.nativeElement.scrollHeight;
      }
    } catch (err) {
      console.error('Error al scrollear:', err);
    }
  }
}
