import { Component } from '@angular/core';
import { NgtCanvas } from 'angular-three';
import { Experience } from '../../experience/experience.component';
 
@Component({
  selector: 'app-character-builder',
  standalone: true,
  imports: [NgtCanvas],
  templateUrl: './character-builder.component.html',
  styleUrl: './character-builder.component.scss'
})
export class CharacterBuilderComponent {
  sceneGraph = Experience;
}
