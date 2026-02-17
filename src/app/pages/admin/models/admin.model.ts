export type SortDirection = 'asc' | 'desc';

export type AdminPermission = {
  id: number;
  code: string;
  name: string;
  description?: string | null;
};

export type AdminRole = {
  id: number;
  name: string;
  description?: string | null;
  permissions?: AdminPermission[];
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  role: 'user' | 'admin' | string;
  roles: AdminRole[];
  permissions: AdminPermission[];
  twoFactorEnabled: boolean;
  banned: boolean;
  banReason?: string | null;
  banExpires?: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
};

export type PagedUsersResponse = {
  users: AdminUser[];
  total: number;
  limit?: number;
  offset?: number;
};

export type ListUsersQuery = {
  searchValue?: string;
  searchField?: 'email' | 'name';
  searchOperator?: 'contains' | 'starts_with' | 'ends_with';
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortDirection?: SortDirection;
  filterField?: string;
  filterValue?: string | number | boolean;
  filterOperator?:
    | 'eq'
    | 'ne'
    | 'lt'
    | 'lte'
    | 'gt'
    | 'gte';
};

export type UserUpsertPayload = {
  name: string;
  email: string;
  emailVerified?: boolean;
  password?: string;
  image?: string;
  role: 'user' | 'admin' | ('user' | 'admin')[];
  roleIds: number[];
};

export type RoleUpsertPayload = {
  name: string;
  description?: string;
  permissionIds: number[];
};

export type PermissionUpsertPayload = {
  code: string;
  name: string;
  description?: string;
};

export type AdminUserSession = {
  id: string;
  userId: string;
  token: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  expiresAt: string | Date;
  ipAddress?: string | null;
  userAgent?: string | null;
};
