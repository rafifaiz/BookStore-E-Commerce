import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Publisher } from './entities/publisher.entity.js';
import { CreatePublisherDto } from './dto/create-publisher.dto.js';
import { UpdatePublisherDto } from './dto/update-publisher.dto.js';

@Injectable()
export class PublishersService {
  constructor(
    @InjectRepository(Publisher)
    private readonly publisherRepository: Repository<Publisher>,
  ) {}

  async create(dto: CreatePublisherDto): Promise<Publisher> {
    return await this.publisherRepository.save(
      this.publisherRepository.create(dto),
    );
  }

  async findAll(): Promise<Publisher[]> {
    return await this.publisherRepository.find({
      relations: { books: true },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Publisher> {
    const publisher = await this.publisherRepository.findOne({
      where: { id },
      relations: { books: true },
    });

    if (!publisher) {
      throw new NotFoundException(
        `Penerbit dengan ID ${id} tidak ditemukan.`,
      );
    }

    return publisher;
  }

  async update(
    id: string,
    dto: UpdatePublisherDto,
  ): Promise<Publisher> {
    const publisher = await this.findOne(id);

    this.publisherRepository.merge(publisher, dto);

    return await this.publisherRepository.save(publisher);
  }

  async remove(id: string): Promise<{ message: string; deletedId: string }> {
    const publisher = await this.findOne(id);

    await this.publisherRepository.remove(publisher);

    return {
      message: `Penerbit dengan ID ${id} berhasil dihapus.`,
      deletedId: id,
    };
  }
}
