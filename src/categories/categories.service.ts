import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Category } from './entities/category.entity.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async create(dto: CreateCategoryDto): Promise<Category> {
    const existing = await this.categoryRepository.findOne({
      where: { name: dto.name },
    });

    if (existing) {
      throw new BadRequestException(
        `Kategori "${dto.name}" sudah ada.`,
      );
    }

    return await this.categoryRepository.save(
      this.categoryRepository.create(dto),
    );
  }

  async findAll(): Promise<Category[]> {
    return await this.categoryRepository.find({
      relations: { books: true },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: { books: true },
    });

    if (!category) {
      throw new NotFoundException(
        `Kategori dengan ID ${id} tidak ditemukan.`,
      );
    }

    return category;
  }

  async update(
    id: string,
    dto: UpdateCategoryDto,
  ): Promise<Category> {
    const category = await this.findOne(id);

    if (dto.name !== undefined && dto.name !== category.name) {
      const existing = await this.categoryRepository.findOne({
        where: { name: dto.name },
      });

      if (existing) {
        throw new BadRequestException(
          `Kategori "${dto.name}" sudah ada.`,
        );
      }
    }

    this.categoryRepository.merge(category, dto);

    return await this.categoryRepository.save(category);
  }

  async remove(id: string): Promise<{ message: string; deletedId: string }> {
    const category = await this.findOne(id);

    await this.categoryRepository.remove(category);

    return {
      message: `Kategori dengan ID ${id} berhasil dihapus.`,
      deletedId: id,
    };
  }
}
