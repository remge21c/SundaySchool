import { createClient } from '@supabase/supabase-js';
import { AppSettings } from './settings';

const SETTINGS_ID = '00000000-0000-0000-0000-000000000000';

/**
 * 애플리케이션 설정 조회 (서버 컴포넌트용)
 * 인증 세션(쿠키) 없이 순수 데이터만 조회하기 위해 supabase-js 클라이언트 직접 사용
 * @returns 애플리케이션 설정
 */
export async function getAppSettingsServer(): Promise<AppSettings> {
    try {
        // RLS로 인해 조회되지 않을 수 있으므로 Service Role Key 사용 시도
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            supabaseKey
        );

        const { data, error } = await supabase
            .from('app_settings')
            .select('*')
            .eq('id', SETTINGS_ID)
            .single();

        if (error) {
            console.error('Error fetching settings:', JSON.stringify(error, null, 2));
            // 에러 발생 시 기본값 반환
            return {
                id: SETTINGS_ID,
                app_name: '주일학교 교적부',
                description: '행정은 간소하게, 사역은 깊이 있게',
                updated_by: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };
        }

        return data as AppSettings;
    } catch (error) {
        console.error('Unexpected error fetching settings:', error);
        return {
            id: SETTINGS_ID,
            app_name: '주일학교 교적부',
            description: '행정은 간소하게, 사역은 깊이 있게',
            updated_by: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
    }
}
