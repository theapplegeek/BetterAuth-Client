import {
  Component,
  computed,
  DestroyRef,
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
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { AdminService } from '../../../../common/admin/admin.service';
import { AuthService } from '../../../../common/auth/auth.service';
import {
  AdminRole,
  AdminUser,
  AdminUserSession,
  ListUsersQuery,
  SortDirection,
  UserUpsertPayload,
} from '../../../../common/admin/models/admin.model';

type FeedbackType = 'success' | 'error' | 'warning';
type FeedbackMessage = {
  type: FeedbackType;
  text: string;
};
type UserModal =
  | 'none'
  | 'detail'
  | 'create'
  | 'edit'
  | 'password'
  | 'ban'
  | 'sessions'
  | 'delete';
type UserSortColumn = 'name' | 'email' | 'role';

@Component({
  selector: 'app-users-management',
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './users-management.component.html',
  styleUrl: './users-management.component.scss',
})
export class UsersManagementComponent {
  private readonly _destroyRef: DestroyRef =
    inject(DestroyRef);
  private readonly _adminService: AdminService =
    inject(AdminService);
  private readonly _authService: AuthService =
    inject(AuthService);
  private readonly _router: Router = inject(Router);

  private _feedbackTimeout:
    | ReturnType<typeof setTimeout>
    | undefined;

  public readonly users: WritableSignal<AdminUser[]> =
    signal<AdminUser[]>([]);
  public readonly roles: WritableSignal<AdminRole[]> =
    signal<AdminRole[]>([]);
  public readonly selectedRoleIds: WritableSignal<
    number[]
  > = signal<number[]>([]);
  public readonly sessions: WritableSignal<
    AdminUserSession[]
  > = signal<AdminUserSession[]>([]);
  public readonly selectedUser: WritableSignal<
    AdminUser | undefined
  > = signal<AdminUser | undefined>(undefined);
  public readonly activeModal: WritableSignal<UserModal> =
    signal<UserModal>('none');
  public readonly feedback: WritableSignal<
    FeedbackMessage | undefined
  > = signal<FeedbackMessage | undefined>(undefined);

  public readonly isLoadingUsers: WritableSignal<boolean> =
    signal<boolean>(true);
  public readonly isSavingUser: WritableSignal<boolean> =
    signal<boolean>(false);
  public readonly isSavingPassword: WritableSignal<boolean> =
    signal<boolean>(false);
  public readonly isSavingBan: WritableSignal<boolean> =
    signal<boolean>(false);
  public readonly isDeletingUser: WritableSignal<boolean> =
    signal<boolean>(false);
  public readonly isImpersonatingUser: WritableSignal<boolean> =
    signal<boolean>(false);
  public readonly isLoadingSessions: WritableSignal<boolean> =
    signal<boolean>(false);
  public readonly revokingSessionToken: WritableSignal<
    string | undefined
  > = signal<string | undefined>(undefined);
  public readonly isRevokingAllSessions: WritableSignal<boolean> =
    signal<boolean>(false);
  public readonly updatingBanUserId: WritableSignal<
    string | undefined
  > = signal<string | undefined>(undefined);

  public readonly totalUsers: WritableSignal<number> =
    signal<number>(0);
  public readonly currentPage: WritableSignal<number> =
    signal<number>(1);
  public readonly pageSize: WritableSignal<number> =
    signal<number>(10);
  public readonly sortColumn: WritableSignal<
    UserSortColumn | undefined
  > = signal<UserSortColumn | undefined>('name');
  public readonly sortDirection: WritableSignal<
    SortDirection | undefined
  > = signal<SortDirection | undefined>('asc');
  public readonly pageSizeOptions: number[] = [
    5, 10, 20, 50,
  ];

  public readonly totalPages = computed((): number =>
    Math.max(
      1,
      Math.ceil(this.totalUsers() / this.pageSize()),
    ),
  );
  public readonly visibleFrom = computed((): number => {
    if (this.totalUsers() === 0) return 0;
    return (this.currentPage() - 1) * this.pageSize() + 1;
  });
  public readonly visibleTo = computed((): number =>
    Math.min(
      this.currentPage() * this.pageSize(),
      this.totalUsers(),
    ),
  );

  public readonly searchForm = new FormGroup({
    searchValue: new FormControl('', {
      nonNullable: true,
    }),
    searchField: new FormControl<'name' | 'email'>('name', {
      nonNullable: true,
    }),
  });
  public readonly userForm = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(2),
      ],
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    role: new FormControl<'user' | 'admin'>('user', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    image: new FormControl('', {
      nonNullable: true,
    }),
    emailVerified: new FormControl(false, {
      nonNullable: true,
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.minLength(8)],
    }),
  });
  public readonly passwordForm = new FormGroup({
    newPassword: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(8),
      ],
    }),
  });
  public readonly banForm = new FormGroup({
    reason: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(2),
      ],
    }),
    durationHours: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.min(0)],
    }),
  });

  constructor() {
    this.loadInitialState();
  }

  public loadInitialState(): void {
    this._loadRoles();
    this.loadUsers();
  }

  public loadUsers(): void {
    const query: ListUsersQuery = {
      limit: this.pageSize(),
      offset: (this.currentPage() - 1) * this.pageSize(),
      sortBy: this.sortColumn(),
      sortDirection: this.sortDirection(),
    };

    const searchValue: string =
      this.searchForm.controls.searchValue.value.trim();
    if (searchValue) {
      query.searchValue = searchValue;
      query.searchField =
        this.searchForm.controls.searchField.value;
      query.searchOperator = 'contains';
    }

    this.isLoadingUsers.set(true);
    this._adminService
      .listUsers(query)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (result): void => {
          this.users.set(result.users);
          this.totalUsers.set(result.total);
          this.isLoadingUsers.set(false);

          if (
            this.currentPage() > this.totalPages() &&
            this.totalUsers() > 0
          ) {
            this.currentPage.set(this.totalPages());
            this.loadUsers();
          }
        },
        error: (error: unknown): void => {
          this.isLoadingUsers.set(false);
          this._showFeedback(
            'error',
            this._extractErrorMessage(
              error,
              'Unable to load users.',
            ),
          );
        },
      });
  }

  public runSearch(): void {
    this.currentPage.set(1);
    this.loadUsers();
  }

  public clearSearch(): void {
    this.searchForm.reset({
      searchValue: '',
      searchField: 'name',
    });
    this.currentPage.set(1);
    this.loadUsers();
  }

  public toggleSort(column: UserSortColumn): void {
    if (this.sortColumn() !== column) {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    } else if (this.sortDirection() === 'asc') {
      this.sortDirection.set('desc');
    } else if (this.sortDirection() === 'desc') {
      this.sortColumn.set(undefined);
      this.sortDirection.set(undefined);
    } else {
      this.sortDirection.set('asc');
    }

    this.currentPage.set(1);
    this.loadUsers();
  }

  public goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.loadUsers();
  }

  public onPageSizeChange(value: string): void {
    const nextPageSize: number = Number(value);
    if (!nextPageSize || nextPageSize < 1) return;

    this.pageSize.set(nextPageSize);
    this.currentPage.set(1);
    this.loadUsers();
  }

  public onPageSizeSelectChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.onPageSizeChange(target.value);
  }

  public openDetail(user: AdminUser): void {
    this.selectedUser.set(user);
    this.activeModal.set('detail');
  }

  public openCreate(): void {
    this.selectedUser.set(undefined);
    this._resetUserForm();
    this.activeModal.set('create');
  }

  public openEdit(user: AdminUser): void {
    this.selectedUser.set(user);
    this._resetUserForm();
    this.userForm.patchValue({
      name: user.name,
      email: user.email,
      role: user.role === 'admin' ? 'admin' : 'user',
      image: user.image ?? '',
      emailVerified: user.emailVerified,
      password: '',
    });
    this.selectedRoleIds.set(
      user.roles.map((role: AdminRole): number => role.id),
    );
    this.activeModal.set('edit');
  }

  public openPasswordEditor(user: AdminUser): void {
    this.selectedUser.set(user);
    this.passwordForm.reset({
      newPassword: '',
    });
    this.activeModal.set('password');
  }

  public openBanModal(user: AdminUser): void {
    this.selectedUser.set(user);
    this.banForm.reset({
      reason: '',
      durationHours: 0,
    });
    this.activeModal.set('ban');
  }

  public openSessions(user: AdminUser): void {
    this.selectedUser.set(user);
    this.activeModal.set('sessions');
    this._loadSessionsForSelectedUser();
  }

  public openDelete(user: AdminUser): void {
    this.selectedUser.set(user);
    this.activeModal.set('delete');
  }

  public closeModal(): void {
    this.activeModal.set('none');
    this.sessions.set([]);
    this.passwordForm.reset({
      newPassword: '',
    });
    this.banForm.reset({
      reason: '',
      durationHours: 0,
    });
  }

  public toggleRoleSelection(
    roleId: number,
    checked: boolean,
  ): void {
    this.selectedRoleIds.update(
      (currentRoleIds: number[]): number[] => {
        if (checked) {
          return Array.from(
            new Set([...currentRoleIds, roleId]),
          );
        }

        return currentRoleIds.filter(
          (candidateRoleId: number): boolean =>
            candidateRoleId !== roleId,
        );
      },
    );
  }

  public isRoleSelected(roleId: number): boolean {
    return this.selectedRoleIds().includes(roleId);
  }

  public onRoleCheckboxChange(
    roleId: number,
    event: Event,
  ): void {
    const target = event.target as HTMLInputElement;
    this.toggleRoleSelection(roleId, target.checked);
  }

  public formatRoleList(user: AdminUser): string {
    return user.roles
      .map((role: AdminRole): string => role.name)
      .join(', ');
  }

  public saveUser(): void {
    const mode: UserModal = this.activeModal();
    if (mode !== 'create' && mode !== 'edit') return;

    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    const formValue = this.userForm.getRawValue();
    const payload: UserUpsertPayload = {
      name: formValue.name.trim(),
      email: formValue.email.trim(),
      emailVerified: formValue.emailVerified,
      image: formValue.image.trim() || undefined,
      role: formValue.role,
      roleIds: this.selectedRoleIds(),
    };

    this.isSavingUser.set(true);

    if (mode === 'create') {
      if (!formValue.password.trim()) {
        this.isSavingUser.set(false);
        this._showFeedback(
          'warning',
          'Password is required for new users.',
        );
        return;
      }

      payload.password = formValue.password.trim();
      this._adminService
        .createUser(payload)
        .pipe(takeUntilDestroyed(this._destroyRef))
        .subscribe({
          next: (): void => {
            this.isSavingUser.set(false);
            this.closeModal();
            this._showFeedback(
              'success',
              'User created successfully.',
            );
            this.loadUsers();
          },
          error: (error: unknown): void => {
            this.isSavingUser.set(false);
            this._showFeedback(
              'error',
              this._extractErrorMessage(
                error,
                'Unable to create user.',
              ),
            );
          },
        });
      return;
    }

    const selectedUser = this.selectedUser();
    if (!selectedUser) {
      this.isSavingUser.set(false);
      return;
    }

    this._adminService
      .updateUser(selectedUser.id, payload)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (): void => {
          this.isSavingUser.set(false);
          this.closeModal();
          this._showFeedback(
            'success',
            'User updated successfully.',
          );
          this.loadUsers();
        },
        error: (error: unknown): void => {
          this.isSavingUser.set(false);
          this._showFeedback(
            'error',
            this._extractErrorMessage(
              error,
              'Unable to update user.',
            ),
          );
        },
      });
  }

  public savePassword(): void {
    const selectedUser = this.selectedUser();
    if (!selectedUser) return;

    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.isSavingPassword.set(true);
    this._adminService
      .setUserPassword(
        selectedUser.id,
        this.passwordForm.controls.newPassword.value,
      )
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (): void => {
          this.isSavingPassword.set(false);
          this.closeModal();
          this._showFeedback(
            'success',
            'Password updated.',
          );
        },
        error: (error: unknown): void => {
          this.isSavingPassword.set(false);
          this._showFeedback(
            'error',
            this._extractErrorMessage(
              error,
              'Unable to set password.',
            ),
          );
        },
      });
  }

  public banUser(): void {
    const selectedUser = this.selectedUser();
    if (!selectedUser) return;

    if (this.banForm.invalid) {
      this.banForm.markAllAsTouched();
      return;
    }

    const durationHours: number =
      this.banForm.controls.durationHours.value;
    const expiresInSeconds: number | undefined =
      durationHours > 0
        ? Math.round(durationHours * 3600)
        : undefined;

    this.isSavingBan.set(true);
    this._adminService
      .banUser(
        selectedUser.id,
        this.banForm.controls.reason.value.trim(),
        expiresInSeconds,
      )
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (): void => {
          this.isSavingBan.set(false);
          this.closeModal();
          this._showFeedback(
            'success',
            'User banned successfully.',
          );
          this.loadUsers();
        },
        error: (error: unknown): void => {
          this.isSavingBan.set(false);
          this._showFeedback(
            'error',
            this._extractErrorMessage(
              error,
              'Unable to ban user.',
            ),
          );
        },
      });
  }

  public unbanUser(user: AdminUser): void {
    const shouldUnban: boolean = window.confirm(
      `Unban ${user.name}?`,
    );
    if (!shouldUnban) return;

    this.updatingBanUserId.set(user.id);
    this._adminService
      .unbanUser(user.id)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (): void => {
          this.updatingBanUserId.set(undefined);
          this._showFeedback('success', 'User unbanned.');
          this.loadUsers();
        },
        error: (error: unknown): void => {
          this.updatingBanUserId.set(undefined);
          this._showFeedback(
            'error',
            this._extractErrorMessage(
              error,
              'Unable to unban user.',
            ),
          );
        },
      });
  }

  public impersonateUser(user: AdminUser): void {
    if (user.banned) {
      this._showFeedback(
        'warning',
        'Cannot impersonate a banned user.',
      );
      return;
    }

    const shouldImpersonate: boolean = window.confirm(
      `Impersonate ${user.name}?`,
    );
    if (!shouldImpersonate) return;

    this.isImpersonatingUser.set(true);
    this._adminService
      .impersonateUser(user.id)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (): void => {
          this.isImpersonatingUser.set(false);
          this._authService
            .getJwtToken()
            .pipe(takeUntilDestroyed(this._destroyRef))
            .subscribe();
          this._router.navigate(['/home']);
        },
        error: (error: unknown): void => {
          this.isImpersonatingUser.set(false);
          this._showFeedback(
            'error',
            this._extractErrorMessage(
              error,
              'Unable to impersonate user.',
            ),
          );
        },
      });
  }

  public deleteSelectedUser(): void {
    const selectedUser = this.selectedUser();
    if (!selectedUser) return;

    this.isDeletingUser.set(true);
    this._adminService
      .removeUser(selectedUser.id)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (): void => {
          this.isDeletingUser.set(false);
          this.closeModal();
          this._showFeedback(
            'success',
            'User deleted successfully.',
          );
          this.loadUsers();
        },
        error: (error: unknown): void => {
          this.isDeletingUser.set(false);
          this._showFeedback(
            'error',
            this._extractErrorMessage(
              error,
              'Unable to delete user.',
            ),
          );
        },
      });
  }

  public revokeSession(session: AdminUserSession): void {
    const shouldRevoke: boolean = window.confirm(
      'Revoke this session?',
    );
    if (!shouldRevoke) return;

    const sessionToken: string =
      session.token || session.id;
    this.revokingSessionToken.set(sessionToken);
    this._adminService
      .revokeUserSession(sessionToken)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (): void => {
          this.revokingSessionToken.set(undefined);
          this._loadSessionsForSelectedUser();
        },
        error: (error: unknown): void => {
          this.revokingSessionToken.set(undefined);
          this._showFeedback(
            'error',
            this._extractErrorMessage(
              error,
              'Unable to revoke session.',
            ),
          );
        },
      });
  }

  public revokeAllSessions(): void {
    const selectedUser = this.selectedUser();
    if (!selectedUser) return;

    const shouldRevokeAll: boolean = window.confirm(
      'Revoke all sessions for this user?',
    );
    if (!shouldRevokeAll) return;

    this.isRevokingAllSessions.set(true);
    this._adminService
      .revokeUserSessions(selectedUser.id)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (): void => {
          this.isRevokingAllSessions.set(false);
          this._loadSessionsForSelectedUser();
        },
        error: (error: unknown): void => {
          this.isRevokingAllSessions.set(false);
          this._showFeedback(
            'error',
            this._extractErrorMessage(
              error,
              'Unable to revoke all user sessions.',
            ),
          );
        },
      });
  }

  public banStatusClass(user: AdminUser): string {
    if (user.banned) {
      return 'bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-300';
    }
    return 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300';
  }

  private _loadRoles(): void {
    this._adminService
      .listRoles()
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (roles: AdminRole[]): void => {
          this.roles.set(roles);
        },
        error: (): void => {
          this.roles.set([]);
        },
      });
  }

  private _loadSessionsForSelectedUser(): void {
    const selectedUser = this.selectedUser();
    if (!selectedUser) return;

    this.isLoadingSessions.set(true);
    this._adminService
      .listUserSessions(selectedUser.id)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (sessions: AdminUserSession[]): void => {
          const sortedSessions = [...sessions].sort(
            (
              firstSession: AdminUserSession,
              secondSession: AdminUserSession,
            ): number => {
              return (
                new Date(
                  secondSession.updatedAt,
                ).getTime() -
                new Date(firstSession.updatedAt).getTime()
              );
            },
          );
          this.sessions.set(sortedSessions);
          this.isLoadingSessions.set(false);
        },
        error: (error: unknown): void => {
          this.isLoadingSessions.set(false);
          this._showFeedback(
            'error',
            this._extractErrorMessage(
              error,
              'Unable to load user sessions.',
            ),
          );
        },
      });
  }

  private _resetUserForm(): void {
    this.userForm.reset({
      name: '',
      email: '',
      role: 'user',
      image: '',
      emailVerified: false,
      password: '',
    });
    this.selectedRoleIds.set([]);
  }

  private _showFeedback(
    type: FeedbackType,
    text: string,
  ): void {
    if (this._feedbackTimeout) {
      clearTimeout(this._feedbackTimeout);
    }

    this.feedback.set({ type, text });
    this._feedbackTimeout = setTimeout((): void => {
      this.feedback.set(undefined);
    }, 7000);
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
