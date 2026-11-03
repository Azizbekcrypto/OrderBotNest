import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Context, Telegraf } from 'telegraf';
import { config } from '../../config';
import { OrderStatus, User } from '../../core/entity';
import { CartService } from '../cart/cart.service';
import { CatalogService } from '../catalog/catalog.service';
import { OrderService } from '../order/order.service';
import { UserService } from '../user/user.service';
import { cartKeyboard, catalogKeyboard, orderKeyboard } from './keyboards';
import { texts } from './texts';

const PHONE = /^\+?\d{9,13}$/;

@Injectable()
export class TelegramService implements OnModuleInit, OnModuleDestroy {
  private bot: Telegraf;

  constructor(
    private readonly users: UserService,
    private readonly catalog: CatalogService,
    private readonly cart: CartService,
    private readonly orders: OrderService,
  ) {}

  async onModuleInit() {
    if (!config.BOT_TOKEN) {
      throw new Error(
        'BOT_TOKEN topilmadi. .env faylini oching va @BotFather bergan tokenni yozing (README).',
      );
    }
    this.bot = new Telegraf(config.BOT_TOKEN);
    this.registerCustomer();
    this.registerAdmin();
    this.bot.on('text', (ctx) => this.onText(ctx));
    this.bot.catch(async (err, ctx) => {
      console.error('Bot xatosi:', (err as Error).message);
      await ctx.reply(texts.unknown).catch(() => undefined);
    });

    this.bot
      .launch(() => console.log('Telegram bot ulandi'))
      .catch((e: Error) =>
        console.error(
          'Telegram ulanmadi:',
          e.message,
          '— README, «Xatolar» jadvali',
        ),
      );
  }

  onModuleDestroy() {
    try {
      this.bot?.stop('shutdown');
    } catch {
      /* allaqachon to'xtagan */
    }
  }

  // ---------- mijoz ----------
  private registerCustomer() {
    this.bot.start(async (ctx) => {
      const user = await this.users.getOrCreate(ctx.from);
      await ctx.reply(texts.start(user.name, user.role === 'admin'));
    });

    this.bot.help((ctx) => ctx.reply(texts.help));

    this.bot.command('catalog', (ctx) => this.showCatalog(ctx, 0));

    this.bot.action(/^page:(\d+)$/, async (ctx) => {
      await ctx.answerCbQuery();
      await this.showCatalog(ctx, Number(ctx.match[1]), true);
    });

    this.bot.action(/^add:(\d+)$/, async (ctx) => {
      const p = await this.catalog.find(Number(ctx.match[1]));
      if (!p) return ctx.answerCbQuery('Mahsulot topilmadi');
      const user = await this.users.getOrCreate(ctx.from);
      const qty = await this.cart.add(user, p.id);
      await ctx.answerCbQuery(texts.added(p, qty));
    });

    this.bot.action('noop', (ctx) => ctx.answerCbQuery());

    this.bot.command('cart', (ctx) => this.showCart(ctx));
    this.bot.action('cart', async (ctx) => {
      await ctx.answerCbQuery();
      await this.showCart(ctx);
    });

    this.bot.action('cart:clear', async (ctx) => {
      const user = await this.users.getOrCreate(ctx.from);
      await this.cart.clear(user);
      await ctx.answerCbQuery();
      await ctx.reply(texts.cartCleared);
    });

    this.bot.action('checkout', async (ctx) => {
      await ctx.answerCbQuery();
      const user = await this.users.getOrCreate(ctx.from);
      const items = await this.cart.list(user);
      if (items.length === 0) return ctx.reply(texts.cartEmpty);
      if (!user.phone) {
        await this.users.setState(user, 'WAITING_PHONE');
        return ctx.reply(texts.askPhone);
      }
      await this.placeOrder(ctx, user);
    });
  }

  private async showCatalog(ctx: Context, page: number, edit = false) {
    const { items, pages } = await this.catalog.page(page);
    const text = texts.catalogTitle(page, pages);
    const kb = catalogKeyboard(items, page, pages);
    if (edit) {
      try {
        await ctx.editMessageText(text, kb);
        return;
      } catch {
        /* xabar o'zgarmagan bo'lsa Telegram xato beradi — yangisini yuboramiz */
      }
    }
    await ctx.reply(text, kb);
  }

  private async showCart(ctx: Context) {
    const user = await this.users.getOrCreate(ctx.from!);
    const items = await this.cart.list(user);
    if (items.length === 0) return ctx.reply(texts.cartEmpty);
    const total = items.reduce((s, i) => s + i.product.price * i.qty, 0);
    await ctx.reply(texts.cart(items, total), cartKeyboard());
  }

  private async placeOrder(ctx: Context, user: User) {
    try {
      const order = await this.orders.place(user, await this.cart.list(user));
      await ctx.reply(texts.orderPlaced(order));
      for (const admin of await this.users.admins()) {
        if (admin.telegram_id === user.telegram_id) continue;
        await this.bot.telegram
          .sendMessage(
            Number(admin.telegram_id),
            texts.adminNewOrder(order, user.name),
          )
          .catch(() => undefined);
      }
    } catch (e) {
      await ctx.reply(texts.orderFailed((e as Error).message));
    }
  }

  // Matn keldi: telefon kutilayotgan bo'lsa — saqlab buyurtma beramiz
  private async onText(ctx: Context & { message: { text: string } }) {
    const user = await this.users.getOrCreate(ctx.from!);
    if (user.state === 'WAITING_PHONE') {
      const phone = ctx.message.text.trim();
      if (!PHONE.test(phone)) return ctx.reply(texts.badPhone);
      await this.users.setPhone(user, phone);
      return this.placeOrder(ctx, user);
    }
    await ctx.reply(texts.unknown);
  }

  // ---------- admin ----------
  private registerAdmin() {
    this.bot.command('orders', async (ctx) => {
      const user = await this.users.getOrCreate(ctx.from);
      if (user.role !== 'admin') return ctx.reply(texts.adminOnly);
      const list = await this.orders.recent(5);
      if (list.length === 0) return ctx.reply(texts.noOrders);
      for (const o of list)
        await ctx.reply(texts.orderLine(o), orderKeyboard(o));
    });

    this.bot.action(
      /^status:(\d+):(NEW|CONFIRMED|DELIVERED|CANCELLED)$/,
      async (ctx) => {
        const user = await this.users.getOrCreate(ctx.from);
        if (user.role !== 'admin') return ctx.answerCbQuery(texts.adminOnly);
        try {
          const order = await this.orders.setStatus(
            Number(ctx.match[1]),
            ctx.match[2] as OrderStatus,
          );
          await ctx.answerCbQuery(texts.statusChanged(order));
          await ctx.editMessageText(
            texts.orderLine(order),
            orderKeyboard(order),
          );
          await this.bot.telegram
            .sendMessage(
              Number(order.user.telegram_id),
              texts.customerStatus(order),
            )
            .catch(() => undefined);
        } catch (e) {
          await ctx.answerCbQuery((e as Error).message);
        }
      },
    );
  }
}
