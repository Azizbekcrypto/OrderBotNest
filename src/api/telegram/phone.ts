// Telefon raqami: + bilan yoki + siz, 9–13 ta raqam. Mijoz probel yoki chiziqcha bilan yozishi mumkin
export const PHONE = /^\+?\d{9,13}$/;

export const isPhone = (text: string) => PHONE.test(text.replace(/[\s-]/g, ''));
