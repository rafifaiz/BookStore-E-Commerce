import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Book } from '../../books/entities/book.entity.js';
import { Order } from './order.entity.js';
import { decimalTransformer } from '../../common/transformers/decimal.transformer.js';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'order_id' })
  orderId: string;

  @Column({ type: 'uuid', name: 'book_id' })
  bookId: string;

  @Column({ type: 'int' })
  quantity: number;

  /**
   * Snapshot harga satuan saat transaksi, bukan duplikasi books.price.
   * Harga katalog boleh berubah, riwayat transaksi tidak.
   */
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  price: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
  })
  subtotal: number;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order?: Order;

  @ManyToOne(() => Book, (book) => book.orderItems, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'book_id' })
  book?: Book;
}
