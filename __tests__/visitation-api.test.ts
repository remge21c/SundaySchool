import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createVisitationLog,
  getVisitationLogs,
  getVisitationLogById,
  updateVisitationLog,
  deleteVisitationLog,
} from '@/lib/supabase/visitation';
import { supabase } from '@/lib/supabase/client';

// Supabase 클라이언트 모킹
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('Visitation API', () => {
  const mockFrom = vi.fn();
  const mockSelect = vi.fn();
  const mockInsert = vi.fn();
  const mockUpdate = vi.fn();
  const mockDelete = vi.fn();
  const mockEq = vi.fn();
  const mockGte = vi.fn();
  const mockLte = vi.fn();
  const mockSingle = vi.fn();
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

  describe('createVisitationLog', () => {
    it('should create a visitation log', async () => {
      const input = {
        student_id: 'student-123',
        teacher_id: 'teacher-456',
        visit_date: '2025-01-15',
        type: 'call' as const,
        content: '전화 심방 내용',
        prayer_request: '건강 회복 기도',
        is_confidential: false,
      };

      const mockVisitation = {
        id: 'visitation-789',
        ...input,
        prayer_request: '건강 회복 기도',
        is_confidential: false,
        created_at: '2025-01-15T10:00:00Z',
      };

      mockInsert.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        single: mockSingle,
      });
      mockSingle.mockResolvedValue({
        data: mockVisitation,
        error: null,
      });

      const result = await createVisitationLog(input);

      expect(result).toBeDefined();
      expect(result.id).toBe('visitation-789');
      expect(result.student_id).toBe('student-123');
      expect(result.type).toBe('call');
      expect(result.is_confidential).toBe(false);
      expect(supabase.from).toHaveBeenCalledWith('visitation_logs');
    });

    it('should create a confidential visitation log', async () => {
      const input = {
        student_id: 'student-123',
        teacher_id: 'teacher-456',
        visit_date: '2025-01-15',
        type: 'visit' as const,
        content: '심방 내용',
        is_confidential: true,
      };

      const mockVisitation = {
        id: 'visitation-790',
        ...input,
        prayer_request: null,
        is_confidential: true,
        created_at: '2025-01-15T10:00:00Z',
      };

      mockInsert.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        single: mockSingle,
      });
      mockSingle.mockResolvedValue({
        data: mockVisitation,
        error: null,
      });

      const result = await createVisitationLog(input);

      expect(result.is_confidential).toBe(true);
    });
  });

  describe('getVisitationLogs', () => {
    it('should get visitation logs by student_id', async () => {
      const mockVisitations = [
        {
          id: 'visitation-1',
          student_id: 'student-123',
          teacher_id: 'teacher-456',
          visit_date: '2025-01-15',
          type: 'call' as const,
          content: '전화 심방',
          prayer_request: null,
          is_confidential: false,
          created_at: '2025-01-15T10:00:00Z',
        },
        {
          id: 'visitation-2',
          student_id: 'student-123',
          teacher_id: 'teacher-456',
          visit_date: '2025-01-20',
          type: 'visit' as const,
          content: '방문 심방',
          prayer_request: '기도 제목',
          is_confidential: false,
          created_at: '2025-01-20T10:00:00Z',
        },
      ];

      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        order: mockOrder,
      });
      mockOrder.mockResolvedValue({
        data: mockVisitations,
        error: null,
      });

      const result = await getVisitationLogs({ student_id: 'student-123' });

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('visitation-1');
      expect(mockEq).toHaveBeenCalledWith('student_id', 'student-123');
    });

    it('should get visitation logs by date range', async () => {
      const mockVisitations = [
        {
          id: 'visitation-1',
          student_id: 'student-123',
          teacher_id: 'teacher-456',
          visit_date: '2025-01-15',
          type: 'call' as const,
          content: '전화 심방',
          prayer_request: null,
          is_confidential: false,
          created_at: '2025-01-15T10:00:00Z',
        },
      ];

      mockSelect.mockReturnValue({
        gte: mockGte,
      });
      mockGte.mockReturnValue({
        lte: mockLte,
      });
      mockLte.mockReturnValue({
        order: mockOrder,
      });
      mockOrder.mockResolvedValue({
        data: mockVisitations,
        error: null,
      });

      const result = await getVisitationLogs({
        start_date: '2025-01-01',
        end_date: '2025-01-31',
      });

      expect(result).toHaveLength(1);
      expect(mockGte).toHaveBeenCalledWith('visit_date', '2025-01-01');
      expect(mockLte).toHaveBeenCalledWith('visit_date', '2025-01-31');
    });

    it('should filter by type', async () => {
      const mockVisitations = [
        {
          id: 'visitation-1',
          student_id: 'student-123',
          teacher_id: 'teacher-456',
          visit_date: '2025-01-15',
          type: 'kakao' as const,
          content: '카카오톡 심방',
          prayer_request: null,
          is_confidential: false,
          created_at: '2025-01-15T10:00:00Z',
        },
      ];

      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        order: mockOrder,
      });
      mockOrder.mockResolvedValue({
        data: mockVisitations,
        error: null,
      });

      const result = await getVisitationLogs({ type: 'kakao' });

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('kakao');
    });
  });

  describe('getVisitationLogById', () => {
    it('should get a single visitation log by id', async () => {
      const mockVisitation = {
        id: 'visitation-789',
        student_id: 'student-123',
        teacher_id: 'teacher-456',
        visit_date: '2025-01-15',
        type: 'call' as const,
        content: '전화 심방',
        prayer_request: '기도 제목',
        is_confidential: false,
        created_at: '2025-01-15T10:00:00Z',
      };

      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });
      mockSingle.mockResolvedValue({
        data: mockVisitation,
        error: null,
      });

      const result = await getVisitationLogById('visitation-789');

      expect(result).toBeDefined();
      expect(result?.id).toBe('visitation-789');
      expect(mockEq).toHaveBeenCalledWith('id', 'visitation-789');
    });

    it('should return null when visitation log not found', async () => {
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      });

      const result = await getVisitationLogById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('updateVisitationLog', () => {
    it('should update a visitation log', async () => {
      const updateData = {
        content: '업데이트된 심방 내용',
        prayer_request: '업데이트된 기도 제목',
      };

      const mockUpdated = {
        id: 'visitation-789',
        student_id: 'student-123',
        teacher_id: 'teacher-456',
        visit_date: '2025-01-15',
        type: 'call' as const,
        content: '업데이트된 심방 내용',
        prayer_request: '업데이트된 기도 제목',
        is_confidential: false,
        created_at: '2025-01-15T10:00:00Z',
      };

      mockUpdate.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        single: mockSingle,
      });
      mockSingle.mockResolvedValue({
        data: mockUpdated,
        error: null,
      });

      const result = await updateVisitationLog('visitation-789', updateData);

      expect(result.content).toBe('업데이트된 심방 내용');
      expect(result.prayer_request).toBe('업데이트된 기도 제목');
    });

    it('should update is_confidential field', async () => {
      const updateData = {
        is_confidential: true,
      };

      const mockUpdated = {
        id: 'visitation-789',
        student_id: 'student-123',
        teacher_id: 'teacher-456',
        visit_date: '2025-01-15',
        type: 'call' as const,
        content: '전화 심방',
        prayer_request: null,
        is_confidential: true,
        created_at: '2025-01-15T10:00:00Z',
      };

      mockUpdate.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        single: mockSingle,
      });
      mockSingle.mockResolvedValue({
        data: mockUpdated,
        error: null,
      });

      const result = await updateVisitationLog('visitation-789', updateData);

      expect(result.is_confidential).toBe(true);
    });
  });

  describe('deleteVisitationLog', () => {
    it('should delete a visitation log', async () => {
      mockDelete.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockResolvedValue({
        data: null,
        error: null,
      });

      await deleteVisitationLog('visitation-789');

      expect(supabase.from).toHaveBeenCalledWith('visitation_logs');
      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('id', 'visitation-789');
    });

    it('should throw error on delete failure', async () => {
      mockDelete.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockResolvedValue({
        data: null,
        error: { message: 'Delete failed' },
      });

      await expect(deleteVisitationLog('visitation-789')).rejects.toThrow();
    });
  });
});
