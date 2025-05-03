import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { map, Observable, of, tap } from 'rxjs';
import { Commodity, CommodityFilter } from '../models/commodity.model';
import { CommodityNames } from '../models/commodity-names.model';
import firebase from 'firebase/compat/app'; 
import { AngularFireAnalytics } from '@angular/fire/compat/analytics';

@Injectable({
  providedIn: 'root',
})
export class CommodityService {
  constructor(private afs: AngularFirestore, private analytics: AngularFireAnalytics) { }

  // Master list of names for autocomplete
  getCommodityNames(): Observable<CommodityNames[]> {
    return this.afs
      .doc<{ commodityNames: CommodityNames[] }>('utils/misc')
      .valueChanges()
      .pipe(map((doc) => doc?.commodityNames ?? []));
  }

  queryCommodities(filters: CommodityFilter): Observable<Commodity[]> {
    return this.afs
      .collection<Commodity>('commodities', (ref) => {
        let q:
          | firebase.firestore.CollectionReference
          | firebase.firestore.Query = ref;

        // Name prefix filter
        if (filters.name) {
          const prefix = filters.name;
          q = q
            .where('name', '>=', prefix)
            .where('name', '<=', prefix + '\uf8ff');
        }

        // Price range
        if (filters.minPrice != null) {
          q = q.where('currentPrice', '>=', filters.minPrice);
        }
        if (filters.maxPrice != null) {
          q = q.where('currentPrice', '<=', filters.maxPrice);
        }

        // Volume range
        if (filters.minVolume != null) {
          q = q.where('currentVolume', '>=', filters.minVolume);
        }
        if (filters.maxVolume != null) {
          q = q.where('currentVolume', '<=', filters.maxVolume);
        }

        // Limit
        q = q.limit(filters.limit);

        return q;
      })
      .valueChanges()
      .pipe(
        map((arr) =>
          arr.map((c) => ({
            ...c,
            // convert any Firestore Timestamps in historical to JS Date
            historical: c.historical.map((h) => ({
              date: h.date instanceof Date ? h.date : (h.date as any).toDate(),
              price: h.price,
              volume: h.volume,
            })),
          }))
        )
      );
  }
  getByName(name: string): Observable<Commodity | undefined> {
    this.analytics.logEvent('select_item', { item_id: name });
    return this.afs
      .collection<Commodity>('commodities', (ref) =>
        ref.where('name', '==', name).limit(1)
      )
      .valueChanges()
      .pipe(
        map((arr) => {
          const c = arr[0];
          if (!c) return undefined;
          return {
            ...c,
            historical: c.historical.map((h) => ({
              // if it's already a Date, leave it; if it's a Firestore Timestamp, call toDate()
              date: h.date instanceof Date ? h.date : (h.date as any).toDate(),
              price: h.price,
              volume: h.volume,
            })),
          };
        })
      );
  } 
}
