/**
 * 알레르기 정보 편집 폼 컴포넌트
 * 학생의 알레르기 정보를 편집하는 모달 폼
 */

'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateStudentAllergies } from '@/lib/supabase/students';
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
import { Textarea } from '@/components/ui/textarea';
import { X } from 'lucide-react';
import type { Student } from '@/types/student';

interface AllergyEditFormProps {
  student: Student;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface AllergyData {
  food: string[];
  medicine: string[];
  other: string;
}

export function AllergyEditForm({
  student,
  open,
  onClose,
  onSuccess,
}: AllergyEditFormProps) {
  const queryClient = useQueryClient();
  
  // 알레르기 정보 파싱
  const allergies = (student.allergies as AllergyData | null) || {
    food: [],
    medicine: [],
    other: '',
  };

  const [foodAllergies, setFoodAllergies] = useState<string[]>(allergies.food || []);
  const [medicineAllergies, setMedicineAllergies] = useState<string[]>(allergies.medicine || []);
  const [otherAllergy, setOtherAllergy] = useState(allergies.other || '');
  const [newFoodItem, setNewFoodItem] = useState('');
  const [newMedicineItem, setNewMedicineItem] = useState('');
  const [error, setError] = useState<string | null>(null);

  // 모달이 열릴 때마다 현재 알레르기 정보로 초기화
  useEffect(() => {
    if (open) {
      const allergies = (student.allergies as AllergyData | null) || {
        food: [],
        medicine: [],
        other: '',
      };
      setFoodAllergies(allergies.food || []);
      setMedicineAllergies(allergies.medicine || []);
      setOtherAllergy(allergies.other || '');
      setNewFoodItem('');
      setNewMedicineItem('');
      setError(null);
    }
  }, [open, student]);

  const mutation = useMutation({
    mutationFn: async (data: AllergyData) => {
      return updateStudentAllergies(student.id, data);
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
      setError(err.message || '알레르기 정보 업데이트에 실패했습니다. 다시 시도해주세요.');
    },
  });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // 알레르기 데이터 구성
    const allergyData: AllergyData = {
      food: foodAllergies.filter(item => item.trim() !== ''),
      medicine: medicineAllergies.filter(item => item.trim() !== ''),
      other: otherAllergy.trim() || '',
    };

    // 모든 항목이 비어있으면 null로 저장
    if (allergyData.food.length === 0 && allergyData.medicine.length === 0 && !allergyData.other) {
      mutation.mutate({ food: [], medicine: [], other: '' });
    } else {
      mutation.mutate(allergyData);
    }
  };

  const addFoodAllergy = () => {
    if (newFoodItem.trim() && !foodAllergies.includes(newFoodItem.trim())) {
      setFoodAllergies([...foodAllergies, newFoodItem.trim()]);
      setNewFoodItem('');
    }
  };

  const removeFoodAllergy = (item: string) => {
    setFoodAllergies(foodAllergies.filter(f => f !== item));
  };

  const addMedicineAllergy = () => {
    if (newMedicineItem.trim() && !medicineAllergies.includes(newMedicineItem.trim())) {
      setMedicineAllergies([...medicineAllergies, newMedicineItem.trim()]);
      setNewMedicineItem('');
    }
  };

  const removeMedicineAllergy = (item: string) => {
    setMedicineAllergies(medicineAllergies.filter(m => m !== item));
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>알레르기 정보 수정</DialogTitle>
          <DialogDescription>
            {student.name} 학생의 알레르기 정보를 입력하세요.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-4">
            {/* 음식 알레르기 */}
            <div className="space-y-2">
              <Label htmlFor="food">음식 알레르기</Label>
              <div className="flex gap-2">
                <Input
                  id="food"
                  type="text"
                  value={newFoodItem}
                  onChange={(e) => setNewFoodItem(e.target.value)}
                  placeholder="예: 견과류, 우유"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addFoodAllergy();
                    }
                  }}
                  disabled={mutation.isPending}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addFoodAllergy}
                  disabled={mutation.isPending || !newFoodItem.trim()}
                >
                  추가
                </Button>
              </div>
              {foodAllergies.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {foodAllergies.map((item, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm"
                    >
                      {item}
                      <button
                        type="button"
                        onClick={() => removeFoodAllergy(item)}
                        className="hover:bg-red-200 rounded-full p-0.5"
                        disabled={mutation.isPending}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 약물 알레르기 */}
            <div className="space-y-2">
              <Label htmlFor="medicine">약물 알레르기</Label>
              <div className="flex gap-2">
                <Input
                  id="medicine"
                  type="text"
                  value={newMedicineItem}
                  onChange={(e) => setNewMedicineItem(e.target.value)}
                  placeholder="예: 페니실린"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addMedicineAllergy();
                    }
                  }}
                  disabled={mutation.isPending}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addMedicineAllergy}
                  disabled={mutation.isPending || !newMedicineItem.trim()}
                >
                  추가
                </Button>
              </div>
              {medicineAllergies.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {medicineAllergies.map((item, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm"
                    >
                      {item}
                      <button
                        type="button"
                        onClick={() => removeMedicineAllergy(item)}
                        className="hover:bg-orange-200 rounded-full p-0.5"
                        disabled={mutation.isPending}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 기타 알레르기 */}
            <div className="space-y-2">
              <Label htmlFor="other">기타 알레르기</Label>
              <Textarea
                id="other"
                value={otherAllergy}
                onChange={(e) => setOtherAllergy(e.target.value)}
                placeholder="기타 알레르기 정보를 입력하세요"
                rows={3}
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
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? '저장 중...' : '저장'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
