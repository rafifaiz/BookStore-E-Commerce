import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { vi } from 'vitest';

import { BooksService } from './books.service.js';
import { Book } from './entities/book.entity.js';
import { BookAuthor } from './entities/book-author.entity.js';
import { Author } from '../authors/entities/author.entity.js';

describe('BooksService', () => {
  let service: BooksService;
  let bookRepository: any;
  let bookAuthorRepository: any;

  const mockBook: Book = {
    id: '11111111-1111-1111-1111-111111111111',
    title: 'Clean Code',
    isbn: '978-0132350884',
    publishedYear: 2008,
    isAvailable: true,
    price: 150000,
    stock: 10,
    categoryId: null,
    publisherId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockAuthor: Author = {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Robert C. Martin',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BooksService,
        {
          provide: getRepositoryToken(Book),
          useValue: {
            create: vi.fn(),
            save: vi.fn(),
            find: vi.fn(),
            findOne: vi.fn(),
            merge: vi.fn(),
            softRemove: vi.fn(),
            remove: vi.fn(),
            createQueryBuilder: vi.fn(() => ({
              leftJoinAndSelect: vi.fn().mockReturnThis(),
              andWhere: vi.fn().mockReturnThis(),
              getMany: vi.fn().mockResolvedValue([mockBook]),
            })),
            decrement: vi.fn(),
            update: vi.fn(),
            increment: vi.fn(),
          },
        },
        {
          provide: getRepositoryToken(Author),
          useValue: {
            find: vi.fn().mockResolvedValue([mockAuthor]),
          },
        },
        {
          provide: getRepositoryToken(BookAuthor),
          useValue: {
            delete: vi.fn(),
            create: vi.fn((data) => data),
            save: vi.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<BooksService>(BooksService);
    bookRepository = module.get(getRepositoryToken(Book));
    bookAuthorRepository = module.get(getRepositoryToken(BookAuthor));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // CREATE
  it('should create a book', async () => {
    bookRepository.create.mockReturnValue({ ...mockBook });
    bookRepository.save.mockResolvedValue({ ...mockBook });
    bookRepository.findOne.mockResolvedValue({ ...mockBook });
    bookAuthorRepository.save.mockResolvedValue([]);

    const result = await service.create({
      title: 'Clean Code',
      isbn: '978-0132350884',
      publishedYear: 2008,
      price: 150000,
      stock: 10,
    });

    expect(result).toBeDefined();
    expect(bookRepository.create).toHaveBeenCalled();
    expect(bookRepository.save).toHaveBeenCalled();
  });

  // READ ALL
  it('should return all books', async () => {
    const result = await service.findAll();

    expect(result).toEqual([mockBook]);
    expect(bookRepository.createQueryBuilder).toHaveBeenCalled();
  });

  // READ ONE
  it('should return one book by ID', async () => {
    bookRepository.findOne.mockResolvedValue({ ...mockBook });

    const result = await service.findOne(mockBook.id);

    expect(result.id).toBe(mockBook.id);
    expect(bookRepository.findOne).toHaveBeenCalledWith({
      where: { id: mockBook.id },
      relations: { bookAuthors: { author: true }, category: true, publisher: true },
    });
  });

  it('should throw NotFoundException if book does not exist', async () => {
    bookRepository.findOne.mockResolvedValue(null);

    await expect(
      service.findOne('nonexistent-id'),
    ).rejects.toThrow(NotFoundException);
  });

  // UPDATE
  it('should update a book', async () => {
    const updatedBook = { ...mockBook, title: 'Clean Code Updated' };

    bookRepository.findOne
      .mockResolvedValueOnce({ ...mockBook })
      .mockResolvedValueOnce(updatedBook);
    bookRepository.merge.mockReturnValue(updatedBook);
    bookRepository.save.mockResolvedValue(updatedBook);

    const result = await service.update(mockBook.id, {
      title: 'Clean Code Updated',
    });

    expect(result.title).toBe('Clean Code Updated');
  });

  // DELETE (soft delete)
  it('should soft delete a book', async () => {
    bookRepository.findOne.mockResolvedValue({ ...mockBook });
    bookRepository.softRemove.mockResolvedValue({ ...mockBook });

    const result = await service.remove(mockBook.id);

    expect(result.message).toContain('berhasil dihapus');
    expect(bookRepository.softRemove).toHaveBeenCalled();
  });

  // ADJUST STOCK
  it('should increase stock', async () => {
    const bookWithStock = { ...mockBook, stock: 10 };

    bookRepository.findOne.mockResolvedValue({ ...bookWithStock });
    bookRepository.save.mockResolvedValue({ ...bookWithStock, stock: 15 });

    const result = await service.adjustStock(mockBook.id, 5);

    expect(result.stock).toBe(15);
  });

  it('should reject stock adjustment that would result in negative stock', async () => {
    const bookWithStock = { ...mockBook, stock: 3 };

    bookRepository.findOne.mockResolvedValue({ ...bookWithStock });

    await expect(
      service.adjustStock(mockBook.id, -5),
    ).rejects.toThrow('Stok buku');
  });
});
