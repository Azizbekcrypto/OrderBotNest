import { config } from '../../config';

// Panel tokeni — .env dagi ADMIN_PANEL_TOKEN. Bitta qoida ikki joyda ishlatiladi:
// WebSocket ulanishi ochilayotganda (gateway) va GET /admin/orders so'rovida (controller).
// .env da token yozilmagan bo'lsa — hech kim kira olmaydi (bo'sh token ham rad etiladi).
export function isAdminToken(token: unknown): boolean {
  return (
    typeof token === 'string' &&
    token !== '' &&
    token === config.ADMIN_PANEL_TOKEN
  );
}
