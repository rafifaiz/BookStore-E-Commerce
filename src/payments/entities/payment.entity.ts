import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Order } from '../../orders/entities/order.entity.js';
import { decimalTransformer } from '../../common/transformers/decimal.transformer.js';

export const PAYMENT_STATUSES = [
  'pending',
  'success',
  'failed',
  'refunded',
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * UNIQUE karena rancangan sederhana: satu pesanan hanya boleh
   * memiliki satu catatan pembayaran.
   */
  @Column({ type: 'uuid', name: 'order_id', unique: true })
  orderId: string;

  @Column({ type: 'varchar', length: 50 })
  paymentMethod: string;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  amount: number;

  @Column({ type: 'varchar', length: 30, default: 'pending' })
  status: PaymentStatus;

  @Column({ type: 'timestamptz', nullable: true })
  paidAt?: Date | null;

  @OneToOne(() => Order, (order) => order.payment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order?: Order;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
