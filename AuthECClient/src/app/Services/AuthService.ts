import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private _isLoggedIn = new BehaviorSubject<boolean>(false);
  isLoggedIn$ = this._isLoggedIn.asObservable();

  constructor(private http: HttpClient) {
    // Check initial login status
    this.getUserInfo().subscribe({
      next: () => this._isLoggedIn.next(true),
      error: () => this._isLoggedIn.next(false),
    });
  }

  // Fetch user info (email and role) from the API
  getUserInfo(): Observable<any> {
    return this.http.get('http://localhost:5219/api/users/user-info', {
      withCredentials: true,
    });
  }

  // Set login status
  setLoggedIn(value: boolean) {
    this._isLoggedIn.next(value);
  }

  // Get current login status
  get isLoggedIn(): boolean {
    return this._isLoggedIn.value;
  }

  // Logout by deleting the token from cookies
  logout(): void {
    localStorage.clear();
    sessionStorage.clear();
    // Clear browser history
    history.pushState(null, '', window.location.href);
    this.http
      .post(
        'http://localhost:5219/api/users/logout',
        {},
        {
          withCredentials: true,
        }
      )
      .subscribe(() => {
        this._isLoggedIn.next(false);
        location.reload(); // Redirect to login page
      });
  }
}
