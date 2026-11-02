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
  Query,
} from '@nestjs/common';

import { ShipmentsService } from './shipments.service.js';
import { CreateShipmentDto } from './dto/create-shipment.dto.js';
import { UpdateShipmentDto } from './dto/update-shipment.dto.js';

@Controller('shipments')
export class ShipmentsController {
  constructor(private readonly shipmentsService: ShipmentsService) {}

  // 1. GET /shipments?status=
  @Get()
  findAll(@Query('status') status?: string) {
    return this.shipmentsService.findAll(status);
  }

  // 2. GET /shipments/:id
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.shipmentsService.findOne(id);
  }

  // 3. POST /shipments
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createShipmentDto: CreateShipmentDto) {
    return this.shipmentsService.create(createShipmentDto);
  }

  // 4. PATCH /shipments/:id
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateShipmentDto: UpdateShipmentDto,
  ) {
    return this.shipmentsService.update(id, updateShipmentDto);
  }

  // 5. DELETE /shipments/:id
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.shipmentsService.remove(id);
  }
}
