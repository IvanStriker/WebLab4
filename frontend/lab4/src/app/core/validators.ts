import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const NAME_PATTERN = /^[А-Яа-яЁёA-Za-z-]+(\s+[А-Яа-яЁёA-Za-z-]+)+$/;
export const GROUP_PATTERN = /^[A-Z]\d{4}$/;
export const USERNAME_PATTERN = /^[A-Za-z0-9_]{3,32}$/;
export const EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;

export function today(): string {
  return toIsoDate(new Date());
}

export function sixMonthsLater(): string {
  const date = new Date();
  date.setMonth(date.getMonth() + 6);
  return toIsoDate(date);
}

function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function positiveInteger(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (value === null || value === '') {
    return null;
  }
  return Number.isInteger(Number(value)) && Number(value) > 0 ? null : { positiveInteger: true };
}

export function moveinDate(original: string | null): ValidatorFn {
  return (control) => {
    const value = control.value;
    if (!value || value === original) {
      return null;
    }
    return value < today() || value > sixMonthsLater() ? { moveinDate: true } : null;
  };
}

export function passwordBytes(control: AbstractControl): ValidationErrors | null {
  const value = control.value ?? '';
  return new TextEncoder().encode(value).length > 72 ? { passwordBytes: true } : null;
}

export function sameAs(otherName: string): ValidatorFn {
  return (control) => {
    const other = control.parent?.get(otherName);
    return other && other.value !== control.value ? { sameAs: true } : null;
  };
}

export function numberList(control: AbstractControl): ValidationErrors | null {
  const parts = splitList(control.value ?? '');
  return parts.every((part) => /^\d+$/.test(part) && Number(part) > 0) ? null : { numberList: true };
}

export function splitList(text: string): string[] {
  return text
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part !== '');
}

const MESSAGES: Record<string, string> = {
  required: 'Обязательное поле',
  pattern: 'Неверный формат',
  email: 'Некорректный адрес почты, пример: name@mail.ru',
  minlength: 'Слишком короткое значение',
  maxlength: 'Слишком длинное значение',
  positiveInteger: 'Должно быть положительным целым числом',
  moveinDate: 'Дата заселения: не раньше сегодняшней и не позже чем через 6 месяцев',
  passwordBytes: 'Не длиннее 72 байт: 72 латинских или 36 русских букв',
  sameAs: 'Пароли не совпадают',
  numberList: 'Положительные целые числа через запятую',
};

export function errorText(control: AbstractControl | null, patternText = MESSAGES['pattern']): string {
  if (!control || !control.errors || !(control.touched || control.dirty)) {
    return '';
  }
  const key = Object.keys(control.errors)[0];
  if (key === 'pattern') {
    return patternText;
  }
  if (key === 'minlength') {
    return `Не короче ${control.errors['minlength'].requiredLength} символов`;
  }
  if (key === 'maxlength') {
    return `Не длиннее ${control.errors['maxlength'].requiredLength} символов`;
  }
  return MESSAGES[key] ?? 'Некорректное значение';
}
