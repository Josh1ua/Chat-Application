import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NgIf } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../Services/AuthService'; // Make sure path is correct

interface LoginResponse {
  message: string;
  role: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatToolbarModule,
    NgIf,
    HttpClientModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  form: FormGroup;

  constructor(
    private http: HttpClient, 
    private router: Router,
    private authService: AuthService  // Add AuthService
  ) {
    this.form = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', Validators.required)
    });
  }

  private emailErrorMessage: string = '';

  get email() {
    return this.form.get('email');
  }

  get password() {
    return this.form.get('password');
  }

  get emailError() {
    return this.emailErrorMessage;
  }

  updateErrorMessage() {
    const emailControl = this.email;

    if (emailControl?.hasError('required')) {
      this.emailErrorMessage = 'Email is required.';
    } else if (emailControl?.hasError('email')) {
      this.emailErrorMessage = 'Please enter a valid email address.';
    } else {
      this.emailErrorMessage = '';
    }
  }

  ngOnInit(): void {
    // Redirect to the dashboard if already logged in
    this.authService.isLoggedIn$.subscribe((loggedIn) => {
      if (loggedIn) {
        this.router.navigate(['/dashboard']);
      }
    });
  }
  

  onSubmit() {
    if (this.form.valid) {
      this.http.post<LoginResponse>(
        'http://localhost:5219/api/users/login',
        this.form.value,
        { withCredentials: true }
      ).subscribe({
        next: (response) => {
          console.log('Login successful', response);
          alert(response.message);
          this.authService.setLoggedIn(true);  // Set login state
          this.router.navigate(['/dashboard'], { 
            state: { role: response.role } 
          });
        },
        error: (error) => {
          console.error('Error occurred during login:', error);
          alert(error.error.message || 'Login failed');
        },
      });
    } else {
      console.log("Form is invalid");
      this.updateErrorMessage();
    }
  }
}