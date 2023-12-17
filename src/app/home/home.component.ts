import { Component } from '@angular/core';
import { getCurrentUser } from 'aws-amplify/auth';
import { PostListComponent } from '../post-list/post-list.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [PostListComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {
  public isLoggedIn: any;

  public accessToken: any;
  public idToken: any;

  async getCurrentUser() {
    this.isLoggedIn = await getCurrentUser();
    console.log(await getCurrentUser());
  }
}


