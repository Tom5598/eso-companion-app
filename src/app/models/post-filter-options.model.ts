export interface PostFilterOptions {
  title?: string;
  dateFrom?: Date;
  dateTo?: Date;
  dateOrder?: 'asc' | 'desc';
  hashtags?: string[];
  hotFirst?: boolean;
}
