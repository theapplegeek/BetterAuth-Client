import {
  Component,
  computed,
  DestroyRef,
  inject,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AppDialogService } from '../../common/services/app-dialog.service';
import {
  TodoItem,
  TodoPriority,
  TodoService,
} from '../../common/todo/todo.service';
import {
  ClearCompletedDialogComponent,
  ClearCompletedDialogResult,
} from './dialogs/clear-completed-dialog/clear-completed-dialog.component';

@Component({
  selector: 'app-completed-tasks',
  imports: [DatePipe],
  templateUrl: './completed-tasks.component.html',
  styleUrl: './completed-tasks.component.scss',
})
export class CompletedTasksComponent {
  private readonly _destroyRef: DestroyRef =
    inject(DestroyRef);
  private readonly _todoService: TodoService =
    inject(TodoService);
  private readonly _dialogService: AppDialogService =
    inject(AppDialogService);

  public readonly completedTasks = computed(
    (): TodoItem[] =>
      this._todoService
        .tasks()
        .filter(
          (task: TodoItem): boolean => task.completed,
        ),
  );

  public restoreTask(taskId: string): void {
    this._todoService.setCompleted(taskId, false);
  }

  public deleteTask(taskId: string): void {
    this._todoService.deleteTask(taskId);
  }

  public openClearCompletedDialog(): void {
    this._dialogService
      .open<
        ClearCompletedDialogResult,
        { completedCount: number },
        ClearCompletedDialogComponent
      >(
        ClearCompletedDialogComponent,
        {
          width: 'min(100vw - 2rem, 36rem)',
          maxWidth: '36rem',
          data: {
            completedCount: this.completedTasks().length,
          },
        },
      ).closed
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe();
  }

  public priorityClass(priority: TodoPriority): string {
    switch (priority) {
      case 'high':
        return 'bg-error-100 text-error-700 dark:bg-error-900/20 dark:text-error-300';
      case 'medium':
        return 'bg-warning-100 text-warning-700 dark:bg-warning-900/20 dark:text-warning-300';
      default:
        return 'bg-secondary-200 text-secondary-700 dark:bg-secondary-800 dark:text-secondary-300';
    }
  }
}
