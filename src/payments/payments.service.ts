import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Order } from '../orders/entities/order.entity.js';
import { Payment } from './entities/payment.entity.js';
import { CreatePaymentDto } from './dto/create-payment.dto.js';
import { UpdatePaymentDto } from './dto/update-payment.dto.js';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  // 1. CREATE
  async create(dto: CreatePaymentDto): Promise<Payment> {
    const order = await this.orderRepository.findOne({
      where: { id: dto.orderId },
      relations: { payment: true },
    });

    if (!order) {
      throw new NotFoundException(
        `Pesanan dengan ID ${dto.orderId} tidak ditemukan.`,
      );
    }

    if (order.payment) {
      throw new BadRequestException(
        'Pesanan ini sudah memiliki catatan pembayaran.',
      );
    }

    if (order.status === 'cancelled') {
      throw new BadRequestException(
        'Pesanan yang dibatalkan tidak dapat dibayar.',
      );
    }

    // Nominal pembayaran mengikuti total pesanan.
    return await this.paymentRepository.save(
      this.paymentRepository.create({
        orderId: dto.orderId,
        paymentMethod: dto.paymentMethod,
        amount: Number(order.totalAmount),
        status: 'pending',
      }),
    );
  }

  // 2. READ ALL
  async findAll(status?: string): Promise<Payment[]> {
    const qb = this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.order', 'order')
      .orderBy('payment.createdAt', 'DESC');

    if (status) {
      qb.andWhere('payment.status = :status', { status });
    }

    return await qb.getMany();
  }

  // 3. READ ONE
  async findOne(id: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: { order: { customer: true } },
    });

    if (!payment) {
      throw new NotFoundException(
        `Pembayaran dengan ID ${id} tidak ditemukan.`,
      );
    }

    return payment;
  }

  // 4. UPDATE STATUS
  async update(
    id: string,
    dto: UpdatePaymentDto,
  ): Promise<Payment> {
    const payment = await this.findOne(id);

    if (dto.paymentMethod !== undefined) {
      payment.paymentMethod = dto.paymentMethod;
    }

    if (dto.status !== undefined) {
      if (payment.status === 'success' && dto.status !== 'refunded') {
        throw new BadRequestException(
          'Pembayaran yang sudah berhasil hanya dapat diubah ke status refunded.',
        );
      }

      payment.status = dto.status;

      if (dto.status === 'success') {
        payment.paidAt = new Date();

        // Pembayaran berhasil -> status pesanan menjadi "paid".
        await this.orderRepository.update(
          { id: payment.orderId },
          { status: 'paid' },
        );
      }

      if (dto.status === 'refunded') {
        await this.orderRepository.update(
          { id: payment.orderId },
          { status: 'cancelled' },
        );
      }
    }

    return await this.paymentRepository.save(payment);
  }

  // 5. DELETE
  async remove(id: string): Promise<{ message: string; deletedId: string }> {
    const payment = await this.findOne(id);

    if (payment.status === 'success') {
      throw new BadRequestException(
        'Pembayaran yang sudah berhasil tidak dapat dihapus.',
      );
    }

    await this.paymentRepository.remove(payment);

    return {
      message: `Pembayaran dengan ID ${id} berhasil dihapus.`,
      deletedId: id,
    };
  }
}
