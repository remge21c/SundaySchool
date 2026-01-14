import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
  global: {
    // 인증 에러를 조용히 처리 (콘솔에만 로그)
    onError: (error) => {
      // Refresh Token 에러는 정상적인 상황일 수 있음 (로그아웃 또는 세션 만료)
      if (error.message?.includes('Refresh Token') || error.message?.includes('JWT')) {
        console.warn('인증 토큰 에러 (정상적인 상황일 수 있음):', error.message);
        return;
      }
      console.error('Supabase 에러:', error);
    },
  },
});
