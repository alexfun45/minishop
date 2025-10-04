// types/ModelTypes.ts
export interface UserAttributes {
  id?: number;
  telegram_id: number;
  username?: string;
  first_name: string;
  last_name?: string;
  language: string;
  phone?: string;
  bonus_points?: number;
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;
  save(): Promise<void>;
  update(data: Partial<UserAttributes>): Promise<void>;
}

export interface CategoryAttributes {
  id?: number;
  name_ru: string;
  name_tj?: string;
  name_uz?: string;
  description_ru?: string;
  description_tj?: string;
  description_uz?: string;
  image_url?: string;
  is_active?: boolean;
  sort_order?: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface ProductAttributes {
  id?: number;
  name_ru: string;
  name_tj?: string;
  name_uz?: string;
  description_ru?: string;
  description_tj?: string;
  description_uz?: string;
  price: number;
  old_price?: number;
  available?: boolean;
  image_url?: string;
  weight?: string;
  ingredients_ru?: string;
  ingredients_tj?: string;
  ingredients_uz?: string;
  category_id: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface OrderAttributes {
  id?: number;
  user_id: number;
  total_amount?: number;
  status?: string;
  delivery_address: string;
  delivery_time?: Date;
  customer_phone: string;
  customer_name: string;
  payment_method?: string;
  payment_status?: string;
  notes?: string;
  delivery_lat?: number;
  delivery_lng?: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface OrderItemAttributes {
  id?: number;
  order_id: number;
  product_id: number;
  quantity: number;
  price: number;
  product_name: string;
  product_image?: string;
  created_at?: Date;
  updated_at?: Date;
}