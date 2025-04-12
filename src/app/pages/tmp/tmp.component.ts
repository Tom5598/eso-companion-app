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

@Component({
  selector: 'app-tmp',
  standalone: true,
  imports: [AsyncPipe],
  templateUrl: './tmp.component.html',
  styleUrl: './tmp.component.scss',
})
export class TmpComponent implements OnInit, OnDestroy, AfterViewInit {
  articles$: Observable<any> = new Observable<any>();
  @ViewChild('search')
  input: ElementRef = new ElementRef('');
  ref: Subscription = new Subscription();
  constructor(private firestore: AngularFirestore) {}

  ngOnDestroy(): void {}

  ngOnInit(): void {
    
    const subject = new Subject();
    subject.pipe(

    );

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
