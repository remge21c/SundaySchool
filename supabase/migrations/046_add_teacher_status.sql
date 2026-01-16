-- Create enum for teacher status
CREATE TYPE public.teacher_status AS ENUM ('pending', 'approved', 'rejected');

-- Add status column to profiles table with default 'pending'
ALTER TABLE public.profiles 
ADD COLUMN status public.teacher_status NOT NULL DEFAULT 'pending';

-- Update existing profiles to 'approved' so they don't get locked out
UPDATE public.profiles 
SET status = 'approved';

-- Add comment
COMMENT ON COLUMN public.profiles.status IS '교사 승인 상태 (pending: 승인대기, approved: 승인됨, rejected: 거절됨)';

-- Create function to delete teacher (both from profiles and auth.users)
-- Note: Modifying auth.users requires special permissions and usually is done via Supabase Service Role Key in Edge Functions.
-- However, we can try to create a secure stored procedure if the user has enough privileges, 
-- OR strictly manage it by deleting the profile and letting a trigger handle the auth user (if configured),
-- OR since we can't easily access auth.admin from here without extensions, we will primarily manage the `profiles` table
-- and use the Supabase Management API (via Service Role) in the client if possible, or just soft delete/flag in profiles.
-- For this environment, we will soft-delete or just rely on deleting the profile row if RLS allows.
-- BUT, deleting a user from `auth.users` is critical to prevent login if we don't rely solely on the status check.
-- The simplest reliable way in pure SQL for "Approve" is just updating the column.
-- For "Delete", usually we delete the profile.

-- Let's stick to the status update for now as the primary mechanism for access control.
