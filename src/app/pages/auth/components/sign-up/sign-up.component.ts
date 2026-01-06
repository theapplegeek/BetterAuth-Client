import {
  Component,
  inject,
  signal,
  WritableSignal,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AuthService } from '../../../../common/auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sign-up',
  imports: [ReactiveFormsModule],
  templateUrl: './sign-up.component.html',
  styleUrl: './sign-up.component.scss',
})
export class SignUpComponent {
  private readonly _authService: AuthService =
    inject(AuthService);
  private readonly _router: Router = inject(Router);

  public form: FormGroup = new FormGroup({
    name: new FormControl('', [Validators.required]),
    email: new FormControl('', [
      Validators.required,
      Validators.email,
    ]),
    password: new FormControl('', [Validators.required]),
  });
  public errorMessage: WritableSignal<string> =
    signal<string>('');
  public successMessage: WritableSignal<string> =
    signal<string>('');

  public onSignUp(): void {
    if (this.form.invalid) return;
    const data: any = this.form.value;
    this._authService.signUp(data).subscribe({
      next: (): void => {
        this.successMessage.set(
          'Check your email for verify your account',
        );
      },
      error: (err: any): void => {
        this.errorMessage.set(
          err.message ||
            'An error occurred while creating your account',
        );
        this.successMessage.set('');
      },
    });
  }

  public onSignIn(): void {
    this._router.navigate(['auth/sign-in']);
  }
}
