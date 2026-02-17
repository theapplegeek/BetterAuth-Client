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
  ReactiveFormsModule,
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminHttpService } from '../../http/admin-http.service';
import { AppDialogService } from '../../../../common/services/app-dialog.service';
import { ToastService } from '../../../../common/services/toast.service';
import {
  AdminPermission,
  AdminRole,
  SortDirection,
} from '../../../../common/admin/models/admin.model';
import {
  RoleDeleteDialogComponent,
  RoleDeleteDialogResult,
} from './dialogs/role-delete-dialog/role-delete-dialog.component';
import {
  RoleFormDialogComponent,
  RoleFormDialogResult,
} from './dialogs/role-form-dialog/role-form-dialog.component';

type RoleSortColumn = 'name' | 'description';

@Component({
  selector: 'app-roles-management',
  imports: [ReactiveFormsModule],
  templateUrl: './roles-management.component.html',
  styleUrl: './roles-management.component.scss',
})
export class RolesManagementComponent {
  private readonly _destroyRef: DestroyRef =
    inject(DestroyRef);
  private readonly _adminService: AdminHttpService =
    inject(AdminHttpService);
  private readonly _dialogService: AppDialogService =
    inject(AppDialogService);
  private readonly _toast: ToastService =
    inject(ToastService);

  public readonly roles: WritableSignal<AdminRole[]> =
    signal<AdminRole[]>([]);
  public readonly permissions: WritableSignal<
    AdminPermission[]
  > = signal<AdminPermission[]>([]);
  public readonly isLoading: WritableSignal<boolean> =
    signal<boolean>(true);
  public readonly sortColumn: WritableSignal<
    RoleSortColumn | undefined
  > = signal<RoleSortColumn | undefined>('name');
  public readonly sortDirection: WritableSignal<
    SortDirection | undefined
  > = signal<SortDirection | undefined>('asc');

  public readonly searchControl = new FormControl('', {
    nonNullable: true,
  });

  public readonly filteredRoles = computed(
    (): AdminRole[] => {
      const searchTerm: string = this.searchControl.value
        .trim()
        .toLowerCase();

      let result: AdminRole[] = this.roles();
      if (searchTerm) {
        result = result.filter(
          (role: AdminRole): boolean => {
            const descriptionText =
              role.description?.toLowerCase() ?? '';
            return (
              role.name
                .toLowerCase()
                .includes(searchTerm) ||
              descriptionText.includes(searchTerm)
            );
          },
        );
      }

      const sortColumn = this.sortColumn();
      const sortDirection = this.sortDirection();

      if (!sortColumn || !sortDirection) {
        return result;
      }

      return [...result].sort(
        (
          firstRole: AdminRole,
          secondRole: AdminRole,
        ): number => {
          const firstValue =
            sortColumn === 'description'
              ? (firstRole.description ?? '')
              : firstRole.name;
          const secondValue =
            sortColumn === 'description'
              ? (secondRole.description ?? '')
              : secondRole.name;

          const normalizedFirst = firstValue.toLowerCase();
          const normalizedSecond =
            secondValue.toLowerCase();

          if (normalizedFirst < normalizedSecond) {
            return sortDirection === 'asc' ? -1 : 1;
          }
          if (normalizedFirst > normalizedSecond) {
            return sortDirection === 'asc' ? 1 : -1;
          }
          return 0;
        },
      );
    },
  );

  constructor() {
    this.loadData();
  }

  public loadData(): void {
    this.isLoading.set(true);

    this._adminService
      .listRolesWithPermissions()
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (roles: AdminRole[]): void => {
          this.roles.set(roles);
          this.isLoading.set(false);
        },
        error: (error: unknown): void => {
          this.isLoading.set(false);
          this._toast.error(
            this._extractErrorMessage(
              error,
              'Unable to load roles.',
            ),
          );
        },
      });

    this._adminService
      .listPermissions()
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (permissions: AdminPermission[]): void => {
          this.permissions.set(permissions);
        },
        error: (): void => {
          this.permissions.set([]);
        },
      });
  }

  public toggleSort(column: RoleSortColumn): void {
    if (this.sortColumn() !== column) {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
      return;
    }

    if (this.sortDirection() === 'asc') {
      this.sortDirection.set('desc');
      return;
    }

    if (this.sortDirection() === 'desc') {
      this.sortColumn.set(undefined);
      this.sortDirection.set(undefined);
      return;
    }

    this.sortDirection.set('asc');
  }

  public openCreate(): void {
    this._dialogService
      .open<
        RoleFormDialogResult,
        { mode: 'create'; permissions: AdminPermission[] },
        RoleFormDialogComponent
      >(RoleFormDialogComponent, {
        width: 'min(100vw - 2rem, 56rem)',
        maxWidth: '56rem',
        data: {
          mode: 'create',
          permissions: this.permissions(),
        },
      })
      .closed.pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(
        (result: RoleFormDialogResult | undefined): void => {
          if (result?.saved) {
            this.loadData();
          }
        },
      );
  }

  public openEdit(role: AdminRole): void {
    this._dialogService
      .open<
        RoleFormDialogResult,
        {
          mode: 'edit';
          role: AdminRole;
          permissions: AdminPermission[];
        },
        RoleFormDialogComponent
      >(RoleFormDialogComponent, {
        width: 'min(100vw - 2rem, 56rem)',
        maxWidth: '56rem',
        data: {
          mode: 'edit',
          role: role,
          permissions: this.permissions(),
        },
      })
      .closed.pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(
        (result: RoleFormDialogResult | undefined): void => {
          if (result?.saved) {
            this.loadData();
          }
        },
      );
  }

  public openDelete(role: AdminRole): void {
    this._dialogService
      .open<
        RoleDeleteDialogResult,
        { role: AdminRole },
        RoleDeleteDialogComponent
      >(RoleDeleteDialogComponent, {
        width: 'min(100vw - 2rem, 36rem)',
        maxWidth: '36rem',
        data: { role: role },
      })
      .closed.pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(
        (
          result: RoleDeleteDialogResult | undefined,
        ): void => {
          if (result?.deleted) {
            this.loadData();
          }
        },
      );
  }

  public rolePermissionSummary(role: AdminRole): string {
    return (
      role.permissions
        ?.map(
          (permission: AdminPermission): string =>
            permission.code,
        )
        .join(', ') ?? ''
    );
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
