import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './components/navbar/navbar';
import { Notice } from './components/notice/notice';
import { Stars } from './components/stars/stars';

@Component({
  imports: [RouterOutlet, Navbar, Stars, Notice],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {}
