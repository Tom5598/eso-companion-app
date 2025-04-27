import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { from, map, Observable, of, tap } from 'rxjs';
import { Commodity, CommodityFilter } from '../models/commodity.model';
import { CommodityNames } from '../models/commodity-names.model';
import firebase from 'firebase/compat/app';
import { commodityNames } from '../util/commodityNames';

@Injectable({
  providedIn: 'root',
})
export class CommodityService {
  constructor(private afs: AngularFirestore) {
    console.log('CommodityService initialized');
  }

  // Master list of names for autocomplete
  getCommodityNames(): Observable<CommodityNames[]> {
    return this.afs
      .doc<{ commodityNames: CommodityNames[] }>('utils/misc')
      .valueChanges()
      .pipe(map((doc) => doc?.commodityNames ?? []));
  }

  // Fetch one commodity by name
  getCommodityByName(name: string): Observable<Commodity> {
    console.log('Fetching commodity by name:', name);

    return this.afs
      .collection<Commodity>('commodities', (ref) =>
        ref.where('name', '==', name)
      )
      .valueChanges({ idField: 'id' })
      .pipe(
        map((arr) => {
          if (!arr.length) throw new Error(`No commodity "${name}"`);
          return arr[0];
        }),
        tap((c) => {
          console.log('Fetched commodity:', c);
        })
      );
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
  /*
  updateCommodityNames(){
    this.afs.collection('utils').doc('misc').update({
      commodityNames:  commodityNames,
    });
    };
  */
  
  /**
   * Seed Firestore with mock ESO commodity data:
   * - Hard-coded names from ESO crafting/improvement mats
   * - 7 megaserver regions
   * - Random currentPrice/Volume + 60-day history
   */
  /*
  populateDB(): Observable<void> {
    // 1) List of commodity names (crafting & improvement mats)
    const names = [
      // Blacksmithing
      'Iron Ingot',
      'Steel Ingot',
      'Orichalcum Ingot',
      'Dwarven Ingot',
      'Ebony Ingot',
      'Calcinium Ingot',
      'Galatite Ingot',
      'Quicksilver Ingot',
      'Voidstone Ingot',
      'Rubedite Ingot',
      // Leather & Hide Clothing
      'Rawhide',
      'Hide',
      'Leather',
      'Thick Leather',
      'Fell Hide',
      'Topgrain Hide',
      'Iron Hide',
      'Superb Hide',
      'Shadowhide',
      'Rubedo Hide',
      // Fiber Clothing
      'Jute',
      'Flax',
      'Cotton',
      'Spidersilk',
      'Ebonthread',
      'Kresh Fiber',
      'Ironthread',
      'Silverweave',
      'Void Cloth',
      'Ancestor Silk',
      // Woodworking
      'Sanded Maple',
      'Sanded Oak',
      'Sanded Beech',
      'Sanded Hickory',
      'Sanded Yew',
      'Sanded Birch',
      'Sanded Ash',
      'Sanded Mahogany',
      'Sanded Nightwood',
      'Sanded Ruby Ash',
      // Jewelry
      'Pewter Ounce',
      'Copper Ounce',
      'Silver Ounce',
      'Electrum Ounce',
      'Platinum Ounce',
      // Improvement Mats
      'Honing Stone',
      'Dwarven Oil',
      'Grain Solvent',
      'Tempering Alloy',
      'Pitch',
      'Turpen',
      'Mastic',
      'Rosin',
      'Hemming',
      'Embroidery',
      'Elegant Lining',
      'Dreugh Wax',
      'Terne Plating',
      'Iridium Plating',
      'Zircon Plating',
      'Chromium Plating',
    ];

    // 2) ESO megaserver regions
    const regions = [
      // Aldmeri Dominion
      'Auridon',
      'Grahtwood',
      'Greenshade',
      "Khenarthi's Roost",
      'Malabal Tor',
      "Reaper's March",

      // Daggerfall Covenant
      "Alik'r Desert",
      'Bangkorai',
      'Betnikh',
      'Glenumbra',
      'Rivenspire',
      'Stormhaven',
      "Stros M'Kai",

      // Ebonheart Pact
      'Bal Foyen',
      'Bleakrock Isle',
      'Deshaan',
      'Eastmarch',
      'Shadowfen',
      'Stonefalls',
      'The Rift',
    ];

    // 3) Today's date for history
    const today = new Date();

    // 4) Begin Firestore batch
    const batch = this.afs.firestore.batch();
    const colRef = this.afs.collection('commodities').ref;

    names.forEach((name) => {
      const docRef = colRef.doc(this.afs.createId());

      // random current values
      const currentPrice = +(Math.random() * 100).toFixed(2);
      const currentVolume = Math.floor(Math.random() * 1000) + 100;

      // regional prices/volumes: ±10%
      const regionalData: Record<string, { price: number; volume: number }> =
        {};
      regions.forEach((r) => {
        const priceF = 1 + (Math.random() - 0.5) * 0.2;
        const volF = 1 + (Math.random() - 0.5) * 0.2;
        regionalData[r] = {
          price: +(currentPrice * priceF).toFixed(2),
          volume: Math.floor(currentVolume * volF),
        };
      });

      // 60-day history
      const historical: Array<{ date: Date; price: number; volume: number }> =
        [];
      for (let i = 60; i >= 1; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const pf = 1 + (Math.random() - 0.5) * 0.2;
        const vf = 1 + (Math.random() - 0.5) * 0.2;
        historical.push({
          date: d,
          price: +(currentPrice * pf).toFixed(2),
          volume: Math.floor(currentVolume * vf),
        });
      }

      batch.set(docRef, {
        name,
        currentPrice,
        currentVolume,
        regionalData,
        historical,
      });
    });

    // 5) Commit batch
    return from(batch.commit());
  }*/
}
