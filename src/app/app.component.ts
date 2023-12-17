import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { AmplifyAuthenticatorModule } from '@aws-amplify/ui-angular';
import { LoginComponent } from './login/login.component';
import { HomeComponent } from './home/home.component';
import { MatIconModule } from '@angular/material/icon';
import { fetchAuthSession, signOut } from 'aws-amplify/auth';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    AmplifyAuthenticatorModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    LoginComponent,
    HomeComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  public accessToken: any;
  public idToken: any;

  public isLoggedIn: boolean = false;

  constructor() {}

  async getCurrentSession() {
    try {
      const { accessToken, idToken } = (await fetchAuthSession()).tokens ?? {};
      this.accessToken = accessToken;
      this.idToken = idToken;
      console.log({ accessToken, idToken });
    } catch (err) {
      console.log(err);
    }
  }

  async getIsLoggedIn() {
    try {
      const { accessToken } = (await fetchAuthSession()).tokens ?? {};
      if (accessToken) {
        this.isLoggedIn = true;
      }
    } catch (err) {
      console.log(err);
    }
  }

  async handleSignOut() {
    try {
      await signOut();
      this.isLoggedIn = false;
    } catch (err) {
      console.log(err);
    }
  }

  async ngOnInit() {
    await this.getCurrentSession();
    await this.getIsLoggedIn();
    console.log(this.isLoggedIn);
  }
  title = 'angular-amplify-horsemen';
}
