import {Component, inject, OnDestroy, signal, WritableSignal} from '@angular/core';
import {ActivatedRoute, NavigationEnd, Router} from '@angular/router';
import {filter, Subscription} from 'rxjs';
import {EmptyComponent} from './empty/empty.component';
import {SidebarComponent} from './sidebar/sidebar.component';


@Component({
  selector: 'app-layouts',
  imports: [
    EmptyComponent,
    SidebarComponent
  ],
  templateUrl: './layouts.component.html',
  styleUrl: './layouts.component.scss',
})
export class LayoutsComponent implements OnDestroy{
  private _activatedRoute: ActivatedRoute = inject(ActivatedRoute);
  private _router: Router = inject(Router);

  public layout: WritableSignal<string> = signal<string>('');
  private _subs: Subscription = new Subscription();

  constructor() {
    this._subs.add(
      this._router.events.pipe(
        filter(event => event instanceof NavigationEnd),
      ).subscribe((): void => {
        this._updateLayout();
      })
    );
  }

  ngOnDestroy(): void {
    this._subs.unsubscribe();
  }

  private _updateLayout(): void {
    let route: ActivatedRoute = this._activatedRoute;
    while (route.firstChild) {
      route = route.firstChild;
    }

    const paths: ActivatedRoute[] = route.pathFromRoot;
    paths.forEach((path: ActivatedRoute): void => {
      // Check if there is a 'layout' data
      if (path.routeConfig && path.routeConfig.data && path.routeConfig.data['layout']) {
        // Set the layout
        this.layout.set(path.routeConfig.data['layout']);
      }
    });
  }
}
