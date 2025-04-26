import { Timestamp } from "firebase/firestore";

export interface Post {
    id: string;
    title: string;
    content: string;
    authorId: string;
    username: string;
    createdAt: Date;
    updatedAt: Date;
    hashtags: Array<string>;
    commentCount: number;
    likeCount: number;    
    isEdited: boolean;
    isLocked: boolean; 
    linkedPictures: Array<string>;
}