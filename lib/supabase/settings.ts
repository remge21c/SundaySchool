/**
 * 애플리케이션 설정 API 함수
 * Supabase를 사용한 애플리케이션 설정 CRUD 작업
 */

import { supabase } from './client';

export interface AppSettings {
  id: string;
  app_name: string;
  description: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

const SETTINGS_ID = '00000000-0000-0000-0000-000000000000';

/**
 * 애플리케이션 설정 조회
 * @returns 애플리케이션 설정 (단일 행)
 */
export async function getAppSettings(): Promise<AppSettings | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase
    .from('app_settings') as any)
    .select('*')
    .eq('id', SETTINGS_ID)
    .single();

  if (error) {
    // 테이블이 없거나 행이 없는 경우 기본값 반환
    if (error.code === 'PGRST116' || error.code === '42P01') {
      return {
        id: SETTINGS_ID,
        app_name: '주일학교 교적부',
        description: '행정은 간소하게, 사역은 깊이 있게',
        updated_by: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
    throw error;
  }

  return data as AppSettings;
}

/**
 * 애플리케이션 이름 조회 (간단한 헬퍼 함수)
 * @returns 애플리케이션 이름
 */
export async function getAppName(): Promise<string> {
  const settings = await getAppSettings();
  return settings?.app_name || '주일학교 교적부';
}

/**
 * 애플리케이션 설정 업데이트
 * @param input 업데이트할 설정
 * @returns 업데이트된 설정
 */
export async function updateAppSettings(input: {
  app_name?: string;
  description?: string;
}): Promise<AppSettings> {
  const updateData: {
    app_name?: string;
    description?: string;
    updated_at?: string;
  } = {
    ...input,
    updated_at: new Date().toISOString(),
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase
    .from('app_settings') as any)
    .update(updateData)
    .eq('id', SETTINGS_ID)
    .select()
    .single();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error('설정 업데이트에 실패했습니다.');
  }

  return data as AppSettings;
}
