// Payment types
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

export interface Payment {
  id: string;
  registrationId: string;
  registration?: {
    id: string;
    tournament: {
      id: string;
      name: string;
    };
    club: {
      id: string;
      name: string;
    };
  };
  amount: number;
  currency: string;
  status: PaymentStatus;
  stripePaymentIntentId?: string;
  stripeCustomerId?: string;
  refundedAt?: string;
  refundReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentIntentDto {
  registrationId: string;
}

export interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
}

export interface PaymentFilters {
  status?: PaymentStatus;
  tournamentId?: string;
  userId?: string;
  page?: number;
  limit?: number;
}

export interface PaymentReport {
  totalAmount: number;
  currency: string;
  transactionCount: number;
  byStatus: Record<PaymentStatus, number>;
  byDate: Array<{
    date: string;
    amount: number;
    count: number;
  }>;
}
