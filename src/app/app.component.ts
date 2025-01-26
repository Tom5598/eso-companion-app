import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppMaterialComponent } from "./app-material/app-material.component";
import { NavbarComponent } from "./components/navbar/navbar.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'eso-companion-app';
}
