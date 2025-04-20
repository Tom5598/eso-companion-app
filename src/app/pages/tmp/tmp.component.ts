import { AsyncPipe } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import {
  concat,
  concatMap,
  debounceTime,
  distinctUntilChanged,
  from,
  fromEvent,
  interval,
  map,
  merge,
  Observable,
  of,
  retry,
  retryWhen,
  shareReplay,
  Subject,
  Subscription,
  tap,
  throttle,
} from 'rxjs';
import { debug, RxJsLoggingLevel } from '../../util/debug';
import { MatButton } from '@angular/material/button';

@Component({
  selector: 'app-tmp',
  standalone: true,
  imports: [AsyncPipe, MatButton],
  templateUrl: './tmp.component.html',
  styleUrl: './tmp.component.scss',
})
export class TmpComponent implements OnInit, OnDestroy, AfterViewInit {
  comment$: Observable<any> = new Observable<any>();
  articles$: Observable<any> = new Observable<any>();
  @ViewChild('search')
  input: ElementRef = new ElementRef('');
  ref: Subscription = new Subscription();
  constructor(private firestore: AngularFirestore) {}
  snapRef: Subscription = new Subscription();
  ngOnDestroy(): void {
    this.snapRef.unsubscribe();
    this.ref.unsubscribe();
  }

  ngOnInit(): void {
    this.firestore.doc("testCollection/myData")
    .get()
      .subscribe((snap)=>{
        console.log(snap.data());
        

      });
    

  }

  ngAfterViewInit(): void {
    this.ref = fromEvent(this.input.nativeElement, 'keyup')
      .pipe(
        map((event: any) => event.target.value),
        debounceTime(1000),
        distinctUntilChanged(),
        debug(RxJsLoggingLevel.INFO, 'search'),
      )
      .subscribe(console.log);
  }

  readDoc() {
    this.articles$ = this.firestore.doc('testCollection/myData').get().pipe(
      map((data: any) => {               
        console.log(Object.values(data.data()));        
        return Object.values(data.data());
      }
    ));
  }
  readDocSnapshot() {
    this.snapRef = this.firestore.doc('testCollection/myData').snapshotChanges().subscribe((snap)=>{
      console.log("Snapshot type: ",snap.type);
      console.log("Snapshot payload",snap.payload.data());
      
      
    });
  }
  readCollection() {
     this.firestore.collection('forum/H2fzYlJssbQDcAHTX88v/comments' // filter by postId
     ).get()
      .subscribe((snaps)=>{
        snaps.forEach((snap)=>{
          console.log(snap.data());
        });
      });
  }
  readCollectionGroup(){
    this.firestore.collectionGroup('comments', ref => ref.where("author","==", "NewGuy131")
    ).get()
      .subscribe((snaps)=>{
        snaps.forEach((snap)=>{
          console.log(snap.data());
        });
      });
  }



}
/**
      this.articles$ = this.firestore.doc('testCollection/myData').valueChanges().pipe(
      map((data: any) => {
        return Object.values(data);
      })
    );
    this.articles$ = this.firestore.doc('testCollection/myData').get().pipe(
      map((data: any) => {               
        console.log(Object.values(data.data()));        
        return Object.values(data.data());
      }
    ),shareReplay(1));

    const interval1$ = interval(1000)
    const interval2$ = interval1$.pipe(map((val) => val*10));
    const result$ = merge(interval1$, interval2$);
    result$.subscribe(console.log);
 */
