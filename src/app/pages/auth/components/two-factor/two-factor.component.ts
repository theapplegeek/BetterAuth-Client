import {
  Component,
  inject,
  signal,
  WritableSignal,
} from '@angular/core';
import { AuthService } from '../../../../common/auth/auth.service';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { trimControl } from '../../../../common/forms/input-normalizer.util';

@Component({
  selector: 'app-two-factor',
  imports: [ReactiveFormsModule],
  templateUrl: './two-factor.component.html',
  styleUrl: './two-factor.component.scss',
})
export class TwoFactorComponent {
  private readonly _authService: AuthService =
    inject(AuthService);
  private readonly _router: Router = inject(Router);

  public form: FormGroup = new FormGroup({
    code: new FormControl('', [
      Validators.required,
      Validators.minLength(6),
    ]),
  });
  public errorMessage: WritableSignal<string> =
    signal<string>('');

  public onVerify(): void {
    const codeControl = this.form.controls['code'];
    trimControl(codeControl);

    if (this.form.invalid) return;
    this._authService
      .verifyTwoFactorTOTP(codeControl.value)
      .subscribe({
        next: (): void => {
          this.errorMessage.set('');
          this._router.navigate(['/redirect-to-home']);
        },
        error: (err: any): void => {
          this.errorMessage.set(
            err.message || 'Invalid verification code',
          );
        },
      });
  }

  public onVerifyWithBackupCode(): void {
    const codeControl = this.form.controls['code'];
    trimControl(codeControl);

    if (this.form.invalid) return;
    this._authService
      .verifyTwoFactorBackupCode(codeControl.value)
      .subscribe({
        next: (): void => {
          this.errorMessage.set('');
          this._router.navigate(['/redirect-to-home']);
        },
        error: (err: any): void => {
          this.errorMessage.set(
            err.message || 'Invalid backup code',
          );
        },
      });
  }
}
