import {
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
  WritableSignal,
} from '@angular/core';
import { DialogRef } from '@angular/cdk/dialog';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { fromEvent } from 'rxjs';
import { AdminService } from '../../../../common/admin/admin.service';
import { AuthService } from '../../../../common/auth/auth.service';
import { AppDialogService } from '../../../../common/services/app-dialog.service';
import { ToastService } from '../../../../common/services/toast.service';
import {
  ConfirmDialogComponent,
  ConfirmDialogTone,
} from '../../../../dialogs/confirm-dialog/confirm-dialog.component';
import { UsersManagementDialogComponent } from '../../../../dialogs/admin/users-management-dialog/users-management-dialog.component';
import {
  AdminRole,
  AdminUser,
  AdminUserSession,
  ListUsersQuery,
  SortDirection,
  UserUpsertPayload,
} from '../../../../common/admin/models/admin.model';

type UserModal =
  | 'none'
  | 'detail'
  | 'create'
  | 'edit'
  | 'password'
  | 'ban'
  | 'impersonate'
  | 'sessions'
  | 'delete';
type UserSortColumn = 'name' | 'email' | 'role';

@Component({
  selector: 'app-users-management',
  imports: [
    ReactiveFormsModule,
    DatePipe,
  ],
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
  private readonly _dialogService: AppDialogService =
    inject(AppDialogService);
  private readonly _toast: ToastService =
    inject(ToastService);
  private _dialogRef:
    | DialogRef<void, UsersManagementDialogComponent>
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
  public readonly openActionMenuUserId: WritableSignal<
    string | undefined
  > = signal<string | undefined>(undefined);
  public readonly activeModal: WritableSignal<UserModal> =
    signal<UserModal>('none');

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
    fromEvent<KeyboardEvent>(document, 'keydown')
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((event: KeyboardEvent): void => {
        this._handleGlobalModalKeydown(event);
      });
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
          this._toast.error(
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
    this.closeActionMenu();
    this.currentPage.set(1);
    this.loadUsers();
  }

  public toggleSort(column: UserSortColumn): void {
    this.closeActionMenu();

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
    this.closeActionMenu();
    this.currentPage.set(page);
    this.loadUsers();
  }

  public onPageSizeChange(value: string): void {
    const nextPageSize: number = Number(value);
    if (!nextPageSize || nextPageSize < 1) return;

    this.closeActionMenu();
    this.pageSize.set(nextPageSize);
    this.currentPage.set(1);
    this.loadUsers();
  }

  public onPageSizeSelectChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.onPageSizeChange(target.value);
  }

  public openDetail(user: AdminUser): void {
    this.closeActionMenu();
    this.selectedUser.set(user);
    this.activeModal.set('detail');
    this._openDialog();
  }

  public openCreate(): void {
    this.closeActionMenu();
    this.selectedUser.set(undefined);
    this._resetUserForm();
    this.activeModal.set('create');
    this._openDialog();
  }

  public openEdit(user: AdminUser): void {
    this.closeActionMenu();
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
    this._openDialog();
  }

  public openPasswordEditor(user: AdminUser): void {
    this.closeActionMenu();
    this.selectedUser.set(user);
    this.passwordForm.reset({
      newPassword: '',
    });
    this.activeModal.set('password');
    this._openDialog();
  }

  public openBanModal(user: AdminUser): void {
    this.closeActionMenu();
    this.selectedUser.set(user);
    this.banForm.reset({
      reason: '',
      durationHours: 0,
    });
    this.activeModal.set('ban');
    this._openDialog();
  }

  public openSessions(user: AdminUser): void {
    this.closeActionMenu();
    this.selectedUser.set(user);
    this.activeModal.set('sessions');
    this._openDialog();
    this._loadSessionsForSelectedUser();
  }

  public openDelete(user: AdminUser): void {
    this.closeActionMenu();
    this.selectedUser.set(user);
    this.activeModal.set('delete');
    this._openDialog();
  }

  public openImpersonateModal(user: AdminUser): void {
    this.closeActionMenu();
    if (user.banned) {
      this._toast.warning(
        'Cannot impersonate a banned user.',
      );
      return;
    }

    this.selectedUser.set(user);
    this.activeModal.set('impersonate');
    this._openDialog();
  }

  public closeModal(): void {
    this._resetModalState();
    if (this._dialogRef) {
      const dialogRef = this._dialogRef;
      this._dialogRef = undefined;
      dialogRef.close();
    }
  }

  public toggleActionMenu(
    userId: string,
    event: Event,
  ): void {
    event.stopPropagation();
    this.openActionMenuUserId.update(
      (currentUserId: string | undefined): string | undefined =>
        currentUserId === userId ? undefined : userId,
    );
  }

  public closeActionMenu(): void {
    this.openActionMenuUserId.set(undefined);
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
        this._toast.warning(
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
            this._toast.success(
              'User created successfully.',
            );
            this.loadUsers();
          },
          error: (error: unknown): void => {
            this.isSavingUser.set(false);
            this._toast.error(
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
          this._toast.success(
            'User updated successfully.',
          );
          this.loadUsers();
        },
        error: (error: unknown): void => {
          this.isSavingUser.set(false);
          this._toast.error(
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
          this._toast.success('Password updated.');
        },
        error: (error: unknown): void => {
          this.isSavingPassword.set(false);
          this._toast.error(
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
          this._toast.success(
            'User banned successfully.',
          );
          this.loadUsers();
        },
        error: (error: unknown): void => {
          this.isSavingBan.set(false);
          this._toast.error(
            this._extractErrorMessage(
              error,
              'Unable to ban user.',
            ),
          );
        },
      });
  }

  public unbanUser(user: AdminUser): void {
    this.closeActionMenu();
    this._openConfirm(
      {
        title: `Unban ${user.name}?`,
        message:
          'This user will regain access immediately.',
        confirmLabel: 'Unban User',
        tone: 'primary',
      },
      (): void => {
        this._executeUnban(user.id);
      },
    );
  }

  public confirmImpersonation(): void {
    const selectedUser: AdminUser | undefined =
      this.selectedUser();
    if (!selectedUser) return;

    this.isImpersonatingUser.set(true);
    this._adminService
      .impersonateUser(selectedUser.id)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (): void => {
          this.isImpersonatingUser.set(false);
          this.closeModal();
          this._authService
            .getJwtToken()
            .pipe(takeUntilDestroyed(this._destroyRef))
            .subscribe();
          this._router.navigate(['/home']);
        },
        error: (error: unknown): void => {
          this.isImpersonatingUser.set(false);
          this._toast.error(
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
          this._toast.success(
            'User deleted successfully.',
          );
          this.loadUsers();
        },
        error: (error: unknown): void => {
          this.isDeletingUser.set(false);
          this._toast.error(
            this._extractErrorMessage(
              error,
              'Unable to delete user.',
            ),
          );
        },
      });
  }

  public revokeSession(session: AdminUserSession): void {
    const sessionToken: string =
      session.token || session.id;
    this._openConfirm(
      {
        title: 'Revoke this session?',
        message:
          'The selected device will be signed out.',
        confirmLabel: 'Revoke Session',
        tone: 'danger',
      },
      (): void => {
        this._executeRevokeSession(sessionToken);
      },
    );
  }

  public revokeAllSessions(): void {
    const selectedUser = this.selectedUser();
    if (!selectedUser) return;

    this._openConfirm(
      {
        title: `Revoke all sessions for ${selectedUser.name}?`,
        message:
          'All active sessions for this user will be terminated.',
        confirmLabel: 'Revoke All Sessions',
        tone: 'danger',
      },
      (): void => {
        this._executeRevokeAllSessions(selectedUser.id);
      },
    );
  }

  public banStatusClass(user: AdminUser): string {
    if (user.banned) {
      return 'bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-300';
    }
    return 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300';
  }

  private _openConfirm(
    config: {
      title: string;
      message: string;
      confirmLabel: string;
      tone: ConfirmDialogTone;
    },
    onConfirm: () => void,
  ): void {
    this._dialogService
      .open<boolean, unknown, ConfirmDialogComponent>(
        ConfirmDialogComponent,
        {
          width: 'min(100vw - 2rem, 36rem)',
          maxWidth: '36rem',
          data: config,
        },
      )
      .closed.pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((confirmed: boolean | undefined): void => {
        if (confirmed) {
          onConfirm();
        }
      });
  }

  private _openDialog(): void {
    if (this._dialogRef) return;

    this._dialogRef = this._dialogService.open<
      void,
      { host: UsersManagementComponent },
      UsersManagementDialogComponent
    >(UsersManagementDialogComponent, {
      width: 'min(100vw - 2rem, 64rem)',
      maxWidth: '64rem',
      data: { host: this },
    });

    this._dialogRef.closed
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((): void => {
        this._dialogRef = undefined;
        this._resetModalState();
      });
  }

  private _resetModalState(): void {
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
          this._toast.error(
            this._extractErrorMessage(
              error,
              'Unable to load user sessions.',
            ),
          );
        },
      });
  }

  private _executeUnban(userId: string): void {
    this.updatingBanUserId.set(userId);
    this._adminService
      .unbanUser(userId)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (): void => {
          this.updatingBanUserId.set(undefined);
          this._toast.success('User unbanned.');
          this.loadUsers();
        },
        error: (error: unknown): void => {
          this.updatingBanUserId.set(undefined);
          this._toast.error(
            this._extractErrorMessage(
              error,
              'Unable to unban user.',
            ),
          );
        },
      });
  }

  private _executeRevokeSession(
    sessionToken: string,
  ): void {
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
          this._toast.error(
            this._extractErrorMessage(
              error,
              'Unable to revoke session.',
            ),
          );
        },
      });
  }

  private _executeRevokeAllSessions(userId: string): void {
    this.isRevokingAllSessions.set(true);
    this._adminService
      .revokeUserSessions(userId)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (): void => {
          this.isRevokingAllSessions.set(false);
          this._loadSessionsForSelectedUser();
        },
        error: (error: unknown): void => {
          this.isRevokingAllSessions.set(false);
          this._toast.error(
            this._extractErrorMessage(
              error,
              'Unable to revoke all user sessions.',
            ),
          );
        },
      });
  }

  private _handleGlobalModalKeydown(
    event: KeyboardEvent,
  ): void {
    if (this.activeModal() === 'none') return;

    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeModal();
      return;
    }

    if (
      event.key !== 'Enter' ||
      event.defaultPrevented ||
      event.target instanceof HTMLTextAreaElement
    ) {
      return;
    }

    if (this.activeModal() === 'detail') {
      event.preventDefault();
      this.closeModal();
      return;
    }

    if (this.activeModal() === 'delete') {
      event.preventDefault();
      this.deleteSelectedUser();
      return;
    }

    if (this.activeModal() === 'impersonate') {
      event.preventDefault();
      this.confirmImpersonation();
    }
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
