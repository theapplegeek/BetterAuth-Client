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
  public magicLinkCooldown: WritableSignal<number> = signal<number>(0);

  public onSignInWithMagicLink(): void {
    if (this.magicLinkCooldown() > 0) return;
    if (this.form.controls['email'].invalid) return;

    this._authService.signInWithMagicLink(this.form.value.email).subscribe({
      next: (): void => {
        this.successMessage.set('Check your email for a login link!');
        this.errorMessage.set('');
        this.startMagicLinkCooldown();
      },
      error: (err: any): void => {
        this.errorMessage.set(err.message || 'Failed to send login link');
        this.successMessage.set('');
      }
    });
  }

  private startMagicLinkCooldown(): void {
    this.magicLinkCooldown.set(60);
    const interval: number = setInterval((): void => {
      const current: number = this.magicLinkCooldown();
      if (current <= 1) {
        clearInterval(interval);
        this.magicLinkCooldown.set(0);
      } else {
        this.magicLinkCooldown.set(current - 1);
      }
    }, 1000);
  }

  public onSignInWithPassword(): void {
    if (this.form.invalid) return;
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
