import {
  Component,
  inject,
  signal,
  WritableSignal,
} from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../common/auth/auth.service';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

@Component({
  selector: 'app-forgot-password',
  imports: [ReactiveFormsModule],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
})
export class ForgotPasswordComponent {
  private readonly _router: Router = inject(Router);
  private readonly _authService: AuthService =
    inject(AuthService);

  public errorMessage: WritableSignal<string> =
    signal<string>('');
  public successMessage: WritableSignal<string> =
    signal<string>('');
  public resetPasswordCooldown: WritableSignal<number> =
    signal<number>(0);

  public form: FormGroup = new FormGroup({
    email: new FormControl('', [
      Validators.required,
      Validators.email,
    ]),
  });

  public onSubmit(): void {
    if (this.resetPasswordCooldown() > 0) return;

    this.errorMessage.set('');
    this.successMessage.set('');

    this._authService
      .requestResetPassword(this.form.value.email)
      .subscribe({
        next: (data): void => {
          this.successMessage.set(
            data.message || 'If this email exists in our system, check your email for the reset link ',
          );
          this.startResetPasswordCooldown();
        },
        error: (error: any): void => {
          this.errorMessage.set(
            error.message || 'Failed to send reset link',
          );
        },
      });
  }

  private startResetPasswordCooldown(): void {
    this.resetPasswordCooldown.set(60);
    const interval = setInterval(() => {
      const current = this.resetPasswordCooldown();
      if (current <= 1) {
        clearInterval(interval);
        this.resetPasswordCooldown.set(0);
      } else {
        this.resetPasswordCooldown.set(current - 1);
      }
    }, 1000);
  }

  public onBackToSignIn(): void {
    this._router.navigate(['/redirect-to-sign-in']);
  }
}
