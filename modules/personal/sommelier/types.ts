
export type BeverageType = 'red_wine' | 'white_wine' | 'rose_wine' | 'sparkling' | 'beer' | 'whisky' | 'gin' | 'other';

export interface Beverage {
  id: string;
  name: string;
  producer?: string; // Vinícola ou Marca
  type: BeverageType;
  grape?: string; // Uva (opcional)
  price: number;
  rating: number; // 1 a 5
  review?: string;
  consumed_date: string;
  image_url?: string;
  user_id: string;
  created_at?: string;
}
