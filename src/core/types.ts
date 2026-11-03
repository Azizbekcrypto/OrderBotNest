// Loyihaning asosiy tushunchalari. Hozircha hammasi xotirada (Map/array),
// server qayta ishga tushsa — yo'qoladi.

export type Role = 'customer' | 'admin';

// Suhbat qaysi bosqichda: oddiy holat yoki telefon kutilmoqda
export type UserState = 'IDLE' | 'WAITING_PHONE';

export type OrderStatus = 'NEW' | 'CONFIRMED' | 'DELIVERED' | 'CANCELLED';

export interface Product {
  id: number;
  name: string;
  price: number; // so'm
  stock: number; // omborda nechta
}

export interface User {
  telegramId: number;
  name: string;
  phone: string | null;
  role: Role;
  state: UserState;
}

export interface CartItem {
  productId: number;
  qty: number;
}

export interface OrderItem {
  productId: number;
  name: string;
  price: number; // buyurtma paytidagi narx
  qty: number;
}

export interface Order {
  id: number;
  telegramId: number;
  phone: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: Date;
}
