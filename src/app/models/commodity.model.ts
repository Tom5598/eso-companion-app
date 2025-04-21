export interface Commodity {
  name: string;
  currentPrice: number;
  currentVolume: number;
  regionalData: Record<string, { price: number; volume: number }>;
  historical: Array<
  {
    date: Date;
    price: number;
    volume: number;
  }
  >;
}
