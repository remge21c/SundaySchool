/**
 * 반 관련 TypeScript 타입 정의
 */

export interface Class {
  id: string;
  name: string;
  department: string;
  year: number;
  main_teacher_id: string;
  created_at: string;
}

export interface ClassGroup {
  department: string;
  classes: Class[];
}

export interface ClassTreeItem {
  id: string;
  label: string;
  type: 'department' | 'class';
  department?: string;
  classId?: string;
  children?: ClassTreeItem[];
}
