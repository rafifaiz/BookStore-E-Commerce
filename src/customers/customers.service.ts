import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';

import { Customer } from './entities/customer.entity.js';
import { CustomerAddress } from './entities/customer-address.entity.js';
import { CreateCustomerDto } from './dto/create-customer.dto.js';
import { UpdateCustomerDto } from './dto/update-customer.dto.js';
import { CreateCustomerAddressDto } from './dto/create-customer-address.dto.js';
import { UpdateCustomerAddressDto } from './dto/update-customer-address.dto.js';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(CustomerAddress)
    private readonly addressRepository: Repository<CustomerAddress>,
  ) {}

  // ============ PELANGGAN ============

  async create(dto: CreateCustomerDto): Promise<Customer> {
    const existing = await this.customerRepository.findOne({
      where: { email: dto.email },
    });

    if (existing) {
      throw new BadRequestException(
        `Email ${dto.email} sudah terdaftar.`,
      );
    }

    return await this.customerRepository.save(
      this.customerRepository.create(dto),
    );
  }

  async findAll(search?: string): Promise<Customer[]> {
    if (search?.trim()) {
      const keyword = `%${search.trim()}%`;

      return await this.customerRepository.find({
        where: [
          { name: ILike(keyword) },
          { email: ILike(keyword) },
          { phone: ILike(keyword) },
        ],
        relations: { addresses: true },
      });
    }

    return await this.customerRepository.find({
      relations: { addresses: true },
    });
  }

  async findOne(id: string): Promise<Customer> {
    const customer = await this.customerRepository.findOne({
      where: { id },
      relations: { addresses: true, orders: true },
    });

    if (!customer) {
      throw new NotFoundException(
        `Pelanggan dengan ID ${id} tidak ditemukan.`,
      );
    }

    return customer;
  }

  async update(
    id: string,
    dto: UpdateCustomerDto,
  ): Promise<Customer> {
    const customer = await this.findOne(id);

    if (dto.email !== undefined && dto.email !== customer.email) {
      const existing = await this.customerRepository.findOne({
        where: { email: dto.email },
      });

      if (existing) {
        throw new BadRequestException(
          `Email ${dto.email} sudah terdaftar.`,
        );
      }
    }

    this.customerRepository.merge(customer, dto);

    return await this.customerRepository.save(customer);
  }

  async remove(id: string): Promise<{ message: string; deletedId: string }> {
    const customer = await this.findOne(id);

    await this.customerRepository.softRemove(customer);

    return {
      message: `Pelanggan dengan ID ${id} berhasil dihapus.`,
      deletedId: id,
    };
  }

  // ============ ALAMAT PELANGGAN ============

  async addAddress(
    dto: CreateCustomerAddressDto,
  ): Promise<CustomerAddress> {
    const customer = await this.customerRepository.findOne({
      where: { id: dto.customerId },
    });

    if (!customer) {
      throw new NotFoundException(
        `Pelanggan dengan ID ${dto.customerId} tidak ditemukan.`,
      );
    }

    return await this.addressRepository.save(
      this.addressRepository.create(dto),
    );
  }

  async findAddresses(customerId: string): Promise<CustomerAddress[]> {
    await this.findOne(customerId);

    return await this.addressRepository.find({
      where: { customerId },
      order: { createdAt: 'DESC' },
    });
  }

  async findAddress(
    customerId: string,
    addressId: string,
  ): Promise<CustomerAddress> {
    const address = await this.addressRepository.findOne({
      where: { id: addressId, customerId },
    });

    if (!address) {
      throw new NotFoundException(
        `Alamat dengan ID ${addressId} tidak ditemukan.`,
      );
    }

    return address;
  }

  async updateAddress(
    customerId: string,
    addressId: string,
    dto: UpdateCustomerAddressDto,
  ): Promise<CustomerAddress> {
    const address = await this.findAddress(customerId, addressId);

    this.addressRepository.merge(address, dto);

    return await this.addressRepository.save(address);
  }

  async removeAddress(
    customerId: string,
    addressId: string,
  ): Promise<{ message: string; deletedId: string }> {
    const address = await this.findAddress(customerId, addressId);

    await this.addressRepository.remove(address);

    return {
      message: `Alamat dengan ID ${addressId} berhasil dihapus.`,
      deletedId: addressId,
    };
  }
}
