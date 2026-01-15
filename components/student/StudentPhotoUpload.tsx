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

// 최대 파일 크기 (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;
// 압축 후 목표 크기 (1MB) - 프로필 이미지에 적합
const TARGET_FILE_SIZE = 1 * 1024 * 1024;
// 최대 이미지 크기 (픽셀) - 프로필 이미지용
const MAX_IMAGE_DIMENSION = 800;

/**
 * 이미지 압축 함수
 * Canvas API를 사용하여 이미지 크기와 품질을 조절
 */
async function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Canvas context를 생성할 수 없습니다.'));
      return;
    }

    img.onload = () => {
      let { width, height } = img;

      // 이미지 크기 조절 (최대 크기 제한)
      if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
        if (width > height) {
          height = (height / width) * MAX_IMAGE_DIMENSION;
          width = MAX_IMAGE_DIMENSION;
        } else {
          width = (width / height) * MAX_IMAGE_DIMENSION;
          height = MAX_IMAGE_DIMENSION;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // 이미지 그리기
      ctx.drawImage(img, 0, 0, width, height);

      // 품질을 낮추면서 목표 크기 이하가 될 때까지 압축
      let quality = 0.8;
      const compress = () => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('이미지 압축에 실패했습니다.'));
              return;
            }

            // 목표 크기 이하이거나 품질이 너무 낮으면 완료
            if (blob.size <= TARGET_FILE_SIZE || quality <= 0.3) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              // 품질을 낮추고 다시 시도
              quality -= 0.1;
              compress();
            }
          },
          'image/jpeg',
          quality
        );
      };

      compress();
    };

    img.onerror = () => {
      reject(new Error('이미지를 로드할 수 없습니다.'));
    };

    // 파일을 Data URL로 읽기
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      reject(new Error('파일을 읽을 수 없습니다.'));
    };
    reader.readAsDataURL(file);
  });
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
  const [compressionMessage, setCompressionMessage] = useState<string | null>(null);

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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 이미지 파일 확인
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.');
      return;
    }

    let fileToUpload = file;

    // 파일 크기가 5MB 이상이면 자동 압축
    if (file.size > MAX_FILE_SIZE) {
      try {
        setCompressionMessage(`이미지 압축 중... (${(file.size / 1024 / 1024).toFixed(1)}MB → 압축 중)`);
        setIsUploading(true);

        fileToUpload = await compressImage(file);

        setCompressionMessage(`압축 완료! (${(file.size / 1024 / 1024).toFixed(1)}MB → ${(fileToUpload.size / 1024 / 1024).toFixed(1)}MB)`);

        // 3초 후 메시지 숨기기
        setTimeout(() => setCompressionMessage(null), 3000);
      } catch (error) {
        console.error('이미지 압축 실패:', error);
        alert('이미지 압축에 실패했습니다. 더 작은 이미지를 사용해주세요.');
        setIsUploading(false);
        setCompressionMessage(null);
        return;
      }
    }

    // 미리보기
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(fileToUpload);

    // 업로드
    uploadMutation.mutate(fileToUpload);
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
          type="button"
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
            type="button"
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
      {compressionMessage ? (
        <p className="text-xs text-blue-600 text-center font-medium">
          {compressionMessage}
        </p>
      ) : (
        <p className="text-xs text-gray-500 text-center">
          이미지 파일만 업로드 가능합니다 (5MB 초과 시 자동 압축)
        </p>
      )}
    </div>
  );
}
