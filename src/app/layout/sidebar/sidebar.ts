import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavLink {
  label: string;
  path: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  readonly links: NavLink[] = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Excel Upload', path: '/excel-upload' },
    { label: 'Batch Summary', path: '/batch-summary' },
    { label: 'Reports', path: '/reports' },
    { label: 'Search & Print', path: '/policy-search' },
    { label: 'Policy Cancel', path: '/policy-cancel' },
  ];
}
