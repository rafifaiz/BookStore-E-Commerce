import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Order } from '../../orders/entities/order.entity.js';

export const SHIPMENT_STATUSES = [
  'pending',
  'in_transit',
  'delivered',
  'returned',
] as const;

export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number];

@Entity('shipments')
export class Shipment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * UNIQUE karena rancangan sederhana: satu pesanan memiliki maksimal
   * satu shipments.
   */
  @Column({ type: 'uuid', name: 'order_id', unique: true })
  orderId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  courier?: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  trackingNumber?: string | null;

  @Column({ type: 'varchar', length: 30, default: 'pending' })
  status: ShipmentStatus;

  @Column({ type: 'timestamptz', nullable: true })
  shippedAt?: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  deliveredAt?: Date | null;

  @OneToOne(() => Order, (order) => order.shipment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order?: Order;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
