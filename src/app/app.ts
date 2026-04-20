import { Component } from '@angular/core';
import { ExpancesListComponent } from './expenses-list/expenses-list';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.html',
  imports: [ExpancesListComponent],
})
export class AppComponent {}
