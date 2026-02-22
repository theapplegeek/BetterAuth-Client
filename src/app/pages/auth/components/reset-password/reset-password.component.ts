import {
  Component,
  effect,
  inject,
  input,
  InputSignal,
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
import { ToastService } from '../../../../common/services/toast.service';

@Component({
  selector: 'app-reset-password',
  imports: [ReactiveFormsModule],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
})
export class ResetPasswordComponent {
  public token: InputSignal<string> =
    input.required<string>();

  private readonly _router: Router = inject(Router);
  private readonly _authService: AuthService =
    inject(AuthService);
  private readonly _toastService: ToastService =
    inject(ToastService);

  public errorMessage: WritableSignal<string> =
    signal<string>('');
  public successMessage: WritableSignal<string> =
    signal<string>('');

  public get passwordMatch(): boolean {
    return (
      this.form.value.password ===
      this.form.value.confirmPassword
    );
  }

  public form: FormGroup = new FormGroup({
    password: new FormControl('', [
      Validators.required,
      Validators.minLength(8),
    ]),
    confirmPassword: new FormControl('', [
      Validators.required,
      Validators.minLength(8),
    ]),
  });

  constructor() {
    effect((): void => {
      if (!this.token() || this.token() === '') {
        this._toastService.error(
          'Invalid or missing reset token. Request a new reset link.',
        );
        this._router.navigate(['/redirect-to-home']);
      }
    });
  }

  public onSubmit(): void {
    this.errorMessage.set('');
    this.successMessage.set('');

    if (
      this.form.value.password !==
      this.form.value.confirmPassword
    ) {
      this.errorMessage.set('Passwords do not match');
      return;
    }

    this._authService
      .resetPassword(this.form.value.password, this.token())
      .subscribe({
        next: (): void => {
          this.successMessage.set(
            'Password reset successfully',
          );
          setTimeout(() => {
            this._router.navigate(['auth/sign-in']);
          }, 2000);
        },
        error: (err: any): void => {
          this.errorMessage.set(
            err.message || 'Failed to reset password',
          );
        },
      });
  }

  public onBackToSignIn(): void {
    this._router.navigate(['auth/sign-in']);
  }
}
