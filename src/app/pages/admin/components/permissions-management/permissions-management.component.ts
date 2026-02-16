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
import { AdminService } from '../../../../common/admin/admin.service';
import { AppDialogService } from '../../../../common/services/app-dialog.service';
import { ToastService } from '../../../../common/services/toast.service';
import {
  AdminPermission,
  SortDirection,
} from '../../../../common/admin/models/admin.model';
import {
  PermissionDeleteDialogComponent,
  PermissionDeleteDialogResult,
} from './dialogs/permission-delete-dialog/permission-delete-dialog.component';
import {
  PermissionFormDialogComponent,
  PermissionFormDialogResult,
} from './dialogs/permission-form-dialog/permission-form-dialog.component';

type PermissionSortColumn = 'code' | 'name' | 'description';

@Component({
  selector: 'app-permissions-management',
  imports: [ReactiveFormsModule],
  templateUrl: './permissions-management.component.html',
  styleUrl: './permissions-management.component.scss',
})
export class PermissionsManagementComponent {
  private readonly _destroyRef: DestroyRef =
    inject(DestroyRef);
  private readonly _adminService: AdminService =
    inject(AdminService);
  private readonly _dialogService: AppDialogService =
    inject(AppDialogService);
  private readonly _toast: ToastService =
    inject(ToastService);

  public readonly permissions: WritableSignal<
    AdminPermission[]
  > = signal<AdminPermission[]>([]);
  public readonly isLoading: WritableSignal<boolean> =
    signal<boolean>(true);
  public readonly sortColumn: WritableSignal<
    PermissionSortColumn | undefined
  > = signal<PermissionSortColumn | undefined>('code');
  public readonly sortDirection: WritableSignal<
    SortDirection | undefined
  > = signal<SortDirection | undefined>('asc');

  public readonly searchControl = new FormControl('', {
    nonNullable: true,
  });

  public readonly filteredPermissions = computed(
    (): AdminPermission[] => {
      const searchTerm: string = this.searchControl.value
        .trim()
        .toLowerCase();

      let result: AdminPermission[] = this.permissions();
      if (searchTerm) {
        result = result.filter(
          (permission: AdminPermission): boolean => {
            const descriptionText =
              permission.description?.toLowerCase() ?? '';
            return (
              permission.code
                .toLowerCase()
                .includes(searchTerm) ||
              permission.name
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
          firstPermission: AdminPermission,
          secondPermission: AdminPermission,
        ): number => {
          const firstValue = (
            firstPermission[sortColumn] ?? ''
          ).toLowerCase();
          const secondValue = (
            secondPermission[sortColumn] ?? ''
          ).toLowerCase();

          if (firstValue < secondValue) {
            return sortDirection === 'asc' ? -1 : 1;
          }
          if (firstValue > secondValue) {
            return sortDirection === 'asc' ? 1 : -1;
          }
          return 0;
        },
      );
    },
  );

  constructor() {
    this.loadPermissions();
  }

  public loadPermissions(): void {
    this.isLoading.set(true);

    this._adminService
      .listPermissions()
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (permissions: AdminPermission[]): void => {
          this.permissions.set(permissions);
          this.isLoading.set(false);
        },
        error: (error: unknown): void => {
          this.isLoading.set(false);
          this._toast.error(
            this._extractErrorMessage(
              error,
              'Unable to load permissions.',
            ),
          );
        },
      });
  }

  public toggleSort(column: PermissionSortColumn): void {
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
        PermissionFormDialogResult,
        { mode: 'create' },
        PermissionFormDialogComponent
      >(PermissionFormDialogComponent, {
        width: 'min(100vw - 2rem, 46rem)',
        maxWidth: '46rem',
        data: { mode: 'create' },
      })
      .closed.pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(
        (
          result: PermissionFormDialogResult | undefined,
        ): void => {
          if (result?.saved) {
            this.loadPermissions();
          }
        },
      );
  }

  public openEdit(permission: AdminPermission): void {
    this._dialogService
      .open<
        PermissionFormDialogResult,
        { mode: 'edit'; permission: AdminPermission },
        PermissionFormDialogComponent
      >(PermissionFormDialogComponent, {
        width: 'min(100vw - 2rem, 46rem)',
        maxWidth: '46rem',
        data: {
          mode: 'edit',
          permission: permission,
        },
      })
      .closed.pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(
        (
          result: PermissionFormDialogResult | undefined,
        ): void => {
          if (result?.saved) {
            this.loadPermissions();
          }
        },
      );
  }

  public openDelete(permission: AdminPermission): void {
    this._dialogService
      .open<
        PermissionDeleteDialogResult,
        { permission: AdminPermission },
        PermissionDeleteDialogComponent
      >(PermissionDeleteDialogComponent, {
        width: 'min(100vw - 2rem, 36rem)',
        maxWidth: '36rem',
        data: { permission: permission },
      })
      .closed.pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(
        (
          result: PermissionDeleteDialogResult | undefined,
        ): void => {
          if (result?.deleted) {
            this.loadPermissions();
          }
        },
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
