import { Injectable } from '@angular/core';
import firebase from 'firebase/compat/app';

import {
  AngularFirestore,
  AngularFirestoreDocument,
  DocumentSnapshot,
  QuerySnapshot,
} from '@angular/fire/compat/firestore';
import {
  concatMap,
  forkJoin,
  from,
  last,
  map,
  Observable,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { v4 as uuid } from 'uuid';
import { Post } from '../models/post.model';
import { Comment } from '../models/comment.model';
import { convertSnapsToType } from '../util/db-utils';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { PostFilterOptions } from '../models/post-filter-options.model';
import { Notification } from '../models/notification.model';
@Injectable({
  providedIn: 'root',
})
export class ForumService {
  constructor(
    private afs: AngularFirestore,
    private storage: AngularFireStorage
  ) {}
  /**
   * @description This method generates a unique ID for a forum post using the createId() method from AngularFirestore.
   * @returns "A unique ID for a forum post"
   */
  getUniqueForumPostId(): string {
    return this.afs.createId();
  }
  /**
   * @description Fetches the available hashtags from Firestore. It retrieves the document from the utils collection and maps the tags field to an array of strings.
   * @returns An observable of the hashtags
   */
  getHastags(): Observable<string[]> {
    return this.afs
      .doc<{ tags: string[] }>('utils/hashtags')
      .valueChanges()
      .pipe(
        map((doc) => doc?.tags || [])
      );
  }
  /**
   * @description Fetches the latest 25 forum posts from Firestore. It orders the results by createdAt in descending order and maps the createdAt field to a Date object if it is not already one.
   * @returns An observable of the forum posts
   */
  getLatestForumPosts(): Observable<Post[]> {
    return this.afs
      .collection('forum', (ref) => ref.orderBy('createdAt', 'desc').limit(25))
      .get()
      .pipe(map((snaps) => convertSnapsToType<Post>(snaps)));
  }
  /**
   * @description Fetches a single forum post from Firestore by its ID. It maps the createdAt field to a Date object if it is not already one.
   * @param id The ID of the forum post to fetch
   * @returns An observable of the forum post
   */
  getForumPostById(id: string): Observable<Post> {
    return this.afs
      .doc<Post>(`forum/${id}`)
      .valueChanges({ idField: 'id' }) as Observable<Post>;
  }
  /**
   * @description Fetches the comments for a specific forum post from Firestore. It orders the results by createdAt in descending order and maps the createdAt field to a Date object if it is not already one.
   * @param id The ID of the forum post to fetch comments for
   * @returns An observable of the comments
   */
  getForumPostComments(id: string): Observable<Comment[]> {
    return this.afs
      .collection('forum')
      .doc(id)
      .collection('comments', (ref) => ref.orderBy('createdAt', 'desc'))
      .valueChanges({ idField: 'id' }) as Observable<Comment[]>;
  }
  /**
   * @description Fetches the comments for a specific forum post from Firestore. It orders the results by createdAt in descending order and maps the createdAt field to a Date object if it is not already one.
   * @param id The ID of the forum post to fetch comments for
   * @returns An observable of the comments
   */
  getForumCommentsByUser(userID: string): Observable<Comment[]> {
    return this.afs
      .collectionGroup('comments', (ref) => ref.where('author', '==', userID))
      .get()
      .pipe(map((snaps) => convertSnapsToType<Comment>(snaps)));
  }
  /**
   * @description Fetches the forum posts created by a specific user from Firestore. It orders the results by createdAt in descending order and maps the createdAt field to a Date object if it is not already one.
   * @param userID The ID of the user to fetch posts for
   * @returns An observable of the forum posts
   */
  getForumPostsByUser(userID: string): Observable<Post[]> {
    return this.afs
      .collection('forum', (ref) => ref.where('author', '==', userID))
      .get()
      .pipe(map((snaps) => convertSnapsToType<Post>(snaps)));
  }
  /**
   * @description Fetches the forum posts liked by a specific user from Firestore. It retrieves the document from the user's likes collection and maps the likedPostIds field to an array of strings.
   * @param userId The ID of the user to fetch liked posts for
   * @returns An observable of the liked post IDs
   */
  getUserLikedPosts(userId: string | null): Observable<string[]> {
    if (!userId) return of([]);
    return this.afs
      .doc<{ likedPostIds: string[] }>(`users/${userId}/utils/likes`)
      .valueChanges()
      .pipe(map((doc) => doc?.likedPostIds ?? []));
  }
  /**
   * @description Toggles the like status of a post for a specific user. It uses a Firestore transaction to atomically update the user's likes and the post's like count.
   * @param postId The ID of the post to toggle
   * @param userId The ID of the user to toggle the like for
   * @returns An observable of the new like status (true if liked, false if unliked)
   */
  toggleLike(postId: string, userId: string): Observable<boolean> {
    const likesRef = this.afs.firestore.doc(`users/${userId}/utils/likes`);
    const postRef = this.afs.firestore.doc(`forum/${postId}`);

    return from(
      this.afs.firestore.runTransaction(async (tx) => {
        // 1) Read user’s likes
        const likesSnap = await tx.get(likesRef);
        const liked: string[] = likesSnap.exists
          ? likesSnap.data()!['likedPostIds'] || []
          : [];
        // 2) Read post’s current likeCount
        const postSnap = await tx.get(postRef);
        const count: number = postSnap.data()?.['likeCount'] || 0;
        let nowLiked: boolean;
        if (liked.includes(postId)) {
          // user already liked => remove
          const newList = liked.filter((id) => id !== postId);
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
  /**
   * @description Updates a forum post in Firestore. It uses the update method to apply the changes to the specified post ID.
   * @param postID The ID of the post to update
   * @param changes The changes to apply to the post
   * @returns An observable of void
   */
  updatePost(postID: string, changes: Partial<Post>): Observable<void> {
    // Use backticks, not a literal string
    const ref = this.afs.doc(`forum/${postID}`);
    return from(ref.update(changes));
  }

  /** 
   * @description Creates a new comment in Firestore under the specified post ID. It uses a transaction to atomically create the comment and update the post's comment count.
   * @param partial The partial comment data to create
   * @param postId The ID of the post to create the comment under
   * @returns A promise that resolves when the transaction is complete
   */
  createCommentTransaction(
    partial: Omit<Comment, 'id' | 'createdAt' | 'updatedAt' | 'commentNumber'>,
    postId: string
  ): Promise<void> {
    const commentId = this.afs.createId();
    const now = new Date();
    const commentRef = this.afs.firestore.doc(
      `forum/${postId}/comments/${commentId}`
    );
    const postRef = this.afs.firestore.doc(`forum/${postId}`);

    // Build the full Comment payload
    const data: Comment = {
      id: commentId,
      authorId: partial.authorId,
      username: partial.username,
      content: partial.content,
      createdAt: now,
      updatedAt: now,
      isLocked: false,
      isEdited: false,
      isHidden: false,
    };

    // Run a single transaction: read postCount → write comment → update count
    return this.afs.firestore.runTransaction(async (tx) => {
      // 1) Read current commentCount
      const postSnap = await tx.get(postRef);
      const prevCount = (postSnap.data()?.['commentCount'] ?? 0) as number;
      //Notification part
      if (partial.authorId != postSnap.data()?.['authorId']) {
        const postAuthorId = postSnap.data()?.['authorId'] as string;
        const postTitle = postSnap.data()?.['title'] as string;
        const notificationID = this.afs.createId();
        const notificationRef = this.afs.firestore.doc(
          `users/${postAuthorId}/notifications/${notificationID}`
        );
        const notification: Notification = {
          id: notificationID,
          type: 'info',
          date: now,
          read: false,
          message: `New comment on your post: ${postTitle} by ${partial.username}`,
        };
        tx.set(notificationRef, notification);
      }

      // 2) Create the new comment
      tx.set(commentRef, data);
      // 3) Increment the post’s commentCount
      tx.update(postRef, { commentCount: prevCount + 1 });
    });
  }
  /**
   * @description Updates the linked pictures of a forum post in Firestore. It uses the update method to apply the changes to the specified post ID.
   * @param postId The ID of the post to update
   * @param urls The new linked picture URLs to set
   * @returns An observable of void
   */
  updateLinkedPictures(postId: string, urls: string[]) {
    return this.afs.doc(`forum/${postId}`).update({ linkedPictures: urls });
  }
  /**
   * @description Creates a new forum post in Firestore with the specified draft data and linked images. It uses a transaction to atomically create the post and upload the images.
   * @param draft The draft data for the post
   * @param postId The ID of the post to create
   * @param files The files to upload as linked images
   * @returns An observable of the created post
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
    };

    // 2) Write the stub document
    const write$ = from(this.afs.doc(`forum/${postId}`).set(base));

    // 3) If no files, skip uploads
    const upload$ = files.length
      ? forkJoin(
          files.map((file) => {
            const ext = file.type === 'image/png' ? 'png' : 'jpg';
            const path = `forum/${postId}/${uuid()}.${ext}`;
            const task = this.storage.upload(path, file);
            const ref = this.storage.ref(path);

            return task.snapshotChanges().pipe(
              last(), // <<— wait for the final upload event
              switchMap(() => ref.getDownloadURL())
            );
          })
        )
      : of<string[]>([]);

    // 4) Chain: write → uploads → patch linkedPictures → emit final Post
    return write$.pipe(
      switchMap(() => upload$),
      switchMap((urls) =>
        urls.length
          ? from(
              this.afs.doc(`forum/${postId}`).update({ linkedPictures: urls })
            ).pipe(map(() => urls))
          : of<string[]>([])
      ),
      map((urls) => ({ id: postId, ...base, linkedPictures: urls } as Post))
    );
  }
  /**
   * @description Fetches the forum posts that match the specified filter options from Firestore. It orders the results by likeCount or createdAt based on the filter options.
   * @param opts The filter options to apply
   * @returns An observable of the filtered forum posts
   */
  getFilteredForumPosts(opts: PostFilterOptions): Observable<Post[]> {
    return this.afs
      .collection<Post>('forum', (ref) => {
        let q:
          | firebase.firestore.CollectionReference
          | firebase.firestore.Query = ref;
        // Title prefix search
        console.log('opts: ', opts);

        if (opts.title) {
          const t = opts.title;
          q = q.where('title', '>=', t).where('title', '<=', t + '\uf8ff');
        }
        // Hashtag array-contains-any
        if (opts.hashtags?.length) {
          q = q.where('hashtags', 'array-contains-any', opts.hashtags);
        }
        // Ordering
        if (opts.hotFirst) {
          q = q.orderBy('likeCount', 'desc');
        } else {
          const order: 'asc' | 'desc' = opts.dateOrder ?? 'desc';
          q = q.orderBy('createdAt', order);
        }
        console.log('query: ', q);

        return q.limit(100); // optional safety cap
      })
      .get()
      .pipe(map((snaps) => convertSnapsToType<Post>(snaps)));
  }

  /**
   * @description Deletes a forum post from Firestore by its ID. It uses the delete method to remove the document.
   * @param postId The ID of the post to delete
   * @returns An observable of void
   */
  deletePost(postId: string): Observable<void> {
    return from(this.afs.doc(`forum/${postId}`).delete());
  }
  /**
   * @description Deletes a comment from a forum post in Firestore. It uses a transaction to atomically delete the comment and update the post's comment count.
   * @param postId The ID of the post to delete the comment from
   * @param commentId The ID of the comment to delete
   * @returns An observable of void
   */
  deleteComment(postId: string, commentId: string) {
    const commentRef = this.afs.firestore.doc(
      `forum/${postId}/comments/${commentId}`
    );
    const postRef = this.afs.firestore.doc(`forum/${postId}`);
    return from(
      this.afs.firestore.runTransaction(async (tx) => {
        const postSnap = await tx.get(postRef);
        const prevCount = (postSnap.data()?.['commentCount'] ?? 0) as number;
        // 2) Now perform all writes
        tx.delete(commentRef);
        tx.update(postRef, { commentCount: Math.max(prevCount - 1, 0) });
      })
    );
  }
  /**
   * @description Deletes a linked image from a forum post in Firestore. It uses the delete method to remove the image from storage and the update method to remove the URL from the post's linkedPictures array.
   * @param postId The ID of the post to delete the image from
   * @param imageUrl The URL of the image to delete
   * @returns An observable of void
   */
  deletePostImage(postId: string, imageUrl: string): Observable<void> {
    const ref = this.storage.refFromURL(imageUrl);
    return from(ref.delete()).pipe(
      concatMap(() =>
        this.afs.doc(`forum/${postId}`).update({
          linkedPictures: firebase.firestore.FieldValue.arrayRemove(imageUrl),
        })
      )
    );
  }
  /**
   * @description Toggles the lock status of a forum post in Firestore. It uses the update method to set the isLocked field to the opposite of its current value.
   * @param postID The ID of the post to toggle
   * @param isLocked The current lock status of the post
   * @returns An observable of void
   */
  toggleLockPost(postID: string, isLocked: boolean): Observable<void> {
    return from(
      this.afs.doc(`forum/${postID}`).update({ isLocked: !isLocked })
    );
  }
}
