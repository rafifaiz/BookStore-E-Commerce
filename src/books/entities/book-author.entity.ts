import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import { Author } from '../../authors/entities/author.entity.js';
import { Book } from './book.entity.js';

/**
 * Tabel junction untuk relasi many-to-many books <-> authors.
 * Primary key berupa gabungan (book_id, author_id) sehingga satu buku
 * tidak bisa memiliki penulis yang sama dua kali.
 */
@Entity('book_authors')
export class BookAuthor {
  @PrimaryColumn({ type: 'uuid', name: 'book_id' })
  bookId: string;

  @PrimaryColumn({ type: 'uuid', name: 'author_id' })
  authorId: string;

  @ManyToOne(() => Book, (book) => book.bookAuthors, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'book_id' })
  book?: Book;

  @ManyToOne(() => Author, (author) => author.bookAuthors, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'author_id' })
  author?: Author;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
