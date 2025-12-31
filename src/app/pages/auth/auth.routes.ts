import {Routes} from '@angular/router';
import {SignInComponent} from './components/sign-in/sign-in.component';
import {SignUpComponent} from "./components/sign-up/sign-up.component";
import {TwoFactorComponent} from "./components/two-factor/two-factor.component";
import {TwoFactorEnableComponent} from "./components/two-factor-enable/two-factor-enable.component";

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'sign-in',
    pathMatch: 'full',
  },
  {
    path: 'sign-in',
    component: SignInComponent,
  },
  {
    path: 'sign-up',
    component: SignUpComponent,
  },
  {
    path: 'sign-in/two-factor',
    component: TwoFactorComponent,
  },
  {
    path: 'sign-in/two-factor-enable',
    component: TwoFactorEnableComponent,
  }
];
