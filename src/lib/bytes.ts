import bytesFn, { BytesOptions } from 'bytes';

export function bytes(value: string): number;
export function bytes(value: number, options?: BytesOptions): string;
export function bytes(value: string | number, options?: BytesOptions): string | number {
  if (typeof value === 'string') return bytesFn(value) ?? 0;
  return bytesFn(Number(value), { ...options, unitSeparator: ' ' }) ?? '';
}
