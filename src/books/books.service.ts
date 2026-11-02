import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { Book } from './entities/book.entity.js';
import { BookAuthor } from './entities/book-author.entity.js';
import { Author } from '../authors/entities/author.entity.js';
import { CreateBookDto } from './dto/create-book.dto.js';
import { UpdateBookDto } from './dto/update-book.dto.js';

@Injectable()
export class BooksService {
  constructor(
    @InjectRepository(Book)
    private readonly bookRepository: Repository<Book>,
    @InjectRepository(Author)
    private readonly authorRepository: Repository<Author>,
    @InjectRepository(BookAuthor)
    private readonly bookAuthorRepository: Repository<BookAuthor>,
  ) {}

  // 1. CREATE
  async create(dto: CreateBookDto): Promise<Book> {
    const { authorIds, ...bookData } = dto;

    const newBook = this.bookRepository.create({
      ...bookData,
      price: dto.price ?? 0,
      stock: dto.stock ?? 0,
      isAvailable: true,
    });

    const savedBook = await this.bookRepository.save(newBook);

    if (authorIds?.length) {
      await this.syncAuthors(savedBook.id, authorIds);
    }

    return this.findOne(savedBook.id);
  }

  // 2. READ ALL
  async findAll(search?: string, categoryId?: string): Promise<Book[]> {
    const qb = this.bookRepository
      .createQueryBuilder('book')
      .leftJoinAndSelect('book.bookAuthors', 'bookAuthors')
      .leftJoinAndSelect('bookAuthors.author', 'author')
      .leftJoinAndSelect('book.category', 'category')
      .leftJoinAndSelect('book.publisher', 'publisher');

    if (search?.trim()) {
      const keyword = `%${search.trim()}%`;

      qb.andWhere(
        '(book.title ILIKE :keyword OR book.isbn ILIKE :keyword OR author.name ILIKE :keyword)',
        { keyword },
      );
    }

    if (categoryId) {
      qb.andWhere('book.categoryId = :categoryId', { categoryId });
    }

    return await qb.getMany();
  }

  // 3. READ ONE
  async findOne(id: string): Promise<Book> {
    const book = await this.bookRepository.findOne({
      where: { id },
      relations: { bookAuthors: { author: true }, category: true, publisher: true },
    });

    if (!book) {
      throw new NotFoundException(`Buku dengan ID ${id} tidak ditemukan.`);
    }

    return book;
  }

  // 4. UPDATE
  async update(id: string, dto: UpdateBookDto): Promise<Book> {
    const book = await this.findOne(id);
    const { authorIds, ...bookData } = dto;

    if (dto.isbn !== undefined && dto.isbn !== book.isbn) {
      const existingBook = await this.bookRepository.findOne({
        where: { isbn: dto.isbn },
      });

      if (existingBook) {
        throw new BadRequestException(
          'ISBN sudah digunakan oleh buku lain.',
        );
      }
    }

    if (dto.stock !== undefined && dto.stock < 0) {
      throw new BadRequestException('Stok tidak boleh negatif.');
    }

    // isAvailable harus sinkron dengan keberadaan stok.
    if (dto.stock !== undefined) {
      bookData.isAvailable = dto.stock > 0;
    }

    this.bookRepository.merge(book, bookData);
    await this.bookRepository.save(book);

    if (authorIds !== undefined) {
      await this.syncAuthors(book.id, authorIds);
    }

    return this.findOne(id);
  }

  // 5. DELETE (soft delete, kolom deleted_at)
  async remove(id: string): Promise<{ message: string; deletedId: string }> {
    const book = await this.findOne(id);

    await this.bookRepository.softRemove(book);

    return {
      message: `Buku dengan ID ${id} berhasil dihapus.`,
      deletedId: id,
    };
  }

  // 6. RESTOCK / SESUAIKAN STOK
  async adjustStock(
    id: string,
    delta: number,
  ): Promise<Book> {
    const book = await this.findOne(id);
    const newStock = book.stock + delta;

    if (newStock < 0) {
      throw new BadRequestException(
        `Stok buku "${book.title}" tidak mencukupi. Stok saat ini: ${book.stock}.`,
      );
    }

    book.stock = newStock;
    book.isAvailable = newStock > 0;

    await this.bookRepository.save(book);

    return book;
  }

  /**
   * Menyinkronkan isi tabel book_authors untuk sebuah buku.
   * Relasi many-to-many ditulis eksplisit lewat tabel junction
   * agar primary key gabungan (book_id, author_id) tetap terjaga.
   */
  private async syncAuthors(
    bookId: string,
    authorIds: string[],
  ): Promise<void> {
    const uniqueIds = [...new Set(authorIds)];

    const authors = await this.authorRepository.find({
      where: { id: In(uniqueIds) },
    });

    if (authors.length !== uniqueIds.length) {
      throw new BadRequestException(
        'Sebagian ID penulis tidak ditemukan di tabel authors.',
      );
    }

    await this.bookAuthorRepository.delete({ bookId });

    if (authors.length > 0) {
      await this.bookAuthorRepository.save(
        authors.map((author) =>
          this.bookAuthorRepository.create({
            bookId,
            authorId: author.id,
          }),
        ),
      );
    }
  }
}
