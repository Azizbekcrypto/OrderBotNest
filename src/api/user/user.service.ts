import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { config } from '../../config';
import { Role, User, UserState } from '../../core/entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly repo: Repository<User>,
  ) {}

  // Avval SELECT (bor bo'lsa shu qator), bo'lmasa INSERT.
  // SELECT'siz to'g'ridan-to'g'ri INSERT qilinsa ikkinchi /start da UNIQUE xatosi chiqadi.
  async getOrCreate(from: { id: number; first_name: string }): Promise<User> {
    const telegram_id = from.id; // BIGINT bazadan matn bo'lib keladi — biz ham matn saqlaymiz
    const role: Role = config.ADMIN_TELEGRAM_IDS.includes(from.id)
      ? 'admin'
      : 'customer';
    let user = await this.repo.findOne({ where: { telegram_id } });
    if (!user) {
      user = this.repo.create({ telegram_id, name: from.first_name, role });
      return this.repo.save(user);
    }
    if (user.role !== role) {
      user.role = role; // .env dagi admin ro'yxati o'zgargan bo'lsa
      await this.repo.save(user);
    }
    return user;
  }

  setState(user: User, state: UserState): Promise<User> {
    user.state = state;
    return this.repo.save(user);
  }

  setPhone(user: User, phone: string): Promise<User> {
    user.phone = phone;
    user.state = 'IDLE';
    return this.repo.save(user);
  }

  admins(): Promise<User[]> {
    return this.repo.find({ where: { role: 'admin' } });
  }
}
