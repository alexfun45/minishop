type userAction = {
  type: 'ADD';
  productId: number;
  quantity: number;
  name: string | null;
  price: number; 
} | null;

export interface UserSession {
  cart: CartItem[];
  chat: string[];
  lastViewedProductId: number;
  pendingAction: userAction;
  userPhone: string;
  userId: number;
  awaitingPhoneForOrders?: boolean;
  currentCategory?: number;
  language: 'ru' | 'tj' | 'uz';
  checkoutStep?: 'phone' | 'address' | 'confirm' | 'payment';
  tempOrder?: any;
  lastMessageId?: number;
}

export type Language = 'ru' | 'tj' | 'uz';

export interface CartItem {
  productId: number;
  name: string | null;
  price: number;
  quantity: number;
  imageUrl?: string;
}