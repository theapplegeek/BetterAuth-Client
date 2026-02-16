import { Component, computed, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { DatePipe } from '@angular/common';
import {
  TodoItem,
  TodoPriority,
  TodoService,
} from '../../common/todo/todo.service';

@Component({
  selector: 'app-customers',
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './customers.component.html',
  styleUrl: './customers.component.scss',
})
export class CustomersComponent {
  private readonly _todoService: TodoService =
    inject(TodoService);

  public readonly openTasks = computed((): TodoItem[] =>
    this._todoService
      .tasks()
      .filter((task: TodoItem): boolean => !task.completed),
  );

  public readonly form = new FormGroup({
    title: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(2),
      ],
    }),
    notes: new FormControl('', {
      nonNullable: true,
    }),
    priority: new FormControl<TodoPriority>('medium', {
      nonNullable: true,
    }),
  });

  public addTask(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this._todoService.addTask(
      value.title,
      value.notes,
      value.priority,
    );

    this.form.reset({
      title: '',
      notes: '',
      priority: 'medium',
    });
  }

  public completeTask(taskId: string): void {
    this._todoService.setCompleted(taskId, true);
  }

  public deleteTask(taskId: string): void {
    this._todoService.deleteTask(taskId);
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
