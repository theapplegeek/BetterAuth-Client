import { DatePipe } from '@angular/common';
import {
  Component,
  computed,
  inject,
  Signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { UserService } from '../../common/user/user.service';
import { User } from '../../common/user/models/user.type';
import {
  TodoItem,
  TodoService,
} from '../todos/services/todo.service';

type SecurityCheck = {
  id: 'email' | '2fa' | 'status';
  label: string;
  description: string;
  completed: boolean;
};

type QuickAction = {
  id: string;
  title: string;
  description: string;
  route: string;
  icon: string;
  ctaLabel: string;
};

@Component({
  selector: 'app-profile',
  imports: [RouterLink, DatePipe],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent {
  private readonly _userService: UserService =
    inject(UserService);
  private readonly _todoService: TodoService =
    inject(TodoService);

  public readonly user: Signal<User | undefined> = computed(
    (): User | undefined => this._userService.user(),
  );

  public readonly tasks: Signal<TodoItem[]> = computed(
    (): TodoItem[] => this._todoService.tasks(),
  );

  public readonly totalTasks: Signal<number> = computed(
    (): number => this.tasks().length,
  );

  public readonly completedTasks: Signal<number> = computed(
    (): number =>
      this.tasks().filter(
        (task: TodoItem): boolean => task.completed,
      ).length,
  );

  public readonly openTasks: Signal<number> = computed(
    (): number =>
      this.tasks().filter(
        (task: TodoItem): boolean => !task.completed,
      ).length,
  );

  public readonly highPriorityOpenTasks: Signal<number> =
    computed(
      (): number =>
        this.tasks().filter(
          (task: TodoItem): boolean =>
            !task.completed && task.priority === 'high',
        ).length,
    );

  public readonly completionRate: Signal<number> = computed(
    (): number => {
      const total = this.totalTasks();
      if (total === 0) return 0;
      return Math.round(
        (this.completedTasks() / total) * 100,
      );
    },
  );

  public readonly recentCompletedTasks: Signal<TodoItem[]> =
    computed((): TodoItem[] => {
      return this.tasks()
        .filter(
          (task: TodoItem): boolean =>
            task.completed &&
            typeof task.completedAt === 'string',
        )
        .sort((a: TodoItem, b: TodoItem): number => {
          return (
            new Date(b.completedAt as string).getTime() -
            new Date(a.completedAt as string).getTime()
          );
        })
        .slice(0, 4);
    });

  public readonly roles: Signal<string[]> = computed(
    (): string[] => {
      const currentUser = this.user();
      if (!currentUser) return [];

      const normalizedRoles = currentUser.roles.filter(
        (value): value is string =>
          typeof value === 'string' &&
          value.trim().length > 0,
      );

      return Array.from(new Set(normalizedRoles));
    },
  );

  public readonly userInitials: Signal<string> = computed(
    (): string => {
      const currentUser = this.user();
      if (!currentUser) return 'GU';

      const parts = currentUser.name
        .trim()
        .split(/\s+/)
        .filter((value: string): boolean => value.length > 0);

      if (parts.length === 0) return 'GU';

      if (parts.length === 1) {
        return parts[0].slice(0, 2).toUpperCase();
      }

      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    },
  );

  public readonly securityChecks: Signal<SecurityCheck[]> =
    computed((): SecurityCheck[] => {
      const currentUser = this.user();
      if (!currentUser) return [];

      return [
        {
          id: 'email',
          label: 'Email verification',
          description: currentUser.emailVerified
            ? 'Email address verified.'
            : 'Please verify your email address.',
          completed: currentUser.emailVerified,
        },
        {
          id: '2fa',
          label: 'Two-factor authentication',
          description: currentUser.twoFactorEnabled
            ? '2FA is enabled and protecting sign-in.'
            : 'Enable 2FA for stronger protection.',
          completed: currentUser.twoFactorEnabled,
        },
        {
          id: 'status',
          label: 'Account status',
          description: currentUser.banned
            ? 'This account is currently restricted.'
            : 'Account is active and in good standing.',
          completed: !currentUser.banned,
        },
      ];
    });

  public readonly securityScore: Signal<number> = computed(
    (): number => {
      const checks = this.securityChecks();
      if (checks.length === 0) return 0;

      const completedChecks = checks.filter(
        (check: SecurityCheck): boolean => check.completed,
      ).length;

      return Math.round(
        (completedChecks / checks.length) * 100,
      );
    },
  );

  public readonly quickActions: QuickAction[] = [
    {
      id: 'account',
      title: 'Edit account details',
      description:
        'Update your name, email, and personal preferences.',
      route: '/settings/account',
      icon: 'icon-[heroicons--identification]',
      ctaLabel: 'Open Account',
    },
    {
      id: 'security',
      title: 'Review security',
      description:
        'Manage password, sessions, social links, and 2FA.',
      route: '/settings/security',
      icon: 'icon-[heroicons--shield-check]',
      ctaLabel: 'Open Security',
    },
    {
      id: 'tasks',
      title: 'Go to task board',
      description:
        'Plan and complete your personal work items.',
      route: '/todos',
      icon: 'icon-[heroicons--clipboard-document-list]',
      ctaLabel: 'Open Tasks',
    },
  ];
}
