import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export function formatAddress(address: string) {
  return address.length > 20
    ? `${address.slice(0, 14)}...${address.slice(-3)}`
    : address;
}
