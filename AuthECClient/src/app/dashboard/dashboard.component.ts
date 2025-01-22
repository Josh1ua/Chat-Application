import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../Services/AuthService';
import { MessageComponent } from '../Message/message.component';

@Component({
  selector: 'app-dashboard',
  templateUrl: `./dashboard.component.html`,
  styleUrls: ['./dashboard.component.css'],
  standalone: true,
  providers: [AuthService],
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MessageComponent,
  ],
})
export class DashboardComponent implements OnInit, OnDestroy {
  isAdmin = false;
  selectedTab = '';
  timeoutWarning = '';
  
  private readonly TIMEOUT_DURATION = 20000;
  private lastActivityTime: number = Date.now();
  private activityCheckInterval: any;
  private readonly MONITORED_EVENTS = [
    'click',
    'mousemove',
    'keypress',
    'scroll',
    'touchstart'
  ];

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.setupActivityMonitoring();
  }

  private setupActivityMonitoring(): void {
    this.MONITORED_EVENTS.forEach(eventName => {
      document.addEventListener(eventName, () => this.resetActivityTimer());
    });
  }

  private resetActivityTimer(): void {
    if (this.isMonitoredTab()) {
      this.lastActivityTime = Date.now();
      this.timeoutWarning = '';
    }
  }

  private checkInactivity(): void {
    const currentTime = Date.now();
    const inactiveTime = currentTime - this.lastActivityTime;

    if (this.isMonitoredTab() && inactiveTime >= this.TIMEOUT_DURATION) {
      this.handleTimeout();
    }
  }

  private isMonitoredTab(): boolean {
    return (
      (this.selectedTab === 'Tab A' && this.isAdmin) ||
      (this.selectedTab === 'Tab F' && !this.isAdmin)
    );
  }

  private handleTimeout(): void {
    this.cleanupTimers();
    this.timeoutWarning = 'Your session has timed out due to inactivity. Please login again.';
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private cleanupTimers(): void {
    if (this.activityCheckInterval) {
      clearInterval(this.activityCheckInterval);
    }
  }

  ngOnInit(): void {
    this.authService.getUserInfo().subscribe(
      (response) => {
        const role = response.userType;
        this.isAdmin = role?.toLowerCase() === 'admin';
      },
      (error) => {
        console.error('Error fetching user info:', error);
        this.router.navigate(['/login']);
      }
    );

    this.resetActivityTimer();
  }

  onTabChange(tab: string): void {
    this.selectedTab = tab;
    this.timeoutWarning = '';
    this.cleanupTimers();
    
    this.resetActivityTimer();

    if (this.isMonitoredTab()) {
      this.activityCheckInterval = setInterval(() => this.checkInactivity(), 1000);
    }
  }

  ngOnDestroy(): void {
    this.MONITORED_EVENTS.forEach(eventName => {
      document.removeEventListener(eventName, () => this.resetActivityTimer());
    });
    
    this.cleanupTimers();
  }
}