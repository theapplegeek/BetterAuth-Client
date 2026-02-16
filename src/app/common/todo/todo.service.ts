import {
  effect,
  Injectable,
  signal,
  WritableSignal,
} from '@angular/core';

export type TodoPriority = 'low' | 'medium' | 'high';

export type TodoItem = {
  id: string;
  title: string;
  notes?: string;
  priority: TodoPriority;
  completed: boolean;
  createdAt: string;
  completedAt?: string;
};

@Injectable({
  providedIn: 'root',
})
export class TodoService {
  private readonly _storageKey = 'better-auth-demo.todos';

  public readonly tasks: WritableSignal<TodoItem[]> =
    signal<TodoItem[]>(this._loadFromStorage());

  constructor() {
    effect((): void => {
      const nextTasks = this.tasks();
      localStorage.setItem(
        this._storageKey,
        JSON.stringify(nextTasks),
      );
    });
  }

  public addTask(
    title: string,
    notes: string,
    priority: TodoPriority,
  ): void {
    const normalizedTitle = title.trim();
    if (!normalizedTitle) return;

    const normalizedNotes = notes.trim();
    this.tasks.update(
      (currentTasks: TodoItem[]): TodoItem[] => {
        return [
          {
            id: crypto.randomUUID(),
            title: normalizedTitle,
            notes: normalizedNotes || undefined,
            priority: priority,
            completed: false,
            createdAt: new Date().toISOString(),
          },
          ...currentTasks,
        ];
      },
    );
  }

  public setCompleted(
    taskId: string,
    completed: boolean,
  ): void {
    this.tasks.update(
      (currentTasks: TodoItem[]): TodoItem[] =>
        currentTasks.map(
          (task: TodoItem): TodoItem =>
            task.id === taskId
              ? {
                  ...task,
                  completed: completed,
                  completedAt: completed
                    ? new Date().toISOString()
                    : undefined,
                }
              : task,
        ),
    );
  }

  public deleteTask(taskId: string): void {
    this.tasks.update(
      (currentTasks: TodoItem[]): TodoItem[] =>
        currentTasks.filter(
          (task: TodoItem): boolean => task.id !== taskId,
        ),
    );
  }

  public clearCompleted(): void {
    this.tasks.update(
      (currentTasks: TodoItem[]): TodoItem[] =>
        currentTasks.filter(
          (task: TodoItem): boolean => !task.completed,
        ),
    );
  }

  private _loadFromStorage(): TodoItem[] {
    const rawValue = localStorage.getItem(this._storageKey);
    if (!rawValue) return [];

    try {
      const parsedValue: unknown = JSON.parse(rawValue);
      if (!Array.isArray(parsedValue)) return [];

      return parsedValue
        .filter(
          (item: unknown): item is TodoItem =>
            typeof item === 'object' &&
            item !== null &&
            'id' in item &&
            'title' in item &&
            'priority' in item &&
            'completed' in item &&
            'createdAt' in item,
        )
        .map(
          (item: TodoItem): TodoItem => ({
            ...item,
            notes: item.notes ?? undefined,
            completedAt: item.completedAt ?? undefined,
          }),
        );
    } catch {
      return [];
    }
  }
}
