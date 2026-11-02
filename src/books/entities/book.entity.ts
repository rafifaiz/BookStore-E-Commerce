import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { BookAuthor } from './book-author.entity.js';
import { Category } from '../../categories/entities/category.entity.js';
import { OrderItem } from '../../orders/entities/order-item.entity.js';
import { Publisher } from '../../publishers/entities/publisher.entity.js';
import { decimalTransformer } from '../../common/transformers/decimal.transformer.js';

@Entity('books')
export class Book {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 150 })
  title: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 45 })
  isbn: string;

  @Column({ type: 'int', default: 0 })
  publishedYear: number;

  @Column({ type: 'boolean', default: true })
  isAvailable: boolean;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  price: number;

  @Column({ type: 'int', default: 0 })
  stock: number;

  // categories (1) -> (N) books
  @Column({ type: 'uuid', name: 'category_id', nullable: true })
  categoryId: string | null;

  @ManyToOne(() => Category, (category) => category.books, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'category_id' })
  category?: Category;

  // publishers (1) -> (N) books
  @Column({ type: 'uuid', name: 'publisher_id', nullable: true })
  publisherId: string | null;

  @ManyToOne(() => Publisher, (publisher) => publisher.books, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'publisher_id' })
  publisher?: Publisher;

  // books (N) <-> (N) authors, melalui tabel junction book_authors.
  @OneToMany(() => BookAuthor, (bookAuthor) => bookAuthor.book)
  bookAuthors?: BookAuthor[];

  @OneToMany(() => OrderItem, (orderItem) => orderItem.book)
  orderItems?: OrderItem[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date | null;
}
