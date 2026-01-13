/**
 * Supabase Storage 파일 업로드 유틸리티
 * 학생 사진 등 이미지 파일 업로드
 */

import { supabase } from './client';

/**
 * 학생 사진 업로드
 * @param studentId 학생 ID
 * @param file 이미지 파일
 * @returns 업로드된 파일의 공개 URL
 */
export async function uploadStudentPhoto(
  studentId: string,
  file: File
): Promise<string> {
  // 파일 확장자 확인
  const fileExt = file.name.split('.').pop();
  const fileName = `${studentId}-${Date.now()}.${fileExt}`;
  const filePath = `students/${fileName}`;

  try {
    // 파일 업로드
    const { data, error } = await supabase.storage
      .from('student-photos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false, // 기존 파일 덮어쓰기 방지
      });

    if (error) {
      // 버킷이 없는 경우
      if (error.message.includes('Bucket not found') || error.message.includes('does not exist')) {
        throw new Error(
          'Storage 버킷이 생성되지 않았습니다. Supabase 대시보드에서 "student-photos" 버킷을 생성해주세요.'
        );
      }
      // 권한 오류
      if (error.message.includes('new row violates') || error.message.includes('policy')) {
        throw new Error(
          '업로드 권한이 없습니다. Storage 정책을 확인해주세요.'
        );
      }
      throw error;
    }

    if (!data) {
      throw new Error('파일 업로드에 실패했습니다.');
    }

    // 공개 URL 가져오기
    const {
      data: { publicUrl },
    } = supabase.storage.from('student-photos').getPublicUrl(filePath);

    return publicUrl;
  } catch (error: any) {
    // 에러 메시지 개선
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`사진 업로드 실패: ${error?.message || '알 수 없는 오류'}`);
  }
}

/**
 * 학생 사진 삭제
 * @param photoUrl 삭제할 사진의 URL
 */
export async function deleteStudentPhoto(photoUrl: string): Promise<void> {
  // URL에서 파일 경로 추출
  const urlParts = photoUrl.split('/');
  const filePath = urlParts.slice(urlParts.indexOf('student-photos') + 1).join('/');

  const { error } = await supabase.storage.from('student-photos').remove([filePath]);

  if (error) {
    throw error;
  }
}
