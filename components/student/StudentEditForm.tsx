/**
 * 학생 정보 수정 폼 컴포넌트
 * 학생의 기본 정보를 수정하는 모달 폼
 */

'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateStudent } from '@/lib/supabase/students';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Student } from '@/types/student';
import type { Database } from '@/types/supabase';

type StudentUpdate = Database['public']['Tables']['students']['Update'];

interface StudentEditFormProps {
  student: Student;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function StudentEditForm({
  student,
  open,
  onClose,
  onSuccess,
}: StudentEditFormProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(student.name);
  const [grade, setGrade] = useState(student.grade.toString());
  const [birthday, setBirthday] = useState(
    student.birthday ? student.birthday.split('T')[0] : ''
  );
  const [gender, setGender] = useState(student.gender || '');
  const [schoolName, setSchoolName] = useState(student.school_name || '');
  const [parentContact, setParentContact] = useState(student.parent_contact);
  const [parentName, setParentName] = useState(student.parent_name || '');
  const [phoneNumber, setPhoneNumber] = useState(student.phone_number || '');
  const [address, setAddress] = useState(student.address || '');
  const [error, setError] = useState<string | null>(null);

  // 모달이 열릴 때마다 현재 학생 정보로 초기화
  useEffect(() => {
    if (open) {
      setName(student.name);
      setGrade(student.grade.toString());
      setBirthday(student.birthday ? student.birthday.split('T')[0] : '');
      setGender(student.gender || '');
      setSchoolName(student.school_name || '');
      setParentContact(student.parent_contact);
      setParentName(student.parent_name || '');
      setPhoneNumber(student.phone_number || '');
      setAddress(student.address || '');
      setError(null);
    }
  }, [open, student]);

  const mutation = useMutation({
    mutationFn: async (data: StudentUpdate) => {
      return updateStudent(student.id, data);
    },
    onSuccess: () => {
      // 쿼리 무효화로 프로필 새로고침
      queryClient.invalidateQueries({ queryKey: ['student-profile', student.id] });
      queryClient.invalidateQueries({ queryKey: ['students'] });

      setError(null);

      // 성공 콜백 실행
      if (onSuccess) {
        onSuccess();
      }

      // 모달 닫기
      onClose();
    },
    onError: (err: Error) => {
      setError(err.message || '학생 정보 업데이트에 실패했습니다. 다시 시도해주세요.');
    },
  });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // 필수 필드 검증
    if (!name.trim()) {
      setError('이름을 입력해주세요.');
      return;
    }

    if (!grade.trim() || isNaN(Number(grade)) || Number(grade) < 1 || Number(grade) > 12) {
      setError('학년을 올바르게 입력해주세요. (1-12)');
      return;
    }

    if (!parentContact.trim()) {
      setError('보호자 연락처를 입력해주세요.');
      return;
    }

    // 업데이트 데이터 준비
    const updateData: StudentUpdate = {
      name: name.trim(),
      grade: Number(grade),
      parent_contact: parentContact.trim(),
      updated_at: new Date().toISOString(),
    };

    // 선택 필드 추가
    if (birthday.trim()) {
      updateData.birthday = birthday.trim();
    } else {
      updateData.birthday = null;
    }

    if (gender) {
      updateData.gender = gender;
    } else {
      updateData.gender = null;
    }

    if (schoolName.trim()) {
      updateData.school_name = schoolName.trim();
    } else {
      updateData.school_name = null;
    }

    if (address.trim()) {
      updateData.address = address.trim();
    } else {
      updateData.address = null;
    }

    if (parentName.trim()) {
      updateData.parent_name = parentName.trim();
    } else {
      updateData.parent_name = null;
    }

    if (phoneNumber.trim()) {
      updateData.phone_number = phoneNumber.trim();
    } else {
      updateData.phone_number = null;
    }

    // 학생 정보 업데이트
    mutation.mutate(updateData);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>학생 정보 수정</DialogTitle>
          <DialogDescription>
            {student.name} 학생의 정보를 수정하세요.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 이름 */}
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                이름 <span className="text-red-500">*</span>
              </label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={mutation.isPending}
                placeholder="학생 이름"
              />
            </div>

            {/* 학년 */}
            <div className="space-y-2">
              <label htmlFor="grade" className="text-sm font-medium">
                학년 <span className="text-red-500">*</span>
              </label>
              <Input
                id="grade"
                type="number"
                min="1"
                max="12"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                required
                disabled={mutation.isPending}
                placeholder="학년 (1-12)"
              />
            </div>

            {/* 생년월일 */}
            <div className="space-y-2">
              <label htmlFor="birthday" className="text-sm font-medium">생년월일</label>
              <Input
                id="birthday"
                type="date"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                disabled={mutation.isPending}
              />
            </div>

            {/* 성별 */}
            <div className="space-y-2">
              <label htmlFor="gender" className="text-sm font-medium">성별</label>
              <select
                id="gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                disabled={mutation.isPending}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">선택 안 함</option>
                <option value="M">남</option>
                <option value="F">여</option>
              </select>
            </div>

            {/* 학교명 */}
            <div className="space-y-2">
              <label htmlFor="school-name" className="text-sm font-medium">학교명</label>
              <Input
                id="school-name"
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                disabled={mutation.isPending}
                placeholder="학교명"
              />
            </div>

            {/* 보호자 연락처 */}
            <div className="space-y-2">
              <label htmlFor="parent-contact" className="text-sm font-medium">
                보호자 연락처 <span className="text-red-500">*</span>
              </label>
              <Input
                id="parent-contact"
                type="text"
                value={parentContact}
                onChange={(e) => setParentContact(e.target.value)}
                required
                disabled={mutation.isPending}
                placeholder="010-1234-5678"
              />
            </div>

            {/* 보호자 이름 */}
            <div className="space-y-2">
              <label htmlFor="parent-name" className="text-sm font-medium">보호자 이름</label>
              <Input
                id="parent-name"
                type="text"
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                disabled={mutation.isPending}
                placeholder="보호자 성함"
              />
            </div>

            {/* 학생 전화번호 */}
            <div className="space-y-2">
              <label htmlFor="phone-number" className="text-sm font-medium">학생 전화번호</label>
              <Input
                id="phone-number"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={mutation.isPending}
                placeholder="010-0000-0000"
              />
            </div>
          </div>

          {/* 주소 */}
          <div className="space-y-2">
            <label htmlFor="address" className="text-sm font-medium">주소</label>
            <Input
              id="address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={mutation.isPending}
              placeholder="주소"
            />
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={mutation.isPending}
            >
              취소
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? '저장 중...' : '저장'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog >
  );
}
