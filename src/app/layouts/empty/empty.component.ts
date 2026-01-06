import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'empty-layout',
  imports: [RouterOutlet],
  templateUrl: './empty.component.html',
  styleUrl: './empty.component.scss',
})
export class EmptyComponent {}
