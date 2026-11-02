import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';

import { Book } from '../books/entities/book.entity.js';
import { Customer } from '../customers/entities/customer.entity.js';
import { CustomerAddress } from '../customers/entities/customer-address.entity.js';
import { Order, OrderStatus } from './entities/order.entity.js';
import { OrderItem } from './entities/order-item.entity.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { UpdateOrderDto } from './dto/update-order.dto.js';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Book)
    private readonly bookRepository: Repository<Book>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(CustomerAddress)
    private readonly addressRepository: Repository<CustomerAddress>,
    private readonly dataSource: DataSource,
  ) {}

  // 1. CREATE / CHECKOUT
  async create(dto: CreateOrderDto): Promise<Order> {
    const customer = await this.customerRepository.findOne({
      where: { id: dto.customerId },
    });

    if (!customer) {
      throw new NotFoundException(
        `Pelanggan dengan ID ${dto.customerId} tidak ditemukan.`,
      );
    }

    if (!dto.items?.length) {
      throw new BadRequestException(
        'Pesanan harus memiliki minimal satu item.',
      );
    }

    const bookIds = [...new Set(dto.items.map((item) => item.bookId))];

    const books = await this.bookRepository.find({
      where: { id: In(bookIds) },
    });

    if (books.length !== bookIds.length) {
      throw new NotFoundException(
        'Sebagian buku pada pesanan tidak ditemukan.',
      );
    }

    // Validasi stok sebelum transaksi database dimulai.
    for (const item of dto.items) {
      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        throw new BadRequestException(
          'Jumlah buku harus berupa bilangan bulat positif.',
        );
      }

      const book = books.find((b) => b.id === item.bookId)!;

      if (book.stock < item.quantity) {
        throw new BadRequestException(
          `Stok buku "${book.title}" tidak cukup. Tersedia ${book.stock}, diminta ${item.quantity}.`,
        );
      }
    }

    // Snapshot alamat pengiriman saat checkout.
    const addressSnapshot = await this.buildAddressSnapshot(dto);

    // Harga pada order_items adalah snapshot harga katalog saat transaksi.
    const itemSnapshots = dto.items.map((item) => {
      const book = books.find((b) => b.id === item.bookId)!;
      const price = Number(book.price);

      return {
        bookId: item.bookId,
        quantity: item.quantity,
        price,
        subtotal: price * item.quantity,
      };
    });

    const totalAmount = itemSnapshots.reduce(
      (sum, item) => sum + item.subtotal,
      0,
    );

    const createdOrder = await this.dataSource.transaction(async (manager) => {
      const order = await manager.save(
        manager.create(Order, {
          orderNumber: this.generateOrderNumber(),
          customerId: dto.customerId,
          status: 'pending',
          totalAmount,
          ...addressSnapshot,
        }),
      );

      await manager.save(
        OrderItem,
        itemSnapshots.map((item) =>
          manager.create(OrderItem, { ...item, orderId: order.id }),
        ),
      );

      // Kurangi stok dan sinkronkan isAvailable.
      for (const item of itemSnapshots) {
        await manager.decrement(Book, { id: item.bookId }, 'stock', item.quantity);

        const book = books.find((b) => b.id === item.bookId)!;

        if (book.stock - item.quantity <= 0) {
          await manager.update(Book, { id: item.bookId }, { isAvailable: false });
        }
      }

      return order;
    });

    return this.findOne(createdOrder.id);
  }

  // 2. READ ALL
  async findAll(status?: string, customerId?: string): Promise<Order[]> {
    const qb = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.customer', 'customer')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.book', 'book')
      .orderBy('order.createdAt', 'DESC');

    if (status) {
      qb.andWhere('order.status = :status', { status });
    }

    if (customerId) {
      qb.andWhere('order.customerId = :customerId', { customerId });
    }

    return await qb.getMany();
  }

  // 3. READ ONE
  async findOne(id: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: {
        customer: true,
        items: { book: true },
        payment: true,
        shipment: true,
      },
    });

    if (!order) {
      throw new NotFoundException(
        `Pesanan dengan ID ${id} tidak ditemukan.`,
      );
    }

    return order;
  }

  // 4. UPDATE STATUS
  async update(
    id: string,
    dto: UpdateOrderDto,
  ): Promise<Order> {
    const order = await this.findOne(id);

    if (!dto.status) {
      return order;
    }

    if (order.status === 'cancelled') {
      throw new BadRequestException(
        'Pesanan yang sudah dibatalkan tidak dapat diubah statusnya.',
      );
    }

    if (!this.isValidTransition(order.status, dto.status)) {
      throw new BadRequestException(
        `Perubahan status dari "${order.status}" ke "${dto.status}" tidak diperbolehkan.`,
      );
    }

    // Pembatalan mengembalikan stok buku.
    if (dto.status === 'cancelled') {
      await this.restoreStock(order);
    }

    order.status = dto.status;

    await this.orderRepository.save(order);

    return this.findOne(id);
  }

  // 5. DELETE / PEMBATALAN
  async remove(id: string): Promise<{ message: string; deletedId: string }> {
    const order = await this.findOne(id);

    if (order.status !== 'pending' && order.status !== 'paid') {
      throw new BadRequestException(
        `Pesanan dengan status "${order.status}" tidak dapat dihapus.`,
      );
    }

    await this.restoreStock(order);

    order.status = 'cancelled';

    await this.orderRepository.save(order);

    return {
      message: `Pesanan dengan ID ${id} berhasil dibatalkan.`,
      deletedId: id,
    };
  }

  // ============ HELPER ============

  /**
   * Nomor pesanan unik: ORD-<YYYYMMDD>-<counter acak>.
   */
  private generateOrderNumber(): string {
    const now = new Date();
    const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const randomPart = Math.floor(Math.random() * 100000)
      .toString()
      .padStart(5, '0');

    return `ORD-${datePart}-${randomPart}`;
  }

  private async buildAddressSnapshot(
    dto: CreateOrderDto,
  ): Promise<Partial<Order>> {
    if (!dto.shippingAddressId) {
      return {};
    }

    const address = await this.addressRepository.findOne({
      where: {
        id: dto.shippingAddressId,
        customerId: dto.customerId,
      },
    });

    if (!address) {
      throw new NotFoundException(
        'Alamat pengiriman tidak ditemukan untuk pelanggan ini.',
      );
    }

    return {
      recipientName: address.recipientName,
      recipientPhone: address.phone,
      shippingAddress: address.address,
      shippingCity: address.city,
      shippingPostalCode: address.postalCode,
    };
  }

  private async restoreStock(order: Order): Promise<void> {
    const items = order.items?.length
      ? order.items
      : await this.orderItemRepository.find({
          where: { orderId: order.id },
        });

    for (const item of items) {
      await this.bookRepository.increment(
        { id: item.bookId },
        'stock',
        item.quantity,
      );

      await this.bookRepository.update(
        { id: item.bookId },
        { isAvailable: true },
      );
    }
  }

  private isValidTransition(
    from: OrderStatus,
    to: OrderStatus,
  ): boolean {
    const allowed: Record<OrderStatus, OrderStatus[]> = {
      pending: ['paid', 'cancelled'],
      paid: ['processing', 'cancelled'],
      processing: ['shipped', 'cancelled'],
      shipped: ['completed'],
      completed: [],
      cancelled: [],
    };

    return allowed[from]?.includes(to) ?? false;
  }
}
