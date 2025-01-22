import { Component, OnInit } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgFor } from '@angular/common';
import { AuthService } from '../Services/AuthService';
import { Router } from '@angular/router';

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
  isAdmin: boolean = false; 

  constructor(private http: HttpClient, private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.loadRequests();

    this.authService.getUserInfo().subscribe(
      (response) => {
        const role = response.role;
        console.log(role?.toLowerCase() === 'admin');
        this.isAdmin = role?.toLowerCase() === 'admin'; 
      },
      (error) => {
        console.error('Error fetching user info:', error);
        this.router.navigate(['/login']);
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
    const payload = {
      ...request,
      Role: Role,
    };

    this.http.post('http://localhost:5219/api/Request/approve', payload).subscribe(
      () => {
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
