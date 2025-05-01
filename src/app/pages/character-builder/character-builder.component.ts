import { Component, OnDestroy, OnInit } from '@angular/core';
import { Experience } from '../../experience/experience.component';
import { MatToolbar, MatToolbarModule } from '@angular/material/toolbar';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';

import { MatButtonModule } from '@angular/material/button';
import { MatGridListModule } from '@angular/material/grid-list';
import { Item, Loadout, LoadoutService } from '../../services/loadout.service';
import { MatDialog } from '@angular/material/dialog';
import {
  ItemPickerComponent,
  PickerData,
} from './item-picker/item-picker.component';
import { Subscription } from 'rxjs';
import { MatTooltip, MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-character-builder',
  standalone: true,
  imports: [
    Experience,
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatGridListModule,MatTooltipModule,MatTooltip,
  ],
  templateUrl: './character-builder.component.html',
  styleUrl: './character-builder.component.scss',
})
export class CharacterBuilderComponent implements OnInit, OnDestroy {
  sceneGraph = Experience;

  health = 0;
  magicka = 0;
  stamina = 0;
  damage = 0;
  armor = 0;
  weaponresistence = 0;
  spellresistence = 0;
  slots: Array<Item['slot']> = ['helmet', 'chest', 'legs', 'shield', 'weapon'];
  itemsBySlot: Record<Item['slot'], Item[]> = {
    helmet: [],
    chest: [],
    legs: [],
    shield: [],
    weapon: [],
  };
  private subs = new Subscription();
  constructor(private dialog: MatDialog, private loadoutSvc: LoadoutService) {}
  ngOnInit() {
    // 1) Load all items into itemsBySlot
    this.subs.add(
      this.loadoutSvc.getAllItems().subscribe((all) => {
        this.slots.forEach(
          (slot) =>
            (this.itemsBySlot[slot] = all.filter((i) => i.slot === slot))
        );
      })
    );

    // 2) Recompute stats every time the loadout changes
    this.subs.add(
      this.loadoutSvc.loadout$.subscribe((lo: Loadout) => {
        // reset
        let a = 0, h = 0, d = 0, s = 0, m = 0, sR = 0, wR=0;
        // for each slot, if a URL is selected find the Item and add its stats
        this.slots.forEach((slot) => {
          const url = lo[slot];
          if (!url) return;
          const item = this.itemsBySlot[slot].find((i) => i.model === url);
          if (!item) return;
          h += item.stats.health;          
          s += item.stats.stamina;
          m += item.stats.magicka;
          d += item.stats.damage;
          a += item.stats.armor;
          sR += item.stats.spellresistence;
          wR += item.stats.weaponresistence;
        });
        // update the bound properties
        this.health = h;
        this.magicka = m;
        this.stamina = s;
        this.damage = d;
        this.armor = a;
        this.weaponresistence = wR;
        this.spellresistence = sR;
      })
    );
  }

  openPicker(slot: Item['slot']) {
    const data: PickerData = {
      slot,
      items: this.itemsBySlot[slot].map((i) => ({
        name: i.name,
        url: i.model,
        preview: i.previewPicture,
      })),
    };
    this.dialog
      .open(ItemPickerComponent, { data, width: '600px', maxWidth: '90vw' })
      .afterClosed()
      .subscribe((modelUrl: string) => {
        if (modelUrl) {
          this.loadoutSvc.setItem(slot, modelUrl);
        }
      });
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
