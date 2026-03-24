// src/app/core/models/order.model.ts

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'SERVED' | 'PAID' | 'CANCELLED';
export type OrderType   = 'TABLE' | 'TAKEAWAY';
export type PaymentMethod = 'CASH' | 'CARD' | 'CHEQUE' | 'OTHER';

export interface OrderItem {
  '@id'?:             string;
  id?:                number;
  itemType:           'PRODUCT' | 'PACK';
  itemId:             number;
  itemName:           string;
  unitPrice:          number;
  finalPrice:         number;
  quantity:           number;
  notes?:             string;
  appliedPromotions?: any[];
}

export interface Order {
  '@id'?:       string;
  id?:          number;
  orderNumber?: string;
  type:         OrderType;
  status:       OrderStatus;
  table?:       string | null;
  tableName?:   string;
  waiter?:      any;
  items:        OrderItem[];
  subtotal:     number;
  discount:     number;
  total:        number;
  notes?:       string;
  createdAt?:   string;
  updatedAt?:   string;
}

export interface RestaurantTable {
  '@id'?:    string;
  id?:       number;
  name:      string;
  capacity:  number;
  isActive:  boolean;
  qrToken?:  string;
}

export interface Invoice {
  '@id'?:          string;
  id?:             number;
  invoiceNumber?:  string;
  order?:          any;
  waiter?:         any;
  itemsSnapshot:   any[];
  subtotal:        number;
  discount:        number;
  total:           number;
  paymentMethod?:  PaymentMethod;
  status:          'PENDING' | 'PAID' | 'CANCELLED';
  paidAt?:         string;
  notes?:          string;
  establishment?:  any;
  createdAt?:      string;
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING:   'En attente',
  CONFIRMED: 'Confirmée',
  SERVED:    'Servie',
  PAID:      'Payée',
  CANCELLED: 'Annulée',
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING:   '#f59e0b',
  CONFIRMED: '#6366f1',
  SERVED:    '#10b981',
  PAID:      '#059669',
  CANCELLED: '#ef4444',
};

export const ORDER_STATUS_NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
  PENDING:   'CONFIRMED',
  CONFIRMED: 'SERVED',
  SERVED:    'PAID',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH:   'Espèces',
  CARD:   'Carte bancaire',
  CHEQUE: 'Chèque',
  OTHER:  'Autre',
};
