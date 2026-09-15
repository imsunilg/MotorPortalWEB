import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from '../header/header';
import { Sidebar } from '../sidebar/sidebar';
import { Footer } from '../footer/footer';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, Header, Sidebar, Footer],
  templateUrl: './shell.html',
  styleUrl: './shell.css',
})
export class Shell {}
