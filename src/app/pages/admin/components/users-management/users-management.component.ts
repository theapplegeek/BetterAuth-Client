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
} from '@angular/forms';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminHttpService } from '../../http/admin.http.server';
import { AppDialogService } from '../../../../common/services/app-dialog.service';
import { ToastService } from '../../../../common/services/toast.service';
import {
  AdminRole,
  AdminUser,
  ListUsersQuery,
  SortDirection,
} from '../../models/admin.model';
import {
  UserBanDialogComponent,
  UserBanDialogResult,
} from './dialogs/user-ban-dialog/user-ban-dialog.component';
import {
  UserDeleteDialogComponent,
  UserDeleteDialogResult,
} from './dialogs/user-delete-dialog/user-delete-dialog.component';
import { UserDetailDialogComponent } from './dialogs/user-detail-dialog/user-detail-dialog.component';
import {
  UserFormDialogComponent,
  UserFormDialogResult,
} from './dialogs/user-form-dialog/user-form-dialog.component';
import { UserImpersonateDialogComponent } from './dialogs/user-impersonate-dialog/user-impersonate-dialog.component';
import {
  UserPasswordDialogComponent,
  UserPasswordDialogResult,
} from './dialogs/user-password-dialog/user-password-dialog.component';
import {
  UserSessionsDialogComponent,
  UserSessionsDialogResult,
} from './dialogs/user-sessions-dialog/user-sessions-dialog.component';
import {
  UserUnbanDialogComponent,
  UserUnbanDialogResult,
} from './dialogs/user-unban-dialog/user-unban-dialog.component';
import {
  ConnectedPosition,
  OverlayModule,
} from '@angular/cdk/overlay';

type UserSortColumn = 'name' | 'email' | 'role';

@Component({
  selector: 'app-users-management',
  imports: [ReactiveFormsModule, DatePipe, OverlayModule],
  templateUrl: './users-management.component.html',
  styleUrl: './users-management.component.scss',
})
export class UsersManagementComponent {
  private readonly _destroyRef: DestroyRef =
    inject(DestroyRef);
  private readonly _adminService: AdminHttpService =
    inject(AdminHttpService);
  private readonly _dialogService: AppDialogService =
    inject(AppDialogService);
  private readonly _toast: ToastService =
    inject(ToastService);

  public readonly users: WritableSignal<AdminUser[]> =
    signal<AdminUser[]>([]);
  public readonly roles: WritableSignal<AdminRole[]> =
    signal<AdminRole[]>([]);
  public readonly openActionMenuUserId: WritableSignal<
    string | undefined
  > = signal<string | undefined>(undefined);

  public readonly isLoadingUsers: WritableSignal<boolean> =
    signal<boolean>(true);

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
  public readonly actionMenuPositions: ConnectedPosition[] =
    [
      {
        originX: 'start',
        originY: 'bottom',
        overlayX: 'start',
        overlayY: 'top',
        offsetY: 8,
      },
      {
        originX: 'end',
        originY: 'bottom',
        overlayX: 'end',
        overlayY: 'top',
        offsetY: 8,
      },
      {
        originX: 'start',
        originY: 'top',
        overlayX: 'start',
        overlayY: 'bottom',
        offsetY: -8,
      },
      {
        originX: 'end',
        originY: 'top',
        overlayX: 'end',
        overlayY: 'bottom',
        offsetY: -8,
      },
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
    this._dialogService.open<void, { user: AdminUser }, UserDetailDialogComponent>(
      UserDetailDialogComponent,
      {
        width: 'min(100vw - 2rem, 56rem)',
        maxWidth: '56rem',
        data: { user: user },
      },
    );
  }

  public openCreate(): void {
    this.closeActionMenu();
    this._dialogService
      .open<
        UserFormDialogResult,
        { mode: 'create'; roles: AdminRole[] },
        UserFormDialogComponent
      >(UserFormDialogComponent, {
        width: 'min(100vw - 2rem, 64rem)',
        maxWidth: '64rem',
        data: {
          mode: 'create',
          roles: this.roles(),
        },
      })
      .closed.pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(
        (result: UserFormDialogResult | undefined): void => {
          if (result?.saved) {
            this.loadUsers();
          }
        },
      );
  }

  public openEdit(user: AdminUser): void {
    this.closeActionMenu();
    this._dialogService
      .open<
        UserFormDialogResult,
        { mode: 'edit'; user: AdminUser; roles: AdminRole[] },
        UserFormDialogComponent
      >(UserFormDialogComponent, {
        width: 'min(100vw - 2rem, 64rem)',
        maxWidth: '64rem',
        data: {
          mode: 'edit',
          user: user,
          roles: this.roles(),
        },
      })
      .closed.pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(
        (result: UserFormDialogResult | undefined): void => {
          if (result?.saved) {
            this.loadUsers();
          }
        },
      );
  }

  public openPasswordEditor(user: AdminUser): void {
    this.closeActionMenu();
    this._dialogService
      .open<
        UserPasswordDialogResult,
        { user: AdminUser },
        UserPasswordDialogComponent
      >(UserPasswordDialogComponent, {
        width: 'min(100vw - 2rem, 36rem)',
        maxWidth: '36rem',
        data: { user: user },
      })
      .closed.pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe();
  }

  public openBanModal(user: AdminUser): void {
    this.closeActionMenu();
    this._dialogService
      .open<
        UserBanDialogResult,
        { user: AdminUser },
        UserBanDialogComponent
      >(UserBanDialogComponent, {
        width: 'min(100vw - 2rem, 40rem)',
        maxWidth: '40rem',
        data: { user: user },
      })
      .closed.pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(
        (result: UserBanDialogResult | undefined): void => {
          if (result?.banned) {
            this.loadUsers();
          }
        },
      );
  }

  public openSessions(user: AdminUser): void {
    this.closeActionMenu();
    this._dialogService
      .open<
        UserSessionsDialogResult,
        { user: AdminUser },
        UserSessionsDialogComponent
      >(UserSessionsDialogComponent, {
        width: 'min(100vw - 2rem, 56rem)',
        maxWidth: '56rem',
        data: { user: user },
      })
      .closed.pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(
        (result: UserSessionsDialogResult | undefined): void => {
          if (result?.updated) {
            this.loadUsers();
          }
        },
      );
  }

  public openDelete(user: AdminUser): void {
    this.closeActionMenu();
    this._dialogService
      .open<
        UserDeleteDialogResult,
        { user: AdminUser },
        UserDeleteDialogComponent
      >(UserDeleteDialogComponent, {
        width: 'min(100vw - 2rem, 36rem)',
        maxWidth: '36rem',
        data: { user: user },
      })
      .closed.pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(
        (
          result: UserDeleteDialogResult | undefined,
        ): void => {
          if (result?.deleted) {
            this.loadUsers();
          }
        },
      );
  }

  public openImpersonateModal(user: AdminUser): void {
    this.closeActionMenu();
    if (user.banned) {
      this._toast.warning(
        'Cannot impersonate a banned user.',
      );
      return;
    }

    this._dialogService.open<
      void,
      { user: AdminUser },
      UserImpersonateDialogComponent
    >(UserImpersonateDialogComponent, {
      width: 'min(100vw - 2rem, 36rem)',
      maxWidth: '36rem',
      data: { user: user },
    });
  }

  public unbanUser(user: AdminUser): void {
    this.closeActionMenu();
    this._dialogService
      .open<
        UserUnbanDialogResult,
        { user: AdminUser },
        UserUnbanDialogComponent
      >(UserUnbanDialogComponent, {
        width: 'min(100vw - 2rem, 36rem)',
        maxWidth: '36rem',
        data: { user: user },
      })
      .closed.pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(
        (result: UserUnbanDialogResult | undefined): void => {
          if (result?.unbanned) {
            this.loadUsers();
          }
        },
      );
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

  public isBetterAuthAdmin(user: AdminUser): boolean {
    return user.role === 'admin';
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
