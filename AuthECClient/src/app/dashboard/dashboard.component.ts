import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../Services/AuthService';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';

interface Message {
  sender: string;
  receiver: string;
  messageText: string;
  timestamp: string;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  standalone: true,
  providers: [AuthService],
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    HttpClientModule,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatButtonModule,
    MatCardModule,
    MatInputModule,
    MatSelectModule,
  ],
})
export class DashboardComponent implements OnInit, OnDestroy {
  isAdmin = false;
  currentRole = 'User';
  messages: Message[] = [];
  groups = ['Admin', 'User'];
  messageForm: FormGroup;
  selectedTab = '';
  timeoutWarning = '';
  timeoutId: any;
  
  // Timeout related properties
  private readonly TIMEOUT_DURATION = 20000; // 20 seconds
  private lastActivityTime: number = Date.now();
  private activityCheckInterval: any;
  private readonly MONITORED_EVENTS = [
    'click',
    'mousemove',
    'keypress',
    'scroll',
    'touchstart'
  ];

  private readonly getApiUrl = 'http://localhost:5219/api/Messages/getmessage';
  private readonly sendApiUrl = 'http://localhost:5219/api/Messages/sendmessage';
  private readonly hubUrl = 'http://localhost:5219/messageHub';

  private hubConnection!: HubConnection;

  constructor(
    private authService: AuthService,
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {
    this.messageForm = this.fb.group({
      content: ['', [Validators.required, Validators.minLength(1)]],
      receiver: ['', Validators.required],
    });
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
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }

  ngOnInit(): void {
    // Fetch user role
    this.authService.getUserInfo().subscribe(
      (response) => {
        const role = response.role;
        this.isAdmin = role?.toLowerCase() === 'admin';
        this.currentRole = this.isAdmin ? 'Admin' : 'User';
      },
      (error) => {
        console.error('Error fetching user info:', error);
        this.router.navigate(['/login']);
      }
    );

    // Fetch messages
    this.loadMessages();

    // Initialize SignalR connection
    this.hubConnection = new HubConnectionBuilder()
      .withUrl(this.hubUrl)
      .build();

    this.hubConnection
      .start()
      .then(() => console.log('SignalR connection started'))
      .catch((error) => console.error('Error starting SignalR connection:', error));

    this.hubConnection.on('ReceiveMessage', (message: Message) => {
      this.messages.push(message);
    });

    // Initialize activity monitoring
    this.resetActivityTimer();
  }

  loadMessages(): void {
    this.http.get<Message[]>(this.getApiUrl).subscribe(
      (response) => {
        this.messages = response;
      },
      (error) => {
        console.error('Error fetching messages:', error);
      }
    );
  }

  sendMessage(): void {
    if (this.messageForm.valid) {
      const newMessage: Message = {
        sender: this.currentRole,
        receiver: this.messageForm.value.receiver,
        messageText: this.messageForm.value.content,
        timestamp: new Date().toISOString(),
      };

      this.http.post<Message>(this.sendApiUrl, newMessage).subscribe(
        (response) => {
          alert('Message sent successfully');
          this.messageForm.reset();
        },
        (error) => {
          console.error('Error sending message:', error);
        }
      );
    }
  }

  onTabChange(tab: string): void {
    this.selectedTab = tab;
    this.timeoutWarning = '';
    this.cleanupTimers();
    
    // Reset activity timer when changing tabs
    this.resetActivityTimer();

    // Only start monitoring on specific tabs
    if (this.isMonitoredTab()) {
      // Check for inactivity every second
      this.activityCheckInterval = setInterval(() => this.checkInactivity(), 1000);
    }
  }

  ngOnDestroy(): void {
    // Clean up all event listeners
    this.MONITORED_EVENTS.forEach(eventName => {
      document.removeEventListener(eventName, () => this.resetActivityTimer());
    });
    
    // Clear all timers
    this.cleanupTimers();
    
    // Stop SignalR connection
    if (this.hubConnection) {
      this.hubConnection.stop().catch((error) => 
        console.error('Error stopping SignalR connection:', error)
      );
    }
  }
}