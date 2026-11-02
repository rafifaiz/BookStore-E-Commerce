import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Order } from '../orders/entities/order.entity.js';
import { Shipment } from './entities/shipment.entity.js';
import { CreateShipmentDto } from './dto/create-shipment.dto.js';
import { UpdateShipmentDto } from './dto/update-shipment.dto.js';

@Injectable()
export class ShipmentsService {
  constructor(
    @InjectRepository(Shipment)
    private readonly shipmentRepository: Repository<Shipment>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  // 1. CREATE
  async create(dto: CreateShipmentDto): Promise<Shipment> {
    const order = await this.orderRepository.findOne({
      where: { id: dto.orderId },
      relations: { shipment: true },
    });

    if (!order) {
      throw new NotFoundException(
        `Pesanan dengan ID ${dto.orderId} tidak ditemukan.`,
      );
    }

    if (order.shipment) {
      throw new BadRequestException(
        'Pesanan ini sudah memiliki catatan pengiriman.',
      );
    }

    if (order.status !== 'paid' && order.status !== 'processing') {
      throw new BadRequestException(
        `Pengiriman hanya dapat dibuat untuk pesanan berstatus "paid" atau "processing". Status saat ini: ${order.status}.`,
      );
    }

    return await this.shipmentRepository.save(
      this.shipmentRepository.create({
        orderId: dto.orderId,
        courier: dto.courier,
        trackingNumber: dto.trackingNumber,
        status: 'pending',
      }),
    );
  }

  // 2. READ ALL
  async findAll(status?: string): Promise<Shipment[]> {
    const qb = this.shipmentRepository
      .createQueryBuilder('shipment')
      .leftJoinAndSelect('shipment.order', 'order')
      .orderBy('shipment.createdAt', 'DESC');

    if (status) {
      qb.andWhere('shipment.status = :status', { status });
    }

    return await qb.getMany();
  }

  // 3. READ ONE
  async findOne(id: string): Promise<Shipment> {
    const shipment = await this.shipmentRepository.findOne({
      where: { id },
      relations: { order: { customer: true } },
    });

    if (!shipment) {
      throw new NotFoundException(
        `Pengiriman dengan ID ${id} tidak ditemukan.`,
      );
    }

    return shipment;
  }

  // 4. UPDATE
  async update(
    id: string,
    dto: UpdateShipmentDto,
  ): Promise<Shipment> {
    const shipment = await this.findOne(id);

    if (dto.courier !== undefined) {
      shipment.courier = dto.courier;
    }

    if (dto.trackingNumber !== undefined) {
      shipment.trackingNumber = dto.trackingNumber;
    }

    if (dto.status !== undefined) {
      if (shipment.status === 'delivered' && dto.status !== 'returned') {
        throw new BadRequestException(
          'Pengiriman yang sudah diterima hanya dapat diubah ke status returned.',
        );
      }

      shipment.status = dto.status;

      if (dto.status === 'in_transit' && !shipment.shippedAt) {
        shipment.shippedAt = new Date();

        // Pesanan menjadi "shipped" saat barang mulai dikirim.
        await this.orderRepository.update(
          { id: shipment.orderId },
          { status: 'shipped' },
        );
      }

      if (dto.status === 'delivered') {
        if (!shipment.shippedAt) {
          shipment.shippedAt = new Date();
        }

        shipment.deliveredAt = new Date();

        await this.orderRepository.update(
          { id: shipment.orderId },
          { status: 'completed' },
        );
      }
    }

    return await this.shipmentRepository.save(shipment);
  }

  // 5. DELETE
  async remove(id: string): Promise<{ message: string; deletedId: string }> {
    const shipment = await this.findOne(id);

    if (shipment.status === 'delivered') {
      throw new BadRequestException(
        'Pengiriman yang sudah diterima tidak dapat dihapus.',
      );
    }

    await this.shipmentRepository.remove(shipment);

    return {
      message: `Pengiriman dengan ID ${id} berhasil dihapus.`,
      deletedId: id,
    };
  }
}
