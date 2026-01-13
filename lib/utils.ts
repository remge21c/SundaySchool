import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * 클래스 이름을 병합하는 유틸리티 함수
 * Shadcn/UI에서 사용하는 cn 함수
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
