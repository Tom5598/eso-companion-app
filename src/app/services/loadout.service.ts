import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { doc, DocumentData, DocumentReference } from 'firebase/firestore';
import { BehaviorSubject, forkJoin, map, Observable, of, switchMap, tap } from 'rxjs';
import { log } from 'three/webgpu';

export interface Loadout {
  helmet?: string;
  chest?: string;
  legs?: string;
  shield?: string;
  weapon?: string;
}
export interface Item {
  name: string;
  previewPicture: string;
  model: string;
  stats: {
    armor: number;
    damage: number;
    weaponresistence: number;
    spellresistence: number;
    health: number;
    magicka: number;
    stamina: number;
  };
  slot: 'helmet' | 'chest' | 'legs' | 'shield' | 'weapon';
}
@Injectable({
  providedIn: 'root',
})
export class LoadoutService {
  constructor(
    private afs: AngularFirestore,
    private storage: AngularFireStorage
  ) {}

  private readonly subject = new BehaviorSubject<Loadout>({});
  readonly loadout$ = this.subject.asObservable();

  setItem<K extends keyof Loadout>(slot: K, url: string) {
    const current = this.subject.value;
    this.subject.next({ ...current, [slot]: url });
  }

  getAllItems(): Observable<Item[]> {
    return this.afs
      .doc<{ itemList: any[] }>('utils/items')
      .get()
      .pipe(
        switchMap(snapshot => {
          const data = snapshot.data();
          const rawList = data?.itemList || [];
          if (!rawList.length) {
            return of([] as Item[]);
          }
          // Map each raw item to an observable of Item with actual URLs
          const requests = rawList.map(raw => {
            const { name, previewPicture, model, stats, slot } = raw;
            const preview$ = this.storage.refFromURL(previewPicture).getDownloadURL();
            const model$   = this.storage.refFromURL(model).getDownloadURL();
            return forkJoin({
              previewUrl: preview$,
              modelUrl: model$
            }).pipe(
              map(({ previewUrl, modelUrl }) => ({
                name,
                previewPicture: previewUrl,
                model: modelUrl,
                stats,
                slot,
              }))
            ,tap(() => {console.log('Fetched items:', rawList);}));
          });
          
          return forkJoin(requests);
        })
      );
  }
}
