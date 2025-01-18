import { Component, OnInit } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgFor } from '@angular/common';
import { AuthService } from '../Services/AuthService'; // Ensure AuthService is correctly imported
import { Router } from '@angular/router'; // Make sure to import Router

interface Request {
  _id: string;
  _rev: string;
  fullName: string;
  email: string;
  userType: string;
  reason: string;
  Role?: string;
}

@Component({
  selector: 'app-requests',
  templateUrl: './request.component.html',
  // styleUrls: ['./requests.component.css'] // Uncomment if you have a stylesheet
  imports: [
    MatCardModule,
    MatButtonModule,
    MatToolbarModule,
    MatProgressSpinnerModule,
    NgFor,
    HttpClientModule,
  ],
})
export class RequestsComponent implements OnInit {
  requests: Request[] = [];
  isAdmin: boolean = false; // Define the `isAdmin` variable to store role info

  constructor(private http: HttpClient, private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    // Load requests when the component initializes
    this.loadRequests();

    // Fetch the user's role from the API when the component loads
    this.authService.getUserInfo().subscribe(
      (response) => {
        const role = response.role;
        console.log(role?.toLowerCase() === 'admin');
        this.isAdmin = role?.toLowerCase() === 'admin';  // Set role based on API response
      },
      (error) => {
        console.error('Error fetching user info:', error);
        this.router.navigate(['/login']); // Redirect to login if there's an error
      }
    );
  }

  loadRequests(): void {
    this.http
      .get<Request[]>('http://localhost:5219/api/Request/pending')
      .subscribe((data) => {
        this.requests = data;
        console.log('Requests loaded:', this.requests);
      });
  }

  approveRequest(request: Request, Role: string): void {
    // Add the Role to the request object
    const payload = {
      ...request,
      Role: Role, // Ensure Role is part of the payload explicitly
    };

    // Send the flattened payload directly
    this.http.post('http://localhost:5219/api/Request/approve', payload).subscribe(
      () => {
        // Reload requests after approval
        this.loadRequests();
        window.alert(`Request approved successfully.`);
      },
      (error) => {
        console.error('Error approving request:', error);
      }
    );
  }

  rejectRequest(_id: string, _rev: string): void {
    this.http
      .post('http://localhost:5219/api/Request/reject', {
        Id: _id,
        Rev: _rev,
      })
      .subscribe(
        () => {
          alert('Rejected Request Successfully!!');
          this.loadRequests();
        },
        (error) => {
          console.error('Error rejecting request:', error);
        }
      );
  }
}
