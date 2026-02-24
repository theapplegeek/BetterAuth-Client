import {
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
  WritableSignal,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UserService } from '../../../../common/user/user.service';
import { User } from '../../../../common/user/models/user.type';
import { ToastService } from '../../../../common/services/toast.service';
import { AccountSecurityService } from '../../../settings/services/account-security.service';
import { trimControl } from '../../../../common/forms/input-normalizer.util';

@Component({
  selector: 'app-username-onboarding',
  imports: [ReactiveFormsModule],
  templateUrl: './username-onboarding.component.html',
  styleUrl: './username-onboarding.component.scss',
})
export class UsernameOnboardingComponent
  implements OnInit
{
  private readonly _destroyRef: DestroyRef =
    inject(DestroyRef);
  private readonly _router: Router = inject(Router);
  private readonly _route: ActivatedRoute =
    inject(ActivatedRoute);
  private readonly _userService: UserService =
    inject(UserService);
  private readonly _toast: ToastService =
    inject(ToastService);
  private readonly _accountSecurityService: AccountSecurityService =
    inject(AccountSecurityService);

  public readonly isSaving: WritableSignal<boolean> =
    signal<boolean>(false);
  public readonly user = computed((): User | undefined =>
    this._userService.user(),
  );

  public readonly onboardingForm = new FormGroup({
    username: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(120),
        Validators.pattern(/^[A-Za-z0-9]{2,120}$/),
      ],
    }),
  });

  ngOnInit(): void {
    const currentUser: User | undefined = this.user();
    if (!currentUser) return;

    const normalizedName: string = currentUser.name.trim();
    if (normalizedName.length > 0) {
      this._router.navigateByUrl(this._resolveReturnUrl());
      return;
    }

    this.onboardingForm.patchValue({
      username: '',
    });
  }

  public submit(): void {
    trimControl(this.onboardingForm.controls.username);

    if (this.onboardingForm.invalid) {
      this.onboardingForm.markAllAsTouched();
      return;
    }

    const username: string =
      this.onboardingForm.controls.username.value;
    this.isSaving.set(true);

    this._accountSecurityService
      .updateUserName(username)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (): void => {
          this.isSaving.set(false);
          this._toast.success('Username set successfully.');
          this._router.navigateByUrl(
            this._resolveReturnUrl(),
          );
        },
        error: (error: unknown): void => {
          this.isSaving.set(false);
          this._toast.error(
            this._extractErrorMessage(
              error,
              'Unable to save username.',
            ),
          );
        },
      });
  }

  private _resolveReturnUrl(): string {
    const returnUrl: string =
      this._route.snapshot.queryParamMap.get('returnUrl') ??
      '';

    if (!returnUrl.startsWith('/')) {
      return '/home';
    }

    if (
      returnUrl.startsWith('/auth') ||
      returnUrl.startsWith('/onboarding')
    ) {
      return '/home';
    }

    return returnUrl;
  }

  private _extractErrorMessage(
    error: unknown,
    fallback: string,
  ): string {
    if (!error || typeof error !== 'object') {
      return fallback;
    }

    const candidate = error as {
      message?: string;
      statusText?: string;
    };
    return (
      candidate.message ?? candidate.statusText ?? fallback
    );
  }
}
