import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { from, map, Observable } from 'rxjs';
import { BetterAuthClientService } from '../auth/better-auth/better-auth-client.service';
import {
  AdminPermission,
  AdminRole,
  AdminUserSession,
  ListUsersQuery,
  PagedUsersResponse,
  PermissionUpsertPayload,
  RoleUpsertPayload,
  UserUpsertPayload,
} from './models/admin.model';

type BetterAuthError = {
  message?: string;
  code?: string;
  status?: number;
  statusText?: string;
};

type BetterAuthResult<TData> = {
  data: TData | null;
  error: BetterAuthError | null;
};

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private readonly _http: HttpClient = inject(HttpClient);
  private readonly _authClient = inject(
    BetterAuthClientService,
  ).getClient();

  private readonly _baseURL: string =
    environment.betterAuthBaseURL;

  public listUsers(
    query: ListUsersQuery,
  ): Observable<PagedUsersResponse> {
    return this._http.get<PagedUsersResponse>(
      `${this._baseURL}/api/admin/user`,
      {
        withCredentials: true,
        params: this._toQueryParams(query),
      },
    );
  }

  public createUser(
    payload: UserUpsertPayload,
  ): Observable<void> {
    return this._http
      .post<void>(
        `${this._baseURL}/api/admin/user`,
        payload,
        {
          withCredentials: true,
        },
      )
      .pipe(map((): void => undefined));
  }

  public updateUser(
    userId: string,
    payload: UserUpsertPayload,
  ): Observable<void> {
    return this._http
      .put<void>(
        `${this._baseURL}/api/admin/user/${userId}`,
        payload,
        {
          withCredentials: true,
        },
      )
      .pipe(map((): void => undefined));
  }

  public listRoles(): Observable<AdminRole[]> {
    return this._http.get<AdminRole[]>(
      `${this._baseURL}/api/admin/role`,
      {
        withCredentials: true,
      },
    );
  }

  public listRolesWithPermissions(): Observable<
    AdminRole[]
  > {
    return this._http.get<AdminRole[]>(
      `${this._baseURL}/api/admin/role/permissions`,
      {
        withCredentials: true,
      },
    );
  }

  public createRole(
    payload: RoleUpsertPayload,
  ): Observable<void> {
    return this._http
      .post<void>(
        `${this._baseURL}/api/admin/role`,
        payload,
        {
          withCredentials: true,
        },
      )
      .pipe(map((): void => undefined));
  }

  public updateRole(
    roleId: number,
    payload: RoleUpsertPayload,
  ): Observable<void> {
    return this._http
      .put<void>(
        `${this._baseURL}/api/admin/role/${roleId}`,
        payload,
        {
          withCredentials: true,
        },
      )
      .pipe(map((): void => undefined));
  }

  public deleteRole(roleId: number): Observable<void> {
    return this._http
      .delete<void>(
        `${this._baseURL}/api/admin/role/${roleId}`,
        {
          withCredentials: true,
        },
      )
      .pipe(map((): void => undefined));
  }

  public listPermissions(): Observable<AdminPermission[]> {
    return this._http.get<AdminPermission[]>(
      `${this._baseURL}/api/admin/permission`,
      {
        withCredentials: true,
      },
    );
  }

  public createPermission(
    payload: PermissionUpsertPayload,
  ): Observable<void> {
    return this._http
      .post<void>(
        `${this._baseURL}/api/admin/permission`,
        payload,
        {
          withCredentials: true,
        },
      )
      .pipe(map((): void => undefined));
  }

  public updatePermission(
    permissionId: number,
    payload: PermissionUpsertPayload,
  ): Observable<void> {
    return this._http
      .put<void>(
        `${this._baseURL}/api/admin/permission/${permissionId}`,
        payload,
        {
          withCredentials: true,
        },
      )
      .pipe(map((): void => undefined));
  }

  public deletePermission(
    permissionId: number,
  ): Observable<void> {
    return this._http
      .delete<void>(
        `${this._baseURL}/api/admin/permission/${permissionId}`,
        {
          withCredentials: true,
        },
      )
      .pipe(map((): void => undefined));
  }

  public setUserPassword(
    userId: string,
    newPassword: string,
  ): Observable<void> {
    return this._fromAuthResult<unknown>(
      this._authClient.admin.setUserPassword({
        userId: userId,
        newPassword: newPassword,
      }),
    ).pipe(map((): void => undefined));
  }

  public banUser(
    userId: string,
    reason: string,
    banExpiresIn?: number,
  ): Observable<void> {
    return this._fromAuthResult<unknown>(
      this._authClient.admin.banUser({
        userId: userId,
        banReason: reason,
        banExpiresIn: banExpiresIn,
      }),
    ).pipe(map((): void => undefined));
  }

  public unbanUser(userId: string): Observable<void> {
    return this._fromAuthResult<unknown>(
      this._authClient.admin.unbanUser({
        userId: userId,
      }),
    ).pipe(map((): void => undefined));
  }

  public impersonateUser(userId: string): Observable<void> {
    return this._fromAuthResult<unknown>(
      this._authClient.admin.impersonateUser({
        userId: userId,
      }),
    ).pipe(map((): void => undefined));
  }

  public removeUser(userId: string): Observable<void> {
    return this._fromAuthResult<unknown>(
      this._authClient.admin.removeUser({
        userId: userId,
      }),
    ).pipe(map((): void => undefined));
  }

  public listUserSessions(
    userId: string,
  ): Observable<AdminUserSession[]> {
    return this._fromAuthResult<{
      sessions: AdminUserSession[];
    }>(
      this._authClient.admin.listUserSessions({
        userId: userId,
      }),
    ).pipe(
      map(
        (response: {
          sessions: AdminUserSession[];
        }): AdminUserSession[] => response.sessions ?? [],
      ),
    );
  }

  public revokeUserSession(
    sessionToken: string,
  ): Observable<void> {
    return this._fromAuthResult<unknown>(
      this._authClient.admin.revokeUserSession({
        sessionToken: sessionToken,
      }),
    ).pipe(map((): void => undefined));
  }

  public revokeUserSessions(
    userId: string,
  ): Observable<void> {
    return this._fromAuthResult<unknown>(
      this._authClient.admin.revokeUserSessions({
        userId: userId,
      }),
    ).pipe(map((): void => undefined));
  }

  private _toQueryParams(
    query: ListUsersQuery,
  ): Record<string, string | number | boolean> {
    return Object.entries(query).reduce(
      (
        params: Record<string, string | number | boolean>,
        [key, value]: [
          string,
          string | number | boolean | undefined,
        ],
      ) => {
        if (value === undefined) return params;
        params[key] = value;
        return params;
      },
      {},
    );
  }

  private _fromAuthResult<TData>(
    promise: Promise<BetterAuthResult<TData>>,
  ): Observable<TData> {
    return from(promise).pipe(
      map((result: BetterAuthResult<TData>): TData => {
        if (result.error) {
          throw result.error;
        }

        if (result.data === null) {
          throw new Error(
            'Empty response from Better Auth',
          );
        }

        return result.data;
      }),
    );
  }
}
