import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { Observable, forkJoin, from, of } from 'rxjs';
import { last, switchMap, map } from 'rxjs/operators';
export type ArticleBlockInput =
  | { type: 'text'; text: string }
  | { type: 'image'; file: File };

export interface ArticleBlockOutput {
  type: 'text' | 'image';
  text?: string;
  url?: string;
}
export interface ArticleItem {
  id: string;
  title: string;
  createdAt: Date;
  thumbnailURL: string;
  blocks: ArticleBlockOutput[];
}

@Injectable({
  providedIn: 'root',
})
export class ArticleService {
  constructor(
    private afs: AngularFirestore,
    private storage: AngularFireStorage
  ) {}
  /**
   * @returns An observable of the articles
   * @description This method fetches the latest 50 articles from Firestore, ordered by createdAt in descending order. It maps the createdAt field to a Date object if it is not already one.
  */
  getArticles(): Observable<ArticleItem[]> {
    return this.afs
      .collection<ArticleItem>('articles', (ref) =>
        ref.orderBy('createdAt', 'desc').limit(50)
      )
      .valueChanges({ idField: 'id' })
      .pipe(
        map((arr) =>
          arr.map((a) => ({
            ...a,
            createdAt:
              a.createdAt instanceof Date
                ? a.createdAt
                : (a.createdAt as any).toDate(),
          }))
        )
      );
  }
  /**
   * @param id The ID of the article to fetch
   * @returns An observable of the article item, or undefined if not found
   * @description This method fetches a single article from Firestore by its ID. It maps the createdAt field to a Date object if it is not already one.
   */
  getArticle(id: string): Observable<ArticleItem | undefined> {
    return this.afs
      .doc<ArticleItem>(`articles/${id}`)
      .valueChanges({ idField: 'id' })
      .pipe(
        map((a) =>
          a
            ? {
                ...a,
                createdAt:
                  a.createdAt instanceof Date
                    ? a.createdAt
                    : (a.createdAt as any)?.toDate(),
              }
            : undefined
        )
      );
  }
  /**
   * @param title The title of the article
   * @param thumbnail The thumbnail image file
   * @param blocks The blocks of the article, which can be text or image
   * @returns An observable that completes when the article is created
   * @description This method creates a new article in Firestore. It first creates an empty document with the title and createdAt fields. Then, it uploads the thumbnail image and each image block, and finally updates the document with the thumbnail URL and blocks array.
   */
  createArticle(
    title: string,
    thumbnail: File,
    blocks: ArticleBlockInput[]
  ): Observable<void> {
    const id = this.afs.createId();
    const docRef = this.afs.doc(`articles/${id}`);

    // 1) Create empty doc
    docRef.set({ title, createdAt: new Date(), thumbnailURL: '', blocks: [] });

    // 2) Thumbnail upload
    const thumbExt = thumbnail.type.split('/')[1];
    const thumbPath = `articles/${id}/thumbnail.${thumbExt}`;
    const thumb$ = this.storage
      .upload(thumbPath, thumbnail)
      .snapshotChanges()
      .pipe(
        last(),
        switchMap(() => this.storage.ref(thumbPath).getDownloadURL())
      );

    // 3) Blocks uploads / mappings
    const blockUploads$ = blocks.map((blk, i) => {
      if (blk.type === 'text') {
        return of({ type: 'text' as const, text: blk.text });
      }
      // image block
      const file = blk.file;
      const ext = file.type.split('/')[1];
      const path = `articles/${id}/images/${i}.${ext}`;
      return this.storage
        .upload(path, file)
        .snapshotChanges()
        .pipe(
          last(),
          switchMap(() => this.storage.ref(path).getDownloadURL()),
          map((url) => ({ type: 'image' as const, url }))
        );
    });

    // 4) Wait all uploads, then update doc
    return forkJoin([thumb$, ...blockUploads$]).pipe(
      switchMap((results) => {
        const thumbnailURL = results[0] as string;
        const blocksOut = results.slice(1) as ArticleBlockOutput[];
        return from(docRef.update({ thumbnailURL, blocks: blocksOut }));
      }),
      map(() => void 0)
    );
  }
  /** Delete an article by its Firestore ID */
  deleteArticle(id: string) {
    return from(this.afs.doc(`articles/${id}`).delete());
  }
}
