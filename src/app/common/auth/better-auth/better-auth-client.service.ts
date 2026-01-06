import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import {
  adminClient,
  jwtClient,
  magicLinkClient,
  twoFactorClient,
} from 'better-auth/client/plugins';
import { passkeyClient } from '@better-auth/passkey/client';
import { ac, admin, user } from './permissions';
import { createAuthClient } from 'better-auth/client';

@Injectable({
  providedIn: 'root',
})
export class BetterAuthClientService {
  private readonly _authClient = createAuthClient({
    baseURL: environment.betterAuthBaseURL,
    plugins: [
      twoFactorClient(),
      jwtClient(),
      passkeyClient(),
      magicLinkClient(),
      adminClient({
        ac,
        roles: {
          admin,
          user,
        },
      }),
    ],
  });

  public getClient() {
    return this._authClient;
  }
}
