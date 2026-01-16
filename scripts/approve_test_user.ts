
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Manual .env loading
try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach((line) => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                const value = match[2].trim().replace(/^["'](.*)["']$/, '$1');
                process.env[key] = value;
            }
        });
    }
} catch (e) {
    console.error('Error loading .env.local', e);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function approveTestUser() {
    console.log('Approving test teacher...');

    // Find the user profile by email (using a generic search since email is not in profiles table directly usually, 
    // but let's assume we can find it via auth.users or if profiles has email. 
    // Wait, profiles table usually has id. Using Service Role we can access auth.users but supabase-js client cannot direct query auth.users easily without admin API.
    // Actually, in this project, profiles table might be linked. 

    // Let's try to update profiles where name is '김선생' or 'Kim' 
    // Since we just created it using '김선생'

    const { data: profiles, error: searchError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .ilike('full_name', '%김선생%')
        .order('created_at', { ascending: false })
        .limit(1);

    if (searchError || !profiles || profiles.length === 0) {
        console.error('Test user profile not found via name search.', searchError);
        // Maybe try to find by latest created
        const { data: latest, error: latestError } = await supabase
            .from('profiles')
            .select('id, full_name, created_at')
            .order('created_at', { ascending: false })
            .limit(1);

        if (latest && latest.length > 0) {
            console.log('Found latest user:', latest[0]);
            await updateUser(latest[0].id);
        } else {
            process.exit(1);
        }
        return;
    }

    const userId = profiles[0].id;
    console.log('Found test user:', profiles[0].full_name, userId);
    await updateUser(userId);
}

async function updateUser(userId: string) {
    // Update profile status and role
    const { error: updateError } = await supabase
        .from('profiles')
        .update({
            status: 'approved',
            role: 'teacher'
        })
        .eq('id', userId);

    if (updateError) {
        console.error('Error updating profile:', updateError);
        return;
    }
    console.log('User approved successfully.');

    // Assign a department/class if needed for screenshots?
    // Let's assign to '초등부' (Elementary) if available, or just any department.
    // Assigning permission_scope to 'class' or 'department'. Let's give 'department' for richer screenshots.

    const { error: permError } = await supabase
        .from('profiles')
        .update({
            permission_scope: 'department',
            department_permissions: { "초등부": { "permission_scope": "department" } } // Example
        })
        .eq('id', userId);

    if (permError) {
        console.log('Permission update failed or skipped (maybe dept name mismatch), but user is approved.');
    } else {
        console.log('User permissions updated.');
    }
}

approveTestUser();
