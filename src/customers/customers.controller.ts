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

import { CustomersService } from './customers.service.js';
import { CreateCustomerDto } from './dto/create-customer.dto.js';
import { UpdateCustomerDto } from './dto/update-customer.dto.js';
import { CreateCustomerAddressDto } from './dto/create-customer-address.dto.js';
import { UpdateCustomerAddressDto } from './dto/update-customer-address.dto.js';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  // ============ PELANGGAN ============

  // 1. GET /customers?search=
  @Get()
  findAll(@Query('search') search?: string) {
    return this.customersService.findAll(search);
  }

  // 2. GET /customers/:id
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.customersService.findOne(id);
  }

  // 3. POST /customers
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createCustomerDto: CreateCustomerDto) {
    return this.customersService.create(createCustomerDto);
  }

  // 4. PUT /customers/:id
  @Put(':id')
  replace(
    @Param('id') id: string,
    @Body() createCustomerDto: CreateCustomerDto,
  ) {
    return this.customersService.update(id, createCustomerDto);
  }

  // 5. PATCH /customers/:id
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ) {
    return this.customersService.update(id, updateCustomerDto);
  }

  // 6. DELETE /customers/:id (soft delete)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.customersService.remove(id);
  }

  // ============ ALAMAT PELANGGAN ============

  // 7. GET /customers/:id/addresses
  @Get(':id/addresses')
  findAddresses(@Param('id') id: string) {
    return this.customersService.findAddresses(id);
  }

  // 8. GET /customers/:id/addresses/:addressId
  @Get(':id/addresses/:addressId')
  findAddress(
    @Param('id') id: string,
    @Param('addressId') addressId: string,
  ) {
    return this.customersService.findAddress(id, addressId);
  }

  // 9. POST /customers/:id/addresses
  @Post(':id/addresses')
  @HttpCode(HttpStatus.CREATED)
  addAddress(
    @Param('id') id: string,
    @Body() createAddressDto: CreateCustomerAddressDto,
  ) {
    return this.customersService.addAddress({
      ...createAddressDto,
      customerId: id,
    });
  }

  // 10. PATCH /customers/:id/addresses/:addressId
  @Patch(':id/addresses/:addressId')
  updateAddress(
    @Param('id') id: string,
    @Param('addressId') addressId: string,
    @Body() updateAddressDto: UpdateCustomerAddressDto,
  ) {
    return this.customersService.updateAddress(
      id,
      addressId,
      updateAddressDto,
    );
  }

  // 11. DELETE /customers/:id/addresses/:addressId
  @Delete(':id/addresses/:addressId')
  @HttpCode(HttpStatus.OK)
  removeAddress(
    @Param('id') id: string,
    @Param('addressId') addressId: string,
  ) {
    return this.customersService.removeAddress(id, addressId);
  }
}
