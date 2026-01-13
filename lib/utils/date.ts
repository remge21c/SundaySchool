/**
 * 날짜 관련 유틸리티 함수
 */

import { startOfWeek, endOfWeek, format } from 'date-fns';
import { ko } from 'date-fns/locale';

/**
 * 이번주 일요일 00:00:00과 토요일 23:59:59를 반환
 * @param date 기준 날짜 (기본값: 오늘)
 * @returns { startDate: string, endDate: string } YYYY-MM-DD 형식의 날짜 문자열
 */
export function getCurrentWeekRange(date: Date = new Date()): {
  startDate: string; // 일요일
  endDate: string; // 토요일
} {
  const sunday = startOfWeek(date, { weekStartsOn: 0, locale: ko });
  const saturday = endOfWeek(date, { weekStartsOn: 0, locale: ko });

  return {
    startDate: format(sunday, 'yyyy-MM-dd'),
    endDate: format(saturday, 'yyyy-MM-dd'),
  };
}
