import { Routes } from '@angular/router';
import { MyTasksComponent } from './my-tasks.component';
import { CompletedTasksComponent } from './components/completed-tasks/completed-tasks.component';

export const routes: Routes = [
  {
    path: '',
    component: MyTasksComponent,
  },
  {
    path: 'completed',
    component: CompletedTasksComponent,
  },
];
