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
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminService } from '../../../../common/admin/admin.service';
import { ToastService } from '../../../../common/services/toast.service';
import {
  AdminPermission,
  PermissionUpsertPayload,
  SortDirection,
} from '../../../../common/admin/models/admin.model';

type PermissionModal =
  | 'none'
  | 'create'
  | 'edit'
  | 'delete';
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
  private readonly _toast: ToastService =
    inject(ToastService);

  public readonly permissions: WritableSignal<
    AdminPermission[]
  > = signal<AdminPermission[]>([]);
  public readonly selectedPermission: WritableSignal<
    AdminPermission | undefined
  > = signal<AdminPermission | undefined>(undefined);
  public readonly activeModal: WritableSignal<PermissionModal> =
    signal<PermissionModal>('none');
  public readonly isLoading: WritableSignal<boolean> =
    signal<boolean>(true);
  public readonly isSaving: WritableSignal<boolean> =
    signal<boolean>(false);
  public readonly isDeleting: WritableSignal<boolean> =
    signal<boolean>(false);
  public readonly sortColumn: WritableSignal<
    PermissionSortColumn | undefined
  > = signal<PermissionSortColumn | undefined>('code');
  public readonly sortDirection: WritableSignal<
    SortDirection | undefined
  > = signal<SortDirection | undefined>('asc');

  public readonly searchControl = new FormControl('', {
    nonNullable: true,
  });
  public readonly permissionForm = new FormGroup({
    code: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    description: new FormControl('', {
      nonNullable: true,
    }),
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
    this.selectedPermission.set(undefined);
    this.permissionForm.reset({
      code: '',
      name: '',
      description: '',
    });
    this.activeModal.set('create');
  }

  public openEdit(permission: AdminPermission): void {
    this.selectedPermission.set(permission);
    this.permissionForm.reset({
      code: permission.code,
      name: permission.name,
      description: permission.description ?? '',
    });
    this.activeModal.set('edit');
  }

  public openDelete(permission: AdminPermission): void {
    this.selectedPermission.set(permission);
    this.activeModal.set('delete');
  }

  public closeModal(): void {
    this.activeModal.set('none');
  }

  public onModalKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeModal();
      return;
    }

    if (
      event.key === 'Enter' &&
      this.activeModal() === 'delete'
    ) {
      event.preventDefault();
      this.deletePermission();
    }
  }

  public savePermission(): void {
    const mode = this.activeModal();
    if (mode !== 'create' && mode !== 'edit') return;

    if (this.permissionForm.invalid) {
      this.permissionForm.markAllAsTouched();
      return;
    }

    const formValue = this.permissionForm.getRawValue();
    const payload: PermissionUpsertPayload = {
      code: formValue.code.trim(),
      name: formValue.name.trim(),
      description:
        formValue.description.trim() || undefined,
    };

    this.isSaving.set(true);

    if (mode === 'create') {
      this._adminService
        .createPermission(payload)
        .pipe(takeUntilDestroyed(this._destroyRef))
        .subscribe({
          next: (): void => {
            this.isSaving.set(false);
            this.closeModal();
            this._toast.success(
              'Permission created successfully.',
            );
            this.loadPermissions();
          },
          error: (error: unknown): void => {
            this.isSaving.set(false);
            this._toast.error(
              this._extractErrorMessage(
                error,
                'Unable to create permission.',
              ),
            );
          },
        });
      return;
    }

    const selectedPermission = this.selectedPermission();
    if (!selectedPermission) {
      this.isSaving.set(false);
      return;
    }

    this._adminService
      .updatePermission(selectedPermission.id, payload)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (): void => {
          this.isSaving.set(false);
          this.closeModal();
          this._toast.success(
            'Permission updated successfully.',
          );
          this.loadPermissions();
        },
        error: (error: unknown): void => {
          this.isSaving.set(false);
          this._toast.error(
            this._extractErrorMessage(
              error,
              'Unable to update permission.',
            ),
          );
        },
      });
  }

  public deletePermission(): void {
    const selectedPermission = this.selectedPermission();
    if (!selectedPermission) return;

    this.isDeleting.set(true);
    this._adminService
      .deletePermission(selectedPermission.id)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (): void => {
          this.isDeleting.set(false);
          this.closeModal();
          this._toast.success(
            'Permission deleted successfully.',
          );
          this.loadPermissions();
        },
        error: (error: unknown): void => {
          this.isDeleting.set(false);
          this._toast.error(
            this._extractErrorMessage(
              error,
              'Unable to delete permission.',
            ),
          );
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
