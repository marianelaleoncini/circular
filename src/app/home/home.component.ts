import { Component } from '@angular/core';
import { PostsListComponent } from '../posts/posts-list/posts-list.component';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [PostsListComponent, MatFormField, MatLabel, MatIcon],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  search() {
    console.log('Search function triggered');
  }
}
