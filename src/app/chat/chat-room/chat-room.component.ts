import {
  Component,
  Input,
  OnInit,
  Output,
  EventEmitter,
  SimpleChanges,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ChatService } from '../chat.service';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Observable } from 'rxjs';
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
export class ChatRoomComponent {
  @Input() chatId: string | null = null;
  @Output() back = new EventEmitter<void>();
  messages$: Observable<any[]> = new Observable();
  newMessage = '';
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  constructor(public chatService: ChatService, private location: Location) {}


  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    try {
      this.messagesContainer.nativeElement.scrollTop =
        this.messagesContainer.nativeElement.scrollHeight;
    } catch (err) {
      console.error('Error al scrollear:', err);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    console.log(changes);
    if (changes['chatId'] && changes['chatId'].currentValue) {
      this.loadMessages();
    }
  }

  private loadMessages() {
    if (this.chatId) {
      console.log(this.chatId);
      this.messages$ = this.chatService.getMessages(this.chatId);
    }
  }

  send() {
    console.log(this.chatId);
    if (this.newMessage.trim() && this.chatId) {
      this.chatService.sendMessage(this.chatId, this.newMessage).subscribe();
      this.newMessage = '';
    }
  }

  goBack() {
    this.back.emit();
  }
}
