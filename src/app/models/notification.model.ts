export interface Notification {
  id: string;
  message: string;
  date: Date;
  read: boolean;
  type: 'info' | 'warning';
}
