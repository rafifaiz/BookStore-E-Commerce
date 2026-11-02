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

import { PublishersService } from './publishers.service.js';
import { CreatePublisherDto } from './dto/create-publisher.dto.js';
import { UpdatePublisherDto } from './dto/update-publisher.dto.js';

@Controller('publishers')
export class PublishersController {
  constructor(private readonly publishersService: PublishersService) {}

  // 1. GET /publishers
  @Get()
  findAll() {
    return this.publishersService.findAll();
  }

  // 2. GET /publishers/:id
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.publishersService.findOne(id);
  }

  // 3. POST /publishers
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createPublisherDto: CreatePublisherDto) {
    return this.publishersService.create(createPublisherDto);
  }

  // 4. PUT /publishers/:id
  @Put(':id')
  replace(
    @Param('id') id: string,
    @Body() createPublisherDto: CreatePublisherDto,
  ) {
    return this.publishersService.update(id, createPublisherDto);
  }

  // 5. PATCH /publishers/:id
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePublisherDto: UpdatePublisherDto,
  ) {
    return this.publishersService.update(id, updatePublisherDto);
  }

  // 6. DELETE /publishers/:id
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.publishersService.remove(id);
  }
}
