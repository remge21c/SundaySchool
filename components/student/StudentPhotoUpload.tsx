/**
 * 학생 사진 업로드 컴포넌트
 * Supabase Storage를 사용하여 학생 사진 업로드
 */

'use client';

import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { uploadStudentPhoto, deleteStudentPhoto } from '@/lib/supabase/storage';
import { updateStudentPhoto } from '@/lib/supabase/students';
import { Button } from '@/components/ui/button';
import { Camera, X, Loader2 } from 'lucide-react';

interface StudentPhotoUploadProps {
  studentId: string;
  currentPhotoUrl: string | null;
  studentName: string;
}

export function StudentPhotoUpload({
  studentId,
  currentPhotoUrl,
  studentName,
}: StudentPhotoUploadProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentPhotoUrl);
  const [isUploading, setIsUploading] = useState(false);

  // 사진 업로드 mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      setIsUploading(true);
      try {
        // 기존 사진 삭제 (있는 경우)
        if (currentPhotoUrl) {
          try {
            await deleteStudentPhoto(currentPhotoUrl);
          } catch (error) {
            // 삭제 실패해도 계속 진행 (이미 덮어쓰기 가능)
            console.warn('기존 사진 삭제 실패:', error);
          }
        }

        // 새 사진 업로드
        const photoUrl = await uploadStudentPhoto(studentId, file);
        
        // 학생 정보 업데이트
        await updateStudentPhoto(studentId, photoUrl);
        
        return photoUrl;
      } finally {
        setIsUploading(false);
      }
    },
    onSuccess: (photoUrl) => {
      setPreviewUrl(photoUrl);
      // 쿼리 무효화하여 최신 데이터 가져오기
      queryClient.invalidateQueries({ queryKey: ['students', studentId] });
      queryClient.invalidateQueries({ queryKey: ['student-profile', studentId] });
    },
    onError: (error: any) => {
      console.error('사진 업로드 실패:', error);
      const errorMessage = error?.message || '알 수 없는 오류';
      alert(`사진 업로드에 실패했습니다.\n\n${errorMessage}\n\n자세한 내용은 브라우저 콘솔을 확인해주세요.`);
    },
  });

  // 사진 삭제 mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!currentPhotoUrl) return;
      
      // Storage에서 삭제
      await deleteStudentPhoto(currentPhotoUrl);
      
      // 학생 정보에서 photo_url 제거
      await updateStudentPhoto(studentId, null);
    },
    onSuccess: () => {
      setPreviewUrl(null);
      queryClient.invalidateQueries({ queryKey: ['students', studentId] });
      queryClient.invalidateQueries({ queryKey: ['student-profile', studentId] });
    },
    onError: (error) => {
      console.error('사진 삭제 실패:', error);
      alert('사진 삭제에 실패했습니다. 다시 시도해주세요.');
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 이미지 파일 확인
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.');
      return;
    }

    // 파일 크기 확인 (5MB 제한)
    if (file.size > 5 * 1024 * 1024) {
      alert('파일 크기는 5MB 이하여야 합니다.');
      return;
    }

    // 미리보기
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    // 업로드
    uploadMutation.mutate(file);
  };

  const handleDelete = () => {
    if (!confirm('사진을 삭제하시겠습니까?')) return;
    deleteMutation.mutate();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* 사진 미리보기 */}
      <div className="relative">
        {previewUrl ? (
          <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-gray-200">
            <img
              src={previewUrl}
              alt={`${studentName} 학생 사진`}
              className="w-full h-full object-cover"
            />
            {isUploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
              </div>
            )}
          </div>
        ) : (
          <div className="w-32 h-32 rounded-full bg-gray-100 border-4 border-gray-200 flex items-center justify-center">
            <Camera className="h-12 w-12 text-gray-400" />
          </div>
        )}
      </div>

      {/* 버튼 */}
      <div className="flex gap-2">
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || uploadMutation.isPending}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <Camera className="h-4 w-4" />
          {previewUrl ? '사진 변경' : '사진 업로드'}
        </Button>
        {previewUrl && (
          <Button
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 text-red-600 hover:text-red-700"
          >
            <X className="h-4 w-4" />
            삭제
          </Button>
        )}
      </div>

      {/* 숨겨진 파일 입력 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* 안내 메시지 */}
      <p className="text-xs text-gray-500 text-center">
        이미지 파일만 업로드 가능합니다 (최대 5MB)
      </p>
    </div>
  );
}
