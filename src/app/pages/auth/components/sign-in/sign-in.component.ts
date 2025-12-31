import {Component, inject, signal, WritableSignal} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router} from '@angular/router';
import {AuthService} from '../../../../common/auth/auth.service';

@Component({
  selector: 'app-sign-in',
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './sign-in.component.html',
  styleUrl: './sign-in.component.scss',
})
export class SignInComponent {
  private readonly _router: Router = inject(Router);
  private readonly _authService: AuthService = inject(AuthService);

  public form: FormGroup = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required])
  });
  public passkeyAutofillEnabled: WritableSignal<boolean> = signal<boolean>(false)
  public errorMessage: WritableSignal<string> = signal<string>('');
  public successMessage: WritableSignal<string> = signal<string>('');
  public showPasswordForm: WritableSignal<boolean> = signal<boolean>(false);

  public onSignInWithMagicLink(): void {
    this._authService.signInWithMagicLink(this.form.value.email).subscribe({
      next: (): void => {
        this.successMessage.set('Check your email for a login link!');
        this.errorMessage.set('');
      },
      error: (err: any): void => {
        this.errorMessage.set(err.message || 'Failed to send login link');
        this.successMessage.set('');
      }
    });
  }

  public onSignInWithPassword(): void {
    this._authService.signInWithPassword(this.form.value)
      .subscribe({
        error: (err: any): void => {
          this.errorMessage.set(err.message || 'Invalid email or password');
          this.successMessage.set('');
        }
      });
  }

  public onForgotPassword(): void {
    this._router.navigate(['auth/forgot-password']);
  }

  public onEnablePasskeyAutofill(): void {
    if (this.passkeyAutofillEnabled()) return;
    this._authService.signInWithPasskey(true).subscribe();
    this.passkeyAutofillEnabled.set(true);
  }

  public onSignInWithPasskey(): void {
    this._authService.signInWithPasskey(false).subscribe();
  }

  public onSignInWithGoogle(): void {
    this._authService.signInWithGoogle().subscribe();
  }

  public onSignInWithDiscord(): void {
    this._authService.signInWithDiscord().subscribe();
  }

  public onShowPasswordForm(): void {
    this.showPasswordForm.set(true);
    this.successMessage.set('');
    this.errorMessage.set('');
  }

  public onShowMagicLinkForm(): void {
    this.showPasswordForm.set(false);
    this.successMessage.set('');
    this.errorMessage.set('');
  }

  public onSignUp(): void {
    this._router.navigate(['auth/sign-up']);
  }
}
