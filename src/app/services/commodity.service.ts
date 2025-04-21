import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { map, Observable, tap } from 'rxjs';
import { Commodity } from '../models/commodity.model';

@Injectable({
  providedIn: 'root'
})
export class CommodityService {

  constructor(private afs: AngularFirestore) {
    console.log('CommodityService initialized');
    
   }

// Master list of names for autocomplete
getCommodityNames(): Observable<string[]> {
  return this.afs
    .doc<{ commodityNames: string[] }>('utils/misc')
    .valueChanges()
    .pipe(
      map(doc => doc?.commodityNames ?? []),
      tap( names => {console.log('Commodity names:', names); }),       
  );
}

// Fetch one commodity by name
getCommodityByName(name: string): Observable<Commodity> {
  console.log('Fetching commodity by name:', name);
  
  return this.afs
    .collection<Commodity>('commodities', ref => ref.where('name','==',name))
    .valueChanges({ idField: 'id' })
    .pipe(
      map(arr => {
        if (!arr.length) throw new Error(`No commodity "${name}"`);
        return arr[0];
      }),
      tap(c => {
        console.log('Fetched commodity:', c);
      })
    );
}

 
}
