import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Customer } from '../../customers/entities/customer.entity.js';
import { OrderItem } from './order-item.entity.js';
import { Payment } from '../../payments/entities/payment.entity.js';
import { Shipment } from '../../shipments/entities/shipment.entity.js';
import { decimalTransformer } from '../../common/transformers/decimal.transformer.js';

export const ORDER_STATUSES = [
  'pending',
  'paid',
  'processing',
  'shipped',
  'completed',
  'cancelled',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 50 })
  orderNumber: string;

  @Column({ type: 'uuid', name: 'customer_id' })
  customerId: string;

  @Column({ type: 'varchar', length: 30, default: 'pending' })
  status: OrderStatus;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  totalAmount: number;

  // Snapshot alamat pengiriman saat checkout.
  // Perubahan alamat pada customers tidak boleh mengubah riwayat pesanan lama.
  @Column({ type: 'varchar', length: 150, nullable: true })
  recipientName?: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  recipientPhone?: string | null;

  @Column({ type: 'text', nullable: true })
  shippingAddress?: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  shippingCity?: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  shippingPostalCode?: string | null;

  @ManyToOne(() => Customer, (customer) => customer.orders, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'customer_id' })
  customer?: Customer;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.order, {
    cascade: ['insert'],
  })
  items?: OrderItem[];

  @OneToOne(() => Payment, (payment) => payment.order)
  payment?: Payment;

  @OneToOne(() => Shipment, (shipment) => shipment.order)
  shipment?: Shipment;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
