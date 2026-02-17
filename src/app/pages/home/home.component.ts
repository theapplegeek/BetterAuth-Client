import { Component, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  TodoItem,
  TodoService,
} from '../todos/services/todo.service';

@Component({
  selector: 'app-home',
  imports: [DatePipe, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  private readonly _todoService: TodoService =
    inject(TodoService);

  public readonly tasks = computed((): TodoItem[] =>
    this._todoService.tasks(),
  );
  public readonly openTasks = computed((): TodoItem[] =>
    this.tasks().filter(
      (task: TodoItem): boolean => !task.completed,
    ),
  );
  public readonly completedTasks = computed(
    (): TodoItem[] =>
      this.tasks().filter(
        (task: TodoItem): boolean => task.completed,
      ),
  );
}
