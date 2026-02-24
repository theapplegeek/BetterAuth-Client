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
import { QRCodeComponent } from 'angularx-qrcode';
import { ClipboardService } from '../../../../common/services/clipboard.service';
import { trimControl } from '../../../../common/forms/input-normalizer.util';

@Component({
  selector: 'app-two-factor-enable',
  imports: [QRCodeComponent, ReactiveFormsModule],
  templateUrl: './two-factor-enable.component.html',
  styleUrl: './two-factor-enable.component.scss',
})
export class TwoFactorEnableComponent {
  private readonly _router: Router = inject(Router);
  private readonly _clipboardService: ClipboardService =
    inject(ClipboardService);
  public readonly authService: AuthService =
    inject(AuthService);

  public form: FormGroup = new FormGroup({
    code: new FormControl('', [
      Validators.required,
      Validators.minLength(6),
    ]),
  });
  public isVerified: WritableSignal<boolean> =
    signal<boolean>(false);
  public errorMessage: WritableSignal<string> =
    signal<string>('');

  constructor() {
    if (
      !this.authService.twoFactorEnableData() ||
      !this.authService.twoFactorEnableData()!
        .backupCodes ||
      !this.authService.twoFactorEnableData()!.totpURI
    ) {
      this._router.navigate(['/']);
    }
  }

  public onVerify(): void {
    const codeControl = this.form.controls['code'];
    trimControl(codeControl);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.authService
      .verifyTwoFactorTOTP(codeControl.value)
      .subscribe({
        next: (): void => {
          this.errorMessage.set('');
          this.isVerified.set(true);
        },
        error: (err: any): void => {
          this.errorMessage.set(
            err.message || 'Invalid verification code',
          );
        },
      });
  }

  public async onCopyCode(code: string): Promise<void> {
    this._clipboardService.copyText(code).then(() => {
      // TODO: Show success message
      console.log('Code copied to clipboard');
    });
  }

  public onCopyAllCodes(): void {
    const allCodes: string = this.authService
      .twoFactorEnableData()!
      .backupCodes!.join('\n');
    this._clipboardService
      .copyText(allCodes)
      .then((): void => {
        // TODO: Show success message
        console.log('Codes copied to clipboard');
      });
  }

  public onContinue(): void {
    this._router.navigate(['/redirect-to-home']);
  }
}
