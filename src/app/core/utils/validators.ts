import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { todayInParis } from './format';

/** 18 ans revolus a la date du jour (Europe/Paris), comme le back (`UNDERAGE`). */
export function isAdult(birthDate: string, today = todayInParis()): boolean {
  const b = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate);
  const t = /^(\d{4})-(\d{2})-(\d{2})$/.exec(today);
  if (!b || !t) {
    return false;
  }
  const eighteen = `${String(+b[1] + 18).padStart(4, '0')}-${b[2]}-${b[3]}`;
  // Ne au 29 fevrier : 18 ans le 1er mars des annees non bissextiles (comparaison lexicale suffisante).
  return eighteen <= today;
}

export const adultValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = control.value as string | null;
  if (!value) {
    return null;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value < '1900-01-01') {
    return { birthDate: true };
  }
  return isAdult(value) ? null : { underage: true };
};

/**
 * Code postal de France metropolitaine : 5 chiffres, hors DOM-TOM (97x/98x)
 * et hors Monaco (980xx). La Corse (20xxx) est acceptee.
 */
export function isMetropolitanPostalCode(value: string): boolean {
  return /^\d{5}$/.test(value) && !/^(00|9[6-9])/.test(value);
}

export const postalCodeValidator: ValidatorFn = (control) => {
  const value = ((control.value as string | null) ?? '').trim();
  if (!value) {
    return null;
  }
  if (!/^\d{5}$/.test(value)) {
    return { postalCodeFormat: true };
  }
  return isMetropolitanPostalCode(value) ? null : { postalCodeArea: true };
};

/** Normalise un numero francais : « +33 6 12 34 56 78 » -> « 0612345678 ». */
export function normalizeFrenchPhone(value: string): string {
  const compact = value.replace(/[\s.\-()]/g, '');
  if (/^\+33\d{9}$/.test(compact)) {
    return `0${compact.slice(3)}`;
  }
  if (/^0033\d{9}$/.test(compact)) {
    return `0${compact.slice(4)}`;
  }
  return compact;
}

export const frenchPhoneValidator: ValidatorFn = (control) => {
  const value = ((control.value as string | null) ?? '').trim();
  if (!value) {
    return null;
  }
  return /^0[1-9]\d{8}$/.test(normalizeFrenchPhone(value)) ? null : { phone: true };
};

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
