export interface User {
  uid: string;
  email: string;
  username: string;
  createdAt: Date;
  photoURL?: string;
  disabled?: boolean;
}
