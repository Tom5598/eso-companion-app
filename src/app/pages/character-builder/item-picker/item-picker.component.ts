import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatButtonModule } from '@angular/material/button';

export interface PickerItem { name: string; url: string; preview: string; }
export interface PickerData {
  slot: string;
  items: PickerItem[];
}

@Component({
  selector: 'app-item-picker',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatGridListModule, MatButtonModule],
  templateUrl: './item-picker.component.html',
  styleUrl: './item-picker.component.scss'
})
export class ItemPickerComponent {

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: PickerData,
    private dialogRef: MatDialogRef<ItemPickerComponent>
  ) {}

  select(arg0: string) {
    console.log('Selected item:', arg0);
    this.dialogRef.close(arg0);
    
  }
}
