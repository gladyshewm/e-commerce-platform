import { Test, TestingModule } from '@nestjs/testing';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { of } from 'rxjs';
import { DataSource, EntityManager, QueryRunner, Repository } from 'typeorm';
import { OrderService } from './order.service';
import { PRODUCT_SERVICE } from '@app/common/constants';
import {
  OrderEntity,
  OrderItemEntity,
  ProductEntity,
  UserEntity,
} from '@app/common/database/entities';
import {
  CreateOrderPayload,
  Order,
  OrderWithoutItems,
} from '@app/common/contracts/order';
import { ProductWithCategory } from '@app/common/contracts/product';
import { OrderStatus } from '@app/common/database/enums';

describe('OrderService', () => {
  let orderService: OrderService;
  let productServiceClient: jest.Mocked<ClientProxy>;
  let dataSource: jest.Mocked<DataSource>;
  let orderRepository: jest.Mocked<Repository<OrderEntity>>;
  let manager: jest.Mocked<EntityManager>;
  let queryRunner: jest.Mocked<QueryRunner>;

  beforeEach(async () => {
    orderRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<Repository<OrderEntity>>;

    manager = {
      save: jest.fn(),
      getRepository: jest.fn().mockReturnValue(orderRepository),
    } as unknown as jest.Mocked<EntityManager>;

    queryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager,
    } as unknown as jest.Mocked<QueryRunner>;

    dataSource = {
      getRepository: jest.fn().mockReturnValue(orderRepository),
      createQueryRunner: jest.fn().mockReturnValue(queryRunner),
    } as unknown as jest.Mocked<DataSource>;

    const app: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        {
          provide: PRODUCT_SERVICE,
          useValue: {
            send: jest.fn().mockReturnValue(of({})),
            pipe: jest.fn().mockReturnValue(of({})),
          },
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
      ],
    }).compile();

    orderService = app.get<OrderService>(OrderService);
    productServiceClient = app.get<jest.Mocked<ClientProxy>>(PRODUCT_SERVICE);
  });

  describe('root', () => {
    it('should be defined', () => {
      expect(orderService).toBeDefined();
    });
  });

  describe('createOrder', () => {
    let result: Order;
    const payload: CreateOrderPayload = {
      userId: 22,
      items: [
        {
          quantity: 22,
          productId: 15,
        },
      ],
    };
    const product: ProductWithCategory = {
      id: payload.items[0].productId,
      name: 'name',
      description: '123',
      price: 123,
      sku: 'sku',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      category: {
        id: 1,
        name: 'qwe',
      },
    };
    const order: OrderEntity = {
      id: 1,
      totalAmount: 0,
      status: OrderStatus.PENDING,
      createdAt: new Date(),
      user: { id: payload.userId } as UserEntity,
      items: [],
    };
    const orderItem: OrderItemEntity = {
      id: 1,
      quantity: payload.items[0].quantity,
      priceAtPurchase: product.price,
      order,
      product: {} as ProductEntity,
    };

    beforeEach(async () => {
      productServiceClient.send.mockReturnValue(of([product]));
      manager.save
        .mockResolvedValueOnce(order)
        .mockResolvedValueOnce([orderItem]);
      result = await orderService.createOrder(payload);
    });

    it('should start transaction', () => {
      expect(dataSource.createQueryRunner).toHaveBeenCalled();
      expect(queryRunner.connect).toHaveBeenCalled();
      expect(queryRunner.startTransaction).toHaveBeenCalled();
    });

    it('should call productServiceClient', () => {
      expect(productServiceClient.send).toHaveBeenCalledWith('get_products', {
        productIds: payload.items.map((i) => i.productId),
      });
    });

    it('should throw RpcException if product not found', async () => {
      productServiceClient.send.mockReturnValue(of([]));
      await expect(orderService.createOrder(payload)).rejects.toThrow(
        RpcException,
      );
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });

    it('should save order and orderItems in DB', () => {
      const items = payload.items.map((item) => ({
        product: { id: product.id },
        quantity: item.quantity,
        priceAtPurchase: product.price,
      }));

      expect(manager.save).toHaveBeenCalledWith(OrderEntity, {
        user: { id: payload.userId },
        status: OrderStatus.PENDING,
        totalAmount: orderItem.priceAtPurchase * payload.items[0].quantity,
      });
      expect(manager.save).toHaveBeenCalledWith(
        OrderItemEntity,
        items.map((i) => ({
          ...i,
          order: { id: order.id },
        })),
      );
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });

    it('should rollback if save fails', async () => {
      manager.save.mockRejectedValueOnce(new Error('DB error'));
      await expect(orderService.createOrder(payload)).rejects.toThrow(
        'DB error',
      );
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });

    it('should return order', () => {
      const resultOrder: Order = {
        id: order.id,
        totalAmount: order.totalAmount,
        status: order.status,
        createdAt: order.createdAt,
        userId: order.user.id,
        items: [
          {
            id: orderItem.id,
            quantity: orderItem.quantity,
            priceAtPurchase: orderItem.priceAtPurchase,
            orderId: orderItem.order.id,
            productId: orderItem.product.id,
          },
        ],
      };
      expect(result).toEqual(resultOrder);
    });
  });

  describe('cancelOrder', () => {
    let result: OrderWithoutItems;
    const orderId = 1;
    let order: OrderEntity;

    beforeEach(async () => {
      order = {
        id: orderId,
        totalAmount: 0,
        status: OrderStatus.PENDING,
        createdAt: new Date(),
        user: {} as UserEntity,
        items: [],
      };
      orderRepository.findOne.mockResolvedValue(order);
      orderRepository.save.mockResolvedValue({
        ...order,
        status: OrderStatus.CANCELLED,
      });
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should throw RpcException if order not found', async () => {
      orderRepository.findOne.mockResolvedValue(null);
      await expect(orderService.cancelOrder(orderId)).rejects.toThrow(
        RpcException,
      );
    });

    it('should return order if order already cancelled', async () => {
      orderRepository.findOne.mockResolvedValueOnce({
        ...order,
        status: OrderStatus.CANCELLED,
      });
      result = await orderService.cancelOrder(orderId);
      expect(result).toEqual({
        id: order.id,
        totalAmount: order.totalAmount,
        status: OrderStatus.CANCELLED,
        createdAt: order.createdAt,
        userId: order.user.id,
      });
      expect(orderRepository.save).not.toHaveBeenCalled();
    });

    it('should save cancelled order in DB', async () => {
      await orderService.cancelOrder(orderId);
      expect(orderRepository.save).toHaveBeenCalledWith({
        ...order,
        status: OrderStatus.CANCELLED,
      });
    });

    it('should return cancelled order', async () => {
      result = await orderService.cancelOrder(orderId);
      expect(result).toEqual({
        id: order.id,
        totalAmount: order.totalAmount,
        status: OrderStatus.CANCELLED,
        createdAt: order.createdAt,
        userId: order.user.id,
      });
    });
  });

  describe('updateOrderStatus', () => {
    let result: Order;
    const [orderId, status] = [111, OrderStatus.DELIVERED];
    const order: OrderEntity = {
      id: orderId,
      totalAmount: 0,
      status: OrderStatus.PENDING,
      createdAt: new Date(),
      user: {} as UserEntity,
      items: [],
    };

    beforeEach(async () => {
      orderRepository.findOne.mockResolvedValue(order);
      orderRepository.save.mockResolvedValue({
        ...order,
        status,
      });
    });

    it('should throw RpcException if order not found', async () => {
      orderRepository.findOne.mockResolvedValue(null);
      await expect(
        orderService.updateOrderStatus(orderId, status),
      ).rejects.toThrow(RpcException);
    });

    it('should return order if order already has same status', async () => {
      orderRepository.findOne.mockResolvedValueOnce({
        ...order,
        status,
      });
      result = await orderService.updateOrderStatus(orderId, status);

      expect(result).toEqual({
        id: order.id,
        totalAmount: order.totalAmount,
        status,
        createdAt: order.createdAt,
        userId: order.user.id,
        items: [],
      });
      expect(orderRepository.save).not.toHaveBeenCalled();
    });

    it('should save updated order in DB', async () => {
      await orderService.updateOrderStatus(orderId, status);
      expect(orderRepository.save).toHaveBeenCalledWith({
        ...order,
        status,
      });
    });

    it('should return updated order', async () => {
      result = await orderService.updateOrderStatus(orderId, status);
      expect(result).toEqual({
        id: order.id,
        totalAmount: order.totalAmount,
        status,
        createdAt: order.createdAt,
        userId: order.user.id,
        items: [],
      });
    });
  });
});
