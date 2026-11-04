import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Order, User } from '../../core/entity';
import { OrderService } from './order.service';

// Baza o'rniga soxta (mock) EntityManager: findOne mahsulotni qaytaradi, query va save — yozib qoladi
const manager = {
  findOne: jest.fn(),
  query: jest.fn(),
  create: jest.fn((_cls, data) => data),
  save: jest.fn(async (o) => ({ id: 1, ...o })),
  delete: jest.fn(),
};
const dataSource = { transaction: jest.fn((cb) => cb(manager)) };

const user = { id: 1, phone: '+998901234567' } as User;
const cart = [{ product: { id: 4, name: 'Mishka' }, qty: 2 }] as any;

let service: OrderService;
beforeEach(async () => {
  jest.clearAllMocks();
  const mod = await Test.createTestingModule({
    providers: [
      OrderService,
      { provide: getRepositoryToken(Order), useValue: {} },
      { provide: DataSource, useValue: dataSource },
    ],
  }).compile();
  service = mod.get(OrderService);
});

describe('OrderService.place', () => {
  it("telefon yo'q — darhol xato", () => {
    expect(() => service.place({ id: 1, phone: null } as User, cart)).toThrow(
      "Telefon raqami yo'q",
    );
  });

  it("savat bo'sh — darhol xato", () => {
    expect(() => service.place(user, [])).toThrow("Savat bo'sh");
  });

  it("omborda yetmaydi — tranzaksiya ichida xato, UPDATE bo'lmaydi", async () => {
    manager.findOne.mockResolvedValue({
      id: 4,
      name: 'Mishka',
      stock: 1,
      price: 50000,
    });
    await expect(service.place(user, cart)).rejects.toThrow(
      'Mishka: omborda faqat 1 ta qoldi',
    );
    expect(manager.query).not.toHaveBeenCalled();
  });

  it('yetarli — jami narx hisoblanadi', async () => {
    manager.findOne.mockResolvedValue({
      id: 4,
      name: 'Mishka',
      stock: 10,
      price: 50000,
    });
    const order = await service.place(user, cart);
    expect(order.total).toBe(100000);
    expect(manager.query).toHaveBeenCalledTimes(1);
  });

  it("chegara: omborda aynan 2 ta — 2 tasini olsa bo'ladi", async () => {
    manager.findOne.mockResolvedValue({
      id: 4,
      name: 'Mishka',
      stock: 2,
      price: 50000,
    });
    const order = await service.place(user, cart);
    expect(order.total).toBe(100000);
  });
});
