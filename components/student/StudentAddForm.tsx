/**
 * 학생 추가 폼 컴포넌트
 * 새 학생을 추가하는 모달 폼
 */

'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createStudent } from '@/lib/supabase/students';
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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Class } from '@/types/class';
import type { Database } from '@/types/supabase';

type StudentInsert = Database['public']['Tables']['students']['Insert'];

interface StudentAddFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  classes?: Class[];
  defaultClassId?: string;
}

export function StudentAddForm({
  open,
  onClose,
  onSuccess,
  classes = [],
  defaultClassId,
}: StudentAddFormProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('');
  const [birthday, setBirthday] = useState('');
  const [gender, setGender] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [parentContact, setParentContact] = useState('');
  const [address, setAddress] = useState('');
  const [selectedClassId, setSelectedClassId] = useState(defaultClassId || '');
  const [error, setError] = useState<string | null>(null);

  // 모달이 열릴 때마다 폼 초기화
  const resetForm = () => {
    setName('');
    setGrade('');
    setBirthday('');
    setGender('');
    setSchoolName('');
    setParentContact('');
    setAddress('');
    setSelectedClassId(defaultClassId || '');
    setError(null);
  };

  // 모달이 열릴 때 폼 초기화
  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [open, defaultClassId]);

  const mutation = useMutation({
    mutationFn: async (data: StudentInsert) => {
      return createStudent(data);
    },
    onSuccess: () => {
      // 쿼리 무효화로 학생 목록 새로고침
      queryClient.invalidateQueries({ queryKey: ['students'] });
      
      resetForm();
      
      // 성공 콜백 실행
      if (onSuccess) {
        onSuccess();
      }
      
      // 모달 닫기
      onClose();
    },
    onError: (err: Error) => {
      setError(err.message || '학생 추가에 실패했습니다. 다시 시도해주세요.');
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

    if (!selectedClassId) {
      setError('반을 선택해주세요.');
      return;
    }

    // 학생 생성
    mutation.mutate({
      name: name.trim(),
      grade: Number(grade),
      birthday: birthday || null,
      gender: gender || null,
      school_name: schoolName.trim() || null,
      parent_contact: parentContact.trim(),
      address: address.trim() || null,
      class_id: selectedClassId,
      is_active: true,
      allergies: null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>학생 추가</DialogTitle>
          <DialogDescription>
            새 학생 정보를 입력하세요. 이름, 학년, 보호자 연락처는 필수 항목입니다.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* 반 선택 */}
            <div className="space-y-2">
              <Label htmlFor="class">반 *</Label>
              {classes.length === 0 ? (
                <div className="rounded-md bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-800">
                  등록된 반이 없습니다. 먼저 관리자 페이지에서 반을 생성해주세요.
                </div>
              ) : (
                <Select
                  value={selectedClassId}
                  onValueChange={setSelectedClassId}
                  required
                >
                  <SelectTrigger id="class">
                    <SelectValue placeholder="반을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.department} - {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* 이름 */}
            <div className="space-y-2">
              <Label htmlFor="name">이름 *</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="학생 이름"
                required
                disabled={mutation.isPending}
              />
            </div>

            {/* 학년 */}
            <div className="space-y-2">
              <Label htmlFor="grade">학년 *</Label>
              <Input
                id="grade"
                type="number"
                min="1"
                max="12"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="학년 (1-12)"
                required
                disabled={mutation.isPending}
              />
            </div>

            {/* 생년월일 */}
            <div className="space-y-2">
              <Label htmlFor="birthday">생년월일</Label>
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
              <Label htmlFor="gender">성별</Label>
              <Select
                value={gender}
                onValueChange={setGender}
              >
                <SelectTrigger id="gender">
                  <SelectValue placeholder="성별 선택 (선택사항)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="남">남</SelectItem>
                  <SelectItem value="여">여</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 학교명 */}
            <div className="space-y-2">
              <Label htmlFor="schoolName">학교명</Label>
              <Input
                id="schoolName"
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="학교명 (선택사항)"
                disabled={mutation.isPending}
              />
            </div>

            {/* 보호자 연락처 */}
            <div className="space-y-2">
              <Label htmlFor="parentContact">보호자 연락처 *</Label>
              <Input
                id="parentContact"
                type="tel"
                value={parentContact}
                onChange={(e) => setParentContact(e.target.value)}
                placeholder="010-1234-5678"
                required
                disabled={mutation.isPending}
              />
            </div>

            {/* 주소 */}
            <div className="space-y-2">
              <Label htmlFor="address">주소</Label>
              <Input
                id="address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="주소 (선택사항)"
                disabled={mutation.isPending}
              />
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={mutation.isPending}
            >
              취소
            </Button>
            <Button type="submit" disabled={mutation.isPending || classes.length === 0}>
              {mutation.isPending ? '추가 중...' : '추가'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
