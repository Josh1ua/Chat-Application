import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSelectModule } from '@angular/material/select';
import { NgIf } from '@angular/common';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../Services/AuthService';

@Component({
  selector: 'app-registration',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatToolbarModule,
    NgIf,
    HttpClientModule,
  ],
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.css'],
})
export class RegistrationComponent implements OnInit {
  form: FormGroup;

  private emailErrorMessage: string = '';
  public passwordMatchErrorMessage: string = '';

  constructor(private http: HttpClient, private router: Router, private authService: AuthService) {
    this.form = new FormGroup(
      {
        fullName: new FormControl('', Validators.required),
        email: new FormControl('', [Validators.required, Validators.email]),
        password: new FormControl('', Validators.required),
        confirmPassword: new FormControl('', Validators.required),
        userType: new FormControl('', Validators.required),
      },
      {
        validators: RegistrationComponent.passwordMatchValidator,
      }
    );
  }

  ngOnInit(): void {
    this.authService.isLoggedIn$.subscribe((loggedIn) => {
      if (loggedIn) {
        this.router.navigate(['/dashboard']);
      }
    });
  }

  get fullName() {
    return this.form.get('fullName');
  }

  get email() {
    return this.form.get('email');
  }

  get password() {
    return this.form.get('password');
  }

  get confirmPassword() {
    return this.form.get('confirmPassword');
  }

  get userType() {
    return this.form.get('userType');
  }

  static passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const form = control as FormGroup;
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;

    if (password && confirmPassword && password !== confirmPassword) {
      return { mismatch: true };
    }
    return null;
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
    
    if (this.form.errors?.['mismatch']) {
      this.passwordMatchErrorMessage = 'Passwords do not match.';
    } else {
      this.passwordMatchErrorMessage = '';
    }
  }

  errorMessage() {
    return this.emailErrorMessage;
  }

  onSubmit() {
    if (this.form.valid) {
      this.http
        .post('http://localhost:5219/api/users/register', this.form.value)
        .subscribe({
          next: (response) => {
            console.log('Registration successful', response);
            alert('Registration successful');
            this.router.navigate(['/login']);
          },
          error: (error) => {
            console.error('Error occurred during registration:', error);
            alert(error.error.message || 'An error occurred. Please try again.');
          },
        });
    } else {
      console.log('Form is invalid');
      this.updateErrorMessage();
    }
  }
}
