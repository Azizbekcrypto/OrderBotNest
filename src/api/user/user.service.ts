import { Injectable } from '@nestjs/common';
import { config } from '../../config';
import { User, UserState } from '../../core/types';

@Injectable()
export class UserService {
  // telegramId → foydalanuvchi. Xotirada: server qayta ishga tushsa bo'shaydi.
  private readonly users = new Map<number, User>();

  getOrCreate(from: { id: number; first_name: string }): User {
    const bor = this.users.get(from.id);
    if (bor) return bor;
    const user: User = {
      telegramId: from.id,
      name: from.first_name,
      phone: null,
      role: config.ADMIN_TELEGRAM_IDS.includes(from.id) ? 'admin' : 'customer',
      state: 'IDLE',
    };
    this.users.set(from.id, user);
    return user;
  }

  setState(user: User, state: UserState): User {
    user.state = state;
    return user;
  }

  setPhone(user: User, phone: string): User {
    user.phone = phone;
    user.state = 'IDLE';
    return user;
  }

  admins(): User[] {
    return [...this.users.values()].filter((u) => u.role === 'admin');
  }
}
