import { Injectable } from '@angular/core';
import firebase from 'firebase/compat/app';

import { AngularFirestore, AngularFirestoreDocument, DocumentSnapshot, QuerySnapshot } from '@angular/fire/compat/firestore';
import { concatMap, forkJoin, from, last, map, Observable, of, switchMap, tap } from 'rxjs';
import { v4 as uuid } from 'uuid';
import { Post } from '../models/post.model';
import { Comment } from '../models/comment.model';
import { convertSnapsToType } from '../util/db-utils';
import { AngularFireStorage } from '@angular/fire/compat/storage';
@Injectable({
  providedIn: 'root'
})
export class ForumService {

  constructor(private afs: AngularFirestore, private storage: AngularFireStorage) {}
  //READ
  getLatestForumPosts() : Observable<Post[]> {
    return this.afs.collection('forum', ref => ref.orderBy('createdAt', 'desc').limit(25)).get()
    .pipe(
      map(snaps=>convertSnapsToType<Post>(snaps))
    );
  }
  getForumPostById(id: string): Observable<Post> {
    return this.afs
      .doc<Post>(`forum/${id}`)
      .valueChanges({ idField: 'id' }) as Observable<Post>;
  }
  getForumPostComments(id: string) : Observable<Comment[]> {
    return this.afs.collection('forum').doc(id).collection('comments', ref => ref.orderBy('createdAt', 'desc')).get()
    .pipe(
      tap( snaps => {
        console.log('snaps', snaps);
      }),
      map(snaps => convertSnapsToType<Comment>(snaps))
    );
  }
  getForumCommentsByUser(userID: string) : Observable<Comment[]> {
    return this.afs.collectionGroup('comments', ref => ref.where('author', '==', userID )).get()
    .pipe(
      map(snaps => convertSnapsToType<Comment>(snaps))
    );
  }
  getForumPostsByUser(userID: string) : Observable<Post[]> {
    return this.afs.collection('forum', ref => ref.where('author', '==', userID )).get()
    .pipe(
      map(snaps => convertSnapsToType<Post>(snaps))
    );
  }
  getUserLikedPosts(userId: string | null): Observable<string[]> {
    if (!userId) return of([]);
    return this.afs
      .doc<{ likedPostIds: string[] }>(`users/${userId}/utils/likes`)
      .valueChanges()
      .pipe(map(doc => doc?.likedPostIds ?? []));
  }
  toggleLike(postId: string, userId: string): Observable<boolean> {
    const likesRef = this.afs.firestore.doc(`users/${userId}/utils/likes`);
    const postRef = this.afs.firestore.doc(`forum/${postId}`);

    return from(
      this.afs.firestore.runTransaction(async tx => {
        // 1) Read user’s likes
        const likesSnap = await tx.get(likesRef);
        const liked: string[] = likesSnap.exists
          ? (likesSnap.data()!['likedPostIds'] || [])
          : [];        
        // 2) Read post’s current likeCount
        const postSnap = await tx.get(postRef);
        const count: number = postSnap.data()?.['likeCount'] || 0;        
        let nowLiked: boolean;
        if (liked.includes(postId)) {
          // user already liked => remove
          const newList = liked.filter(id => id !== postId);
          tx.set(likesRef, { likedPostIds: newList }, { merge: true });
          tx.update(postRef, { likeCount: count - 1 });
          nowLiked = false;
        } else {
          // user has not liked => add
          const newList = [...liked, postId];
          tx.set(likesRef, { likedPostIds: newList }, { merge: true });
          tx.update(postRef, { likeCount: count + 1 });
          nowLiked = true;
        }
        return nowLiked;
      })
    );
  }
  //CREATE
  createForumPost(newPost:Partial<Post>, id?:string)  {     
    const post=  {...newPost };
    let savePost$: Observable<any>; 
    if (id) {
      savePost$ = from(this.afs.collection('forum').doc(id).set(post, { merge: true }));
    } else {
      savePost$ = from(this.afs.collection('forum').add(post));
    }
    return savePost$.pipe(
      map((res)=>{
        return {
          id: id ?? res.id,
          ...post
        }
      })
    );
  }
  updatePost(postID: string, changes: Partial< Post >): Observable<void> {
    // Use backticks, not a literal string
    const ref = this.afs.doc(`forum/${postID}`);
    return from(ref.update(changes));
  }
   
  createCommentPromise(
    partial: Omit<Comment, 'id' | 'createdAt' | 'updatedAt' | 'commentNumber'>,
    postId: string
  ): Promise<void> {
    const commentId = this.afs.createId();
    const now = new Date();

    const data: Comment = {
      id: commentId,
      authorId: partial.authorId,
      username: partial.username,
      content: partial.content,
      createdAt: now,
      updatedAt: now,
      isLocked: false,
      isEdited: false,
      isHidden: false
    };
    // 1) write the comment
    return this.afs
      .collection(`forum/${postId}/comments`)
      .doc(commentId)
      .set(data)
      .then(() => {
        // 2) read the post doc once
        return this.afs
          .doc<Partial<{ commentCount: number }>>(`forum/${postId}`)
          .ref.get();
      })
      .then(docSnap => {
        const prev = (docSnap.data()?.commentCount || 0) as number;
        // 3) write back the incremented count
        return this.afs
          .doc(`forum/${postId}`)
          .update({ commentCount: prev + 1 });
      });
  }

  updateLinkedPictures(postId: string, urls: string[]) {
    return this.afs.doc(`forum/${postId}`).update({ linkedPictures: urls });
  }
  /**
   * Create a new post at forum/{postId}, upload up to 10 images
   * into Storage under forum/{postId}/, then update linkedPictures.
   * Returns an Observable<Post> with all fields set.
   */
  createPostWithImages(
    draft: Partial<Post>,
    postId: string,
    files: File[]
  ): Observable<Post> {
    // 1) Build the Firestore doc data (no pictures yet)
    const now = new Date();
    const base: Partial<Post> = {
      ...draft,
      createdAt: now,
      updatedAt: now,
      linkedPictures: [],
      hashtags: draft.hashtags ?? [],
      commentCount: 0,
      likeCount: 0,
      isEdited: false,
      isLocked: false,
      isHidden: false
    };

    // 2) Write the stub document
    const write$ = from(this.afs.doc(`forum/${postId}`).set(base));

    // 3) If no files, skip uploads
    const upload$ = files.length
      ? forkJoin(
          files.map(file => {
            const ext = file.type === 'image/png' ? 'png' : 'jpg';
            const path = `forum/${postId}/${uuid()}.${ext}`;
            const task = this.storage.upload(path, file);
            const ref = this.storage.ref(path);

            return task
              .snapshotChanges()
              .pipe(
                last(),                        // <<— wait for the final upload event
                switchMap(() => ref.getDownloadURL())
              );
          })
        )
      : of<string[]>([]);

    // 4) Chain: write → uploads → patch linkedPictures → emit final Post
    return write$.pipe(
      switchMap(() => upload$),
      switchMap(urls =>
        urls.length
          ? from(
              this.afs.doc(`forum/${postId}`).update({ linkedPictures: urls })
            ).pipe(map(() => urls))
          : of<string[]>([])
      ),
      map(urls => ({ id: postId, ...base, linkedPictures: urls } as Post))
    );
  }

}
 