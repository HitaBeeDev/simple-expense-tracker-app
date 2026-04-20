import { Component } from '@angular/core';
import { ExpensesListComponent } from './expenses-list/expenses-list';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.html',
  imports: [ExpensesListComponent],
})
export class AppComponent {}
