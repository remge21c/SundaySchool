import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createAttendanceLog,
  getAttendanceLogs,
  getAttendanceLogByStudentAndDate,
  updateAttendanceLog,
  deleteAttendanceLog,
} from '@/lib/supabase/attendance';
import { supabase } from '@/lib/supabase/client';
import type { CreateAttendanceLogInput, UpdateAttendanceLogInput } from '@/types/attendance';

// Supabase 클라이언트 모킹
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('Attendance API', () => {
  const mockFrom = vi.fn();
  const mockSelect = vi.fn();
  const mockInsert = vi.fn();
  const mockUpdate = vi.fn();
  const mockDelete = vi.fn();
  const mockEq = vi.fn();
  const mockGte = vi.fn();
  const mockLte = vi.fn();
  const mockOrder = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // @ts-ignore
    supabase.from.mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
    });
  });

  describe('createAttendanceLog', () => {
    it('should create attendance log successfully', async () => {
      const input: CreateAttendanceLogInput = {
        student_id: 'student-123',
        class_id: 'class-456',
        date: '2025-01-12',
        status: 'present',
      };

      const mockAttendanceLog = {
        id: 'log-789',
        ...input,
        reason: null,
        created_at: '2025-01-12T10:00:00Z',
      };

      mockInsert.mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockAttendanceLog,
            error: null,
          }),
        }),
      });

      const result = await createAttendanceLog(input);

      expect(result).toEqual(mockAttendanceLog);
      expect(mockInsert).toHaveBeenCalledWith({
        student_id: input.student_id,
        class_id: input.class_id,
        date: input.date,
        status: input.status,
        reason: null,
      });
    });

    it('should handle UNIQUE constraint violation', async () => {
      const input: CreateAttendanceLogInput = {
        student_id: 'student-123',
        class_id: 'class-456',
        date: '2025-01-12',
        status: 'present',
      };

      mockInsert.mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: {
              code: '23505', // PostgreSQL UNIQUE violation
              message: 'duplicate key value violates unique constraint',
            },
          }),
        }),
      });

      await expect(createAttendanceLog(input)).rejects.toThrow();
    });

    it('should create attendance log with reason for absent', async () => {
      const input: CreateAttendanceLogInput = {
        student_id: 'student-123',
        class_id: 'class-456',
        date: '2025-01-12',
        status: 'absent',
        reason: '아픔',
      };

      const mockAttendanceLog = {
        id: 'log-789',
        ...input,
        created_at: '2025-01-12T10:00:00Z',
      };

      mockInsert.mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockAttendanceLog,
            error: null,
          }),
        }),
      });

      const result = await createAttendanceLog(input);

      expect(result).toEqual(mockAttendanceLog);
      expect(mockInsert).toHaveBeenCalledWith({
        student_id: input.student_id,
        class_id: input.class_id,
        date: input.date,
        status: input.status,
        reason: '아픔',
      });
    });
  });

  describe('getAttendanceLogs', () => {
    it('should get attendance logs by class_id', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          student_id: 'student-1',
          class_id: 'class-456',
          date: '2025-01-12',
          status: 'present' as const,
          reason: null,
          created_at: '2025-01-12T10:00:00Z',
        },
      ];

      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockLogs,
          error: null,
        }),
      };

      mockSelect.mockReturnValue(mockQuery);

      const result = await getAttendanceLogs({ class_id: 'class-456' });

      expect(result).toEqual(mockLogs);
      expect(mockSelect).toHaveBeenCalled();
      expect(mockQuery.eq).toHaveBeenCalledWith('class_id', 'class-456');
      expect(mockQuery.order).toHaveBeenCalledWith('date', { ascending: false });
    });

    it('should get attendance logs by date range', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          student_id: 'student-1',
          class_id: 'class-456',
          date: '2025-01-12',
          status: 'present' as const,
          reason: null,
          created_at: '2025-01-12T10:00:00Z',
        },
      ];

      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockLogs,
          error: null,
        }),
      };

      mockSelect.mockReturnValue(mockQuery);

      const result = await getAttendanceLogs({
        start_date: '2025-01-01',
        end_date: '2025-01-31',
      });

      expect(result).toEqual(mockLogs);
      expect(mockQuery.gte).toHaveBeenCalledWith('date', '2025-01-01');
      expect(mockQuery.lte).toHaveBeenCalledWith('date', '2025-01-31');
      expect(mockQuery.order).toHaveBeenCalledWith('date', { ascending: false });
    });
  });

  describe('getAttendanceLogByStudentAndDate', () => {
    it('should get attendance log by student_id and date', async () => {
      const mockLog = {
        id: 'log-1',
        student_id: 'student-123',
        class_id: 'class-456',
        date: '2025-01-12',
        status: 'present' as const,
        reason: null,
        created_at: '2025-01-12T10:00:00Z',
      };

      mockSelect.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: mockLog,
              error: null,
            }),
          }),
        }),
      });

      const result = await getAttendanceLogByStudentAndDate(
        'student-123',
        '2025-01-12'
      );

      expect(result).toEqual(mockLog);
    });

    it('should return null if not found', async () => {
      mockSelect.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      });

      const result = await getAttendanceLogByStudentAndDate(
        'student-123',
        '2025-01-12'
      );

      expect(result).toBeNull();
    });
  });

  describe('updateAttendanceLog', () => {
    it('should update attendance log', async () => {
      const updateInput: UpdateAttendanceLogInput = {
        status: 'late',
        reason: '늦잠',
      };

      const updatedLog = {
        id: 'log-1',
        student_id: 'student-123',
        class_id: 'class-456',
        date: '2025-01-12',
        status: 'late' as const,
        reason: '늦잠',
        created_at: '2025-01-12T10:00:00Z',
      };

      mockUpdate.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: updatedLog,
              error: null,
            }),
          }),
        }),
      });

      const result = await updateAttendanceLog('log-1', updateInput);

      expect(result).toEqual(updatedLog);
      expect(mockUpdate).toHaveBeenCalledWith({
        status: 'late',
        reason: '늦잠',
      });
    });
  });

  describe('deleteAttendanceLog', () => {
    it('should delete attendance log', async () => {
      mockDelete.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          data: null,
          error: null,
        }),
      });

      await deleteAttendanceLog('log-1');

      expect(mockDelete).toHaveBeenCalled();
      expect(mockDelete().eq).toHaveBeenCalledWith('id', 'log-1');
    });
  });
});
