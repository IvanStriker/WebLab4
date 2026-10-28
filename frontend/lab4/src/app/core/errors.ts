import { HttpErrorResponse } from '@angular/common/http';
import { AppError } from './models';

const MESSAGES: Record<number, string> = {
  0: 'Сервер недоступен. Проверьте подключение и попробуйте позже',
  400: 'Некорректный запрос',
  401: 'Требуется авторизация',
  403: 'Недостаточно прав для этой операции',
  404: 'Запрашиваемые данные не найдены',
  409: 'Такая запись уже существует',
  422: 'Данные не прошли проверку',
  500: 'Внутренняя ошибка сервера, попробуйте позже',
  502: 'Сервер недоступен, попробуйте позже',
  503: 'Сервер недоступен, попробуйте позже',
  504: 'Сервер недоступен или не ответил вовремя, попробуйте позже',
};

export function toAppError(error: unknown): AppError {
  if (!(error instanceof HttpErrorResponse)) {
    return { status: -1, message: 'Неизвестная ошибка', details: {} };
  }
  const body = typeof error.error === 'object' && error.error !== null ? error.error : {};
  const status = error.status;
  let message = MESSAGES[status] ?? `Ошибка ${status}`;
  if (typeof body.error === 'string' && status < 500) {
    message = body.error;
  }
  if (status === 500 && typeof body.error === 'string') {
    message = MESSAGES[500];
  }
  return { status, message, details: body.details ?? {} };
}

export function fullMessage(error: AppError): string {
  const lines = Object.entries(error.details).map(([field, text]) => `${field}: ${text}`);
  return [error.message, ...lines].join('\n');
}
