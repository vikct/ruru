import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { TuiButton, TuiTextfield, TuiLabel } from '@taiga-ui/core';

interface InviteDetails {
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  totpSecret: string;
  qrCodeUri: string;
}

@Component({
  selector: 'app-totp-setup',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TuiButton,
    TuiTextfield,
    TuiLabel
  ],
  templateUrl: './totp-setup.component.html',
  styleUrl: './totp-setup.component.scss'
})
export class TotpSetupComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);

  readonly inviteDetails = signal<InviteDetails | null>(null);
  readonly qrImageUrl = signal<string>('');
  readonly code = signal<string>('');
  readonly error = signal<string>('');
  readonly successMsg = signal<string>('');
  readonly loading = signal<boolean>(false);
  readonly verifying = signal<boolean>(false);

  private token: string = '';

  ngOnInit() {
    this.token = this.route.snapshot.paramMap.get('token') || '';
    if (!this.token) {
      this.error.set('Invalid invite link. Missing token.');
      return;
    }

    this.loadInviteDetails();
  }

  private loadInviteDetails() {
    this.loading.set(true);
    this.http.get<InviteDetails>(`http://localhost:5031/api/invite/${this.token}`).subscribe({
      next: (details) => {
        this.inviteDetails.set(details);
        // Use free qrserver to render the OTPAuth URI as a QR code image
        this.qrImageUrl.set(`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(details.qrCodeUri)}`);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error || 'Failed to load invite details. The link may have expired or is invalid.');
        this.loading.set(false);
      }
    });
  }

  verifySetup() {
    const details = this.inviteDetails();
    if (!details || this.code().length !== 6) {
      this.error.set('Please enter a 6-digit verification code.');
      return;
    }

    this.verifying.set(true);
    this.error.set('');

    this.http.post(`http://localhost:5031/api/employees/${details.employeeId}/totp-verify`, {
      code: this.code()
    }).subscribe({
      next: () => {
        this.verifying.set(false);
        this.successMsg.set('Authenticator linked successfully! You will be redirected to login shortly.');
        setTimeout(() => {
          this.router.navigate(['/auth/login']);
        }, 3000);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Verification failed. Please check the code in your app and try again.');
        this.verifying.set(false);
      }
    });
  }
}
