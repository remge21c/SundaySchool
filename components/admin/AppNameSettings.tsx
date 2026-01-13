/**
 * 교적부 이름 설정 컴포넌트
 * 관리자 페이지에서 애플리케이션 이름을 설정하는 컴포넌트
 */

'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAppSettings, updateAppSettings } from '@/lib/supabase/settings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save, Settings } from 'lucide-react';

export function AppNameSettings() {
  const queryClient = useQueryClient();
  const [appName, setAppName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['app-settings'],
    queryFn: getAppSettings,
    staleTime: 5 * 60 * 1000, // 5분간 fresh 상태 유지
  });

  const updateMutation = useMutation({
    mutationFn: updateAppSettings,
    onSuccess: () => {
      // 설정 및 앱 이름 쿼리 무효화하여 Navbar에 즉시 반영
      queryClient.invalidateQueries({ queryKey: ['app-settings'] });
      queryClient.invalidateQueries({ queryKey: ['app-name'] });
      setError(null);
    },
    onError: (err: Error) => {
      setError(err.message || '설정 저장에 실패했습니다.');
    },
  });

  // 설정 로드 시 폼에 값 채우기
  useEffect(() => {
    if (settings) {
      setAppName(settings.app_name || '');
      setDescription(settings.description || '');
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!appName.trim()) {
      setError('교적부 이름을 입력해주세요.');
      return;
    }

    updateMutation.mutate({
      app_name: appName.trim(),
      description: description.trim() || null,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="mt-2 text-gray-500">설정을 불러오는 중...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          교적부 이름 설정
        </CardTitle>
        <CardDescription>
          상단에 표시될 교적부 이름과 설명을 설정하세요
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="appName">교적부 이름 *</Label>
            <Input
              id="appName"
              type="text"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              placeholder="예: 주일학교 교적부"
              required
              disabled={updateMutation.isPending}
              maxLength={100}
            />
            <p className="text-xs text-gray-500">
              이 이름이 상단 네비게이션 바에 표시됩니다
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">설명</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="예: 행정은 간소하게, 사역은 깊이 있게"
              rows={2}
              disabled={updateMutation.isPending}
              maxLength={200}
            />
            <p className="text-xs text-gray-500">
              선택사항입니다. 메인 페이지 등에 표시될 수 있습니다
            </p>
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={updateMutation.isPending}
            className="flex items-center gap-2"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                저장 중...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                저장
              </>
            )}
          </Button>

          {updateMutation.isSuccess && !updateMutation.isPending && (
            <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
              설정이 저장되었습니다.
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
