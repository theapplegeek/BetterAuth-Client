import { Routes } from '@angular/router';
import { UsernameOnboardingComponent } from './components/username-onboarding/username-onboarding.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'username',
    pathMatch: 'full',
  },
  {
    path: 'username',
    component: UsernameOnboardingComponent,
  },
];
