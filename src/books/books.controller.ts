import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';

import { BooksService } from './books.service.js';
import { CreateBookDto } from './dto/create-book.dto.js';
import { UpdateBookDto } from './dto/update-book.dto.js';

@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  // 1. GET /books?search=&categoryId=
  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.booksService.findAll(search, categoryId);
  }

  // 2. GET /books/:id
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.booksService.findOne(id);
  }

  // 3. POST /books
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createBookDto: CreateBookDto) {
    return this.booksService.create(createBookDto);
  }

  // 4. PUT /books/:id
  @Put(':id')
  replace(
    @Param('id') id: string,
    @Body() createBookDto: CreateBookDto,
  ) {
    return this.booksService.update(id, createBookDto);
  }

  // 5. PATCH /books/:id
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateBookDto: UpdateBookDto,
  ) {
    return this.booksService.update(id, updateBookDto);
  }

  // 6. PATCH /books/:id/stock (restock / koreksi stok)
  @Patch(':id/stock')
  adjustStock(
    @Param('id') id: string,
    @Body('delta') delta: number,
  ) {
    return this.booksService.adjustStock(id, Number(delta));
  }

  // 7. DELETE /books/:id (soft delete)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.booksService.remove(id);
  }
}
