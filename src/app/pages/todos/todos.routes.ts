import { Routes } from '@angular/router';
import { CustomersComponent } from '../customers/customers.component';
import { WikiComponent } from '../wiki/wiki.component';

export const routes: Routes = [
  {
    path: '',
    component: CustomersComponent,
  },
  {
    path: 'completed',
    component: WikiComponent,
  },
];
