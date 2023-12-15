import { Component } from '@angular/core';
import { getCurrentUser } from 'aws-amplify/auth';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [],
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
