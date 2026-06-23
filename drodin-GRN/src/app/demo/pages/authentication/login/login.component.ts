// angular import
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export default class LoginComponent {
  email: string = '';
  password: string = '';
  isLoginFailed = false;
  errorMessage = '';
  constructor(private router: Router, private authService: AuthService) { }
  onLogin() {
    
    this.authService.login(this.email, this.password).subscribe({
      next: data => {
        
        if (data) {
          localStorage.setItem('logintoken', data.jwtToken);
          localStorage.setItem('loginUserName', data.userName);
          localStorage.setItem('loginType', data.loginType);
          localStorage.setItem('logincompanyName', data.companyName);
          localStorage.setItem('logincompanyId', data.companyId);
          this.router.navigate(['/default']);
        }
      },
      error: err => {
        
         this.errorMessage = err.error.message;
         this.isLoginFailed = true;
      }
    })
  }
}
