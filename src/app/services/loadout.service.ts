import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { doc, DocumentData, DocumentReference } from 'firebase/firestore';
import { BehaviorSubject, forkJoin, map, Observable, of, switchMap, tap } from 'rxjs'; 


export interface BackgroundTransform {
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale:    { x: number; y: number; z: number };
}

export interface BackgroundItem {
  url:       string;
  transform: BackgroundTransform;
}
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

  getBackgroundModels(): Observable<string[]> {
    return this.afs
      .doc<{ models: string[] }>('utils/background')
      .get()
      .pipe(
        map(snap => snap.data()?.models || []),
        switchMap(models => models.length
          ? forkJoin(models.map(path => this.storage.refFromURL(path).getDownloadURL()))
          : of([] as string[])
        )
      );
  }

  getAllItems(): Observable<Item[]> {
    return this.afs
      .doc<{ itemList: any[] }>('utils/items')
      .get()
      .pipe(
        switchMap(snapshot => {
          const rawList = snapshot.data()?.itemList || [];
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
            );
          });          
          return forkJoin(requests);
        })  
      );
  }

  setItem<K extends keyof Loadout>(slot: K, url: string) {
    const current = this.subject.value;
    this.subject.next({ ...current, [slot]: url });
  }
}
