import {
  Injectable,
  signal,
  WritableSignal,
} from '@angular/core';
import { User } from './models/user.type';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  public user: WritableSignal<User | undefined> = signal<
    User | undefined
  >(undefined);
}
