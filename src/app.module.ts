import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import Joi from 'joi';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

import { AuthorsModule } from './authors/authors.module.js';
import { Author } from './authors/entities/author.entity.js';
import { BooksModule } from './books/books.module.js';
import { Book } from './books/entities/book.entity.js';
import { BookAuthor } from './books/entities/book-author.entity.js';
import { CategoriesModule } from './categories/categories.module.js';
import { Category } from './categories/entities/category.entity.js';
import { CustomersModule } from './customers/customers.module.js';
import { Customer } from './customers/entities/customer.entity.js';
import { CustomerAddress } from './customers/entities/customer-address.entity.js';
import { OrdersModule } from './orders/orders.module.js';
import { Order as OrderEntity } from './orders/entities/order.entity.js';
import { OrderItem } from './orders/entities/order-item.entity.js';
import { PaymentsModule } from './payments/payments.module.js';
import { Payment } from './payments/entities/payment.entity.js';
import { PublishersModule } from './publishers/publishers.module.js';
import { Publisher } from './publishers/entities/publisher.entity.js';
import { ShipmentsModule } from './shipments/shipments.module.js';
import { Shipment } from './shipments/entities/shipment.entity.js';

// Seluruh entity BookStore E-Commerce. Daftarkan di sini agar TypeORM
// membuat/memperbarui tabelnya saat aplikasi dijalankan (synchronize).
export const BOOKSTORE_ENTITIES = [
  Customer,
  CustomerAddress,
  Category,
  Publisher,
  Book,
  Author,
  BookAuthor,
  OrderEntity,
  OrderItem,
  Payment,
  Shipment,
];

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        PORT: Joi.number().default(3000),
        NODE_ENV: Joi.string()
          .valid('development', 'staging', 'production')
          .default('development'),
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().default(5432),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_DATABASE: Joi.string().required(),
        DB_SYNCHRONIZE: Joi.boolean().truthy('true').falsy('false').default(true),
      }),
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres' as const,
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        entities: BOOKSTORE_ENTITIES,
        // Skema tabel dibuat otomatis dari entity.
        // Set DB_SYNCHRONIZE=false dan pakai migration untuk produksi.
        synchronize: configService.get<boolean>('DB_SYNCHRONIZE'),
        logging: configService.get<string>('NODE_ENV') === 'development',
      }),
    }),

    BooksModule,
    CategoriesModule,
    PublishersModule,
    AuthorsModule,
    CustomersModule,
    OrdersModule,
    PaymentsModule,
    ShipmentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
