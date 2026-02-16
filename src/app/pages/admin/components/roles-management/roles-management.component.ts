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
  AdminRole,
  RoleUpsertPayload,
  SortDirection,
} from '../../../../common/admin/models/admin.model';

type RoleModal = 'none' | 'create' | 'edit' | 'delete';
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
  private readonly _adminService: AdminService =
    inject(AdminService);
  private readonly _toast: ToastService =
    inject(ToastService);

  public readonly roles: WritableSignal<AdminRole[]> =
    signal<AdminRole[]>([]);
  public readonly permissions: WritableSignal<
    AdminPermission[]
  > = signal<AdminPermission[]>([]);
  public readonly selectedRole: WritableSignal<
    AdminRole | undefined
  > = signal<AdminRole | undefined>(undefined);
  public readonly selectedPermissionIds: WritableSignal<
    number[]
  > = signal<number[]>([]);
  public readonly activeModal: WritableSignal<RoleModal> =
    signal<RoleModal>('none');
  public readonly isLoading: WritableSignal<boolean> =
    signal<boolean>(true);
  public readonly isSaving: WritableSignal<boolean> =
    signal<boolean>(false);
  public readonly isDeleting: WritableSignal<boolean> =
    signal<boolean>(false);
  public readonly sortColumn: WritableSignal<
    RoleSortColumn | undefined
  > = signal<RoleSortColumn | undefined>('name');
  public readonly sortDirection: WritableSignal<
    SortDirection | undefined
  > = signal<SortDirection | undefined>('asc');

  public readonly searchControl = new FormControl('', {
    nonNullable: true,
  });
  public readonly roleForm = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(2),
      ],
    }),
    description: new FormControl('', {
      nonNullable: true,
    }),
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
    this.selectedRole.set(undefined);
    this.roleForm.reset({
      name: '',
      description: '',
    });
    this.selectedPermissionIds.set([]);
    this.activeModal.set('create');
  }

  public openEdit(role: AdminRole): void {
    this.selectedRole.set(role);
    this.roleForm.reset({
      name: role.name,
      description: role.description ?? '',
    });
    this.selectedPermissionIds.set(
      role.permissions?.map(
        (permission: AdminPermission): number =>
          permission.id,
      ) ?? [],
    );
    this.activeModal.set('edit');
  }

  public openDelete(role: AdminRole): void {
    this.selectedRole.set(role);
    this.activeModal.set('delete');
  }

  public closeModal(): void {
    this.activeModal.set('none');
  }

  public togglePermission(
    permissionId: number,
    event: Event,
  ): void {
    const target = event.target as HTMLInputElement;
    const checked = target.checked;

    this.selectedPermissionIds.update(
      (selectedIds: number[]): number[] => {
        if (checked) {
          return Array.from(
            new Set([...selectedIds, permissionId]),
          );
        }

        return selectedIds.filter(
          (selectedId: number): boolean =>
            selectedId !== permissionId,
        );
      },
    );
  }

  public isPermissionSelected(
    permissionId: number,
  ): boolean {
    return this.selectedPermissionIds().includes(
      permissionId,
    );
  }

  public saveRole(): void {
    const mode = this.activeModal();
    if (mode !== 'create' && mode !== 'edit') return;

    if (this.roleForm.invalid) {
      this.roleForm.markAllAsTouched();
      return;
    }

    const formValue = this.roleForm.getRawValue();
    const payload: RoleUpsertPayload = {
      name: formValue.name.trim(),
      description:
        formValue.description.trim() || undefined,
      permissionIds: this.selectedPermissionIds(),
    };

    this.isSaving.set(true);

    if (mode === 'create') {
      this._adminService
        .createRole(payload)
        .pipe(takeUntilDestroyed(this._destroyRef))
        .subscribe({
          next: (): void => {
            this.isSaving.set(false);
            this.closeModal();
            this._toast.success(
              'Role created successfully.',
            );
            this.loadData();
          },
          error: (error: unknown): void => {
            this.isSaving.set(false);
            this._toast.error(
              this._extractErrorMessage(
                error,
                'Unable to create role.',
              ),
            );
          },
        });
      return;
    }

    const selectedRole = this.selectedRole();
    if (!selectedRole) {
      this.isSaving.set(false);
      return;
    }

    this._adminService
      .updateRole(selectedRole.id, payload)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (): void => {
          this.isSaving.set(false);
          this.closeModal();
          this._toast.success(
            'Role updated successfully.',
          );
          this.loadData();
        },
        error: (error: unknown): void => {
          this.isSaving.set(false);
          this._toast.error(
            this._extractErrorMessage(
              error,
              'Unable to update role.',
            ),
          );
        },
      });
  }

  public deleteRole(): void {
    const selectedRole = this.selectedRole();
    if (!selectedRole) return;

    this.isDeleting.set(true);
    this._adminService
      .deleteRole(selectedRole.id)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (): void => {
          this.isDeleting.set(false);
          this.closeModal();
          this._toast.success(
            'Role deleted successfully.',
          );
          this.loadData();
        },
        error: (error: unknown): void => {
          this.isDeleting.set(false);
          this._toast.error(
            this._extractErrorMessage(
              error,
              'Unable to delete role.',
            ),
          );
        },
      });
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
