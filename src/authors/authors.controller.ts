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
} from '@nestjs/common';

import { AuthorsService } from './authors.service.js';
import { CreateAuthorDto } from './dto/create-author.dto.js';
import { UpdateAuthorDto } from './dto/update-author.dto.js';

@Controller('authors')
export class AuthorsController {
  constructor(private readonly authorsService: AuthorsService) {}

  // 1. GET /authors
  @Get()
  findAll() {
    return this.authorsService.findAll();
  }

  // 2. GET /authors/:id
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.authorsService.findOne(id);
  }

  // 3. POST /authors
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createAuthorDto: CreateAuthorDto) {
    return this.authorsService.create(createAuthorDto);
  }

  // 4. PUT /authors/:id
  @Put(':id')
  replace(
    @Param('id') id: string,
    @Body() createAuthorDto: CreateAuthorDto,
  ) {
    return this.authorsService.update(id, createAuthorDto);
  }

  // 5. PATCH /authors/:id
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateAuthorDto: UpdateAuthorDto,
  ) {
    return this.authorsService.update(id, updateAuthorDto);
  }

  // 6. DELETE /authors/:id
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.authorsService.remove(id);
  }
}
