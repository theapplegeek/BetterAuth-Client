import { Component, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  TodoItem,
  TodoPriority,
  TodoService,
} from '../../common/todo/todo.service';

@Component({
  selector: 'app-wiki',
  imports: [DatePipe],
  templateUrl: './wiki.component.html',
  styleUrl: './wiki.component.scss',
})
export class WikiComponent {
  private readonly _todoService: TodoService =
    inject(TodoService);

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

  public clearCompleted(): void {
    const shouldClear: boolean = window.confirm(
      'Delete all completed tasks?',
    );
    if (!shouldClear) return;
    this._todoService.clearCompleted();
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
