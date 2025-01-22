import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { AuthService } from '../Services/AuthService';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CryptoService } from '../Services/CryptoService';

interface Message {
  sender: string;
  receiver: string;
  message: string;
  timestamp: string;
  sender_role: string;
  MessageType: string;
}

@Component({
  selector: 'app-messages',
  templateUrl: './message.component.html',
  styleUrls: ['./message.component.css'],
  standalone: true,
  providers: [AuthService, CryptoService],
  imports: [
    HttpClientModule,

    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
})
export class MessageComponent implements OnInit, OnDestroy {
  messages: Message[] = [];
  groups = ['Admin', 'User'];
  messageForm: FormGroup;
  currentRole = 'User';
  currentUser = '';
  user = '';
  isAdmin = false;
  isIndividual = false;
  isGroup = false;
  users: { fullName: string; email: string; approved: boolean}[] = []; 

  private readonly getUsersUrl = 'http://localhost:5219/api/Users/get-all-users';
  private readonly getApiUrl = 'http://localhost:5219/api/Messages/getmessage';
  private readonly sendApiUrl =
    'http://localhost:5219/api/Messages/sendmessage';
  private readonly hubUrl = 'http://localhost:5219/messageHub';
  private hubConnection!: HubConnection;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private authService: AuthService,
    private router: Router,
    private cryptoService: CryptoService
  ) {
    this.messageForm = this.fb.group({
      content: ['', [Validators.required, Validators.minLength(1)]],
      recipientType: ['', Validators.required],
      individualEmail: ['', [Validators.required, Validators.email]],
      groupRecipient: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.authService.getUserInfo().subscribe(
      (response) => {
        const role = response.userType;
        this.isAdmin = role?.toLowerCase() === 'admin';
        this.currentRole = this.isAdmin ? 'Admin' : 'User';
        this.currentUser = response.email;
        this.user = response.fullName;

        this.loadMessages();
        this.setupSignalR();
        this.loadUsers();
        console.log(this.users);
        
      },
      (error) => {
        console.error('Error fetching user info:', error);
        this.router.navigate(['/login']);
      }
    );
  }

  loadUsers(): void {
    
    this.http.get<{ fullName: string; email: string; approved: boolean }[]>(
        this.getUsersUrl,
        { withCredentials: true }
    ).subscribe(
        (response) => {
            console.log(response);
            
            this.users = response.filter(user => user.approved === true);
            console.log(this.users);
            
        },
        (error) => {
            console.error('Error fetching users:', error);
        }
    );
}



  selectRecipientEmail(email: string): void {
    this.messageForm.patchValue({
      individualEmail: email,
    });
  }

  onRecipientTypeChange(type: string): void {
    this.isIndividual = type === 'Individual';
    this.isGroup = type === 'Group';

    if (this.isIndividual) {
      this.messageForm
        .get('individualEmail')
        ?.setValidators([Validators.required, Validators.email]);
      this.messageForm.get('groupRecipient')?.clearValidators();
    } else if (this.isGroup) {
      this.messageForm
        .get('groupRecipient')
        ?.setValidators([Validators.required]);
      this.messageForm.get('individualEmail')?.clearValidators();
    }

    this.messageForm.get('individualEmail')?.updateValueAndValidity();
    this.messageForm.get('groupRecipient')?.updateValueAndValidity();
  }

  private setupSignalR(): void {
    this.hubConnection = new HubConnectionBuilder()
      .withUrl(this.hubUrl)
      .withAutomaticReconnect()
      .build();

    this.hubConnection
      .start()
      .then(() => console.log('SignalR connection established'))
      .catch((error) =>
        console.error('Error starting SignalR connection:', error)
      );

    this.hubConnection.on('ReceiveMessage', (message: Message) => {
      if (
        message.receiver === this.currentUser ||
        message.receiver === this.currentRole ||
        message.sender === this.currentUser ||
        (this.groups.includes(message.receiver))
      ) {
        message.message = this.cryptoService.decrypt(message.message);
        this.messages.push(message);
      }
    });

    this.hubConnection.on('UserAdded', (message: any) => {
      this.users.push(message);
      console.log(message);
      
    });

    this.hubConnection.onclose((error) => {
      console.error('SignalR connection closed. Reconnecting...', error);
    });
  }

  loadMessages(): void {
    this.http.get<Message[]>(this.getApiUrl).subscribe(
      (response) => {
        this.messages = response
          .map((message) => {
            message.message = this.cryptoService.decrypt(message.message);
            return message;
          })
          .filter(
            (message) =>
              message.receiver === this.currentUser ||
              message.receiver === this.currentRole ||
              message.sender === this.currentUser
          );
      },
      (error) => {
        console.error('Error fetching messages:', error);
      }
    );
  }
  

  sendMessage(): void {
    console.log(this.messageForm.value.content);
    
    if (this.messageForm.valid) {
      const recipient =
        this.messageForm.value.recipientType === 'Individual'
          ? this.messageForm.value.individualEmail
          : this.messageForm.value.groupRecipient;
      const newMessage: Message = {
        sender: this.currentUser,
        receiver: recipient,
        message: this.cryptoService.encrypt(this.messageForm.value.content),
        timestamp: new Date().toISOString(),
        sender_role: this.currentRole,
        MessageType: this.messageForm.value.recipientType.toLowerCase(),
      };

      this.http.post<Message>(this.sendApiUrl, newMessage).subscribe(
        () => {
          alert('Message sent successfully');
          this.messageForm.reset();
        },
        (error) => {
          console.error('Error sending message:', error);
        }
      );
    }
  }

  ngOnDestroy(): void {
    if (this.hubConnection) {
      this.hubConnection
        .stop()
        .then(() => console.log('SignalR connection stopped'))
        .catch((error) =>
          console.error('Error stopping SignalR connection:', error)
        );
    }
  }
}
