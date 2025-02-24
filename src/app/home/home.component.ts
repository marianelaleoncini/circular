import { Component } from '@angular/core';
import { PostsListComponent } from '../posts/posts-list/posts-list.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [PostsListComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {}
