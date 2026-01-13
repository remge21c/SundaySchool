import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getStudentsByClass,
  getStudentById,
  getAllStudents,
} from '@/lib/supabase/students';
import { supabase } from '@/lib/supabase/client';

// Supabase 클라이언트 모킹
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('Student List API', () => {
  const mockFrom = vi.fn();
  const mockSelect = vi.fn();
  const mockEq = vi.fn();
  const mockIlike = vi.fn();
  const mockOrder = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // @ts-ignore
    supabase.from.mockReturnValue({
      select: mockSelect,
    });
  });

  describe('getStudentsByClass', () => {
    it('should get students by class_id', async () => {
      const mockStudents = [
        {
          id: 'student-1',
          name: '김철수',
          grade: 3,
          class_id: 'class-456',
          is_active: true,
          parent_contact: '010-1234-5678',
          birthday: null,
          gender: null,
          school_name: null,
          address: null,
          allergies: null,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
        {
          id: 'student-2',
          name: '이영희',
          grade: 3,
          class_id: 'class-456',
          is_active: true,
          parent_contact: '010-8765-4321',
          birthday: null,
          gender: null,
          school_name: null,
          address: null,
          allergies: null,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
      ];

      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockStudents,
          error: null,
        }),
      };

      mockSelect.mockReturnValue(mockQuery);

      const result = await getStudentsByClass('class-456');

      expect(result).toEqual(mockStudents);
      expect(mockSelect).toHaveBeenCalled();
      expect(mockQuery.eq).toHaveBeenCalledWith('class_id', 'class-456');
      expect(mockQuery.eq).toHaveBeenCalledWith('is_active', true);
      expect(mockQuery.order).toHaveBeenCalledWith('name', { ascending: true });
    });

    it('should filter by is_active when provided', async () => {
      const mockStudents = [
        {
          id: 'student-1',
          name: '김철수',
          grade: 3,
          class_id: 'class-456',
          is_active: false,
          parent_contact: '010-1234-5678',
          birthday: null,
          gender: null,
          school_name: null,
          address: null,
          allergies: null,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
      ];

      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockStudents,
          error: null,
        }),
      };

      mockSelect.mockReturnValue(mockQuery);

      const result = await getStudentsByClass('class-456', { is_active: false });

      expect(result).toEqual(mockStudents);
      expect(mockQuery.eq).toHaveBeenCalledWith('class_id', 'class-456');
      expect(mockQuery.eq).toHaveBeenCalledWith('is_active', false);
    });

    it('should search by name when search param provided', async () => {
      const mockStudents = [
        {
          id: 'student-1',
          name: '김철수',
          grade: 3,
          class_id: 'class-456',
          is_active: true,
          parent_contact: '010-1234-5678',
          birthday: null,
          gender: null,
          school_name: null,
          address: null,
          allergies: null,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
      ];

      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockStudents,
          error: null,
        }),
      };

      mockSelect.mockReturnValue(mockQuery);

      const result = await getStudentsByClass('class-456', { search: '철수' });

      expect(result).toEqual(mockStudents);
      expect(mockQuery.ilike).toHaveBeenCalledWith('name', '%철수%');
    });
  });

  describe('getStudentById', () => {
    it('should get student by id', async () => {
      const mockStudent = {
        id: 'student-1',
        name: '김철수',
        grade: 3,
        class_id: 'class-456',
        is_active: true,
        parent_contact: '010-1234-5678',
        birthday: null,
        gender: null,
        school_name: null,
        address: null,
        allergies: null,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      mockSelect.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockStudent,
            error: null,
          }),
        }),
      });

      const result = await getStudentById('student-1');

      expect(result).toEqual(mockStudent);
    });

    it('should return null if student not found', async () => {
      mockSelect.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: {
              code: 'PGRST116',
              message: 'The result contains 0 rows',
            },
          }),
        }),
      });

      const result = await getStudentById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getAllStudents', () => {
    it('should get all active students', async () => {
      const mockStudents = [
        {
          id: 'student-1',
          name: '김철수',
          grade: 3,
          class_id: 'class-456',
          is_active: true,
          parent_contact: '010-1234-5678',
          birthday: null,
          gender: null,
          school_name: null,
          address: null,
          allergies: null,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
      ];

      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockStudents,
          error: null,
        }),
      };

      mockSelect.mockReturnValue(mockQuery);

      const result = await getAllStudents();

      expect(result).toEqual(mockStudents);
      expect(mockQuery.eq).toHaveBeenCalledWith('is_active', true);
    });
  });
});
