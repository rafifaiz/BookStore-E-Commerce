import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Author } from './entities/author.entity.js';
import { CreateAuthorDto } from './dto/create-author.dto.js';
import { UpdateAuthorDto } from './dto/update-author.dto.js';

@Injectable()
export class AuthorsService {
  constructor(
    @InjectRepository(Author)
    private readonly authorRepository: Repository<Author>,
  ) {}

  async create(dto: CreateAuthorDto): Promise<Author> {
    return await this.authorRepository.save(
      this.authorRepository.create(dto),
    );
  }

  async findAll(): Promise<Author[]> {
    return await this.authorRepository.find({
      relations: { bookAuthors: { book: true } },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Author> {
    const author = await this.authorRepository.findOne({
      where: { id },
      relations: { bookAuthors: { book: true } },
    });

    if (!author) {
      throw new NotFoundException(
        `Penulis dengan ID ${id} tidak ditemukan.`,
      );
    }

    return author;
  }

  async update(id: string, dto: UpdateAuthorDto): Promise<Author> {
    const author = await this.findOne(id);

    this.authorRepository.merge(author, dto);

    return await this.authorRepository.save(author);
  }

  async remove(id: string): Promise<{ message: string; deletedId: string }> {
    const author = await this.findOne(id);

    await this.authorRepository.remove(author);

    return {
      message: `Penulis dengan ID ${id} berhasil dihapus.`,
      deletedId: id,
    };
  }
}
