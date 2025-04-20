export interface Comment {
    id: string;
    authorId: string;
    username: string;
    createdAt: Date;
    updatedAt: Date;
    content: string;    
    isLocked: boolean;
    isEdited: boolean;
    isHidden: boolean;
}