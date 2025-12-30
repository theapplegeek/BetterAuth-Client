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
    email: new FormControl('weibin.xu.dev@gmail.com', [Validators.required, Validators.email]),
    password: new FormControl('Password123', [Validators.required])
  });
  public passkeyAutofillEnabled: WritableSignal<boolean> = signal<boolean>(false)
  public errorMessage: WritableSignal<string> = signal<string>('');

  public onSignInWithPassword(): void {
    this._authService.signInWithPassword(this.form.value)
      .subscribe({
        error: (err: any): void => {
          this.errorMessage.set(err.message);
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

  public onSignInWithMagicLink(): void {
    this._router.navigate(['auth/sign-in/magic-link']);
  }

  public onSignUp(): void {
    this._router.navigate(['auth/sign-up']);
  }
}
