import { Injectable, signal } from '@angular/core';
import { AccountBranch } from './finance-v2.interfaces';

@Injectable({ providedIn: 'root' })
export class BranchService {
  readonly activeBranch = signal<AccountBranch | 'All'>('All');
}
