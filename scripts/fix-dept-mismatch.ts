
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Manually load env vars from .env.local
try {
    const envPath = path.resolve(__dirname, '../.env.local');
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf-8');
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
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function fixMismatch() {
    console.log('Fixing department name mismatches...');

    // Update '중등부' to '중고등부'
    const oldName = '중등부';
    const newName = '중고등부';

    console.log(`Updating classes from "${oldName}" to "${newName}"...`);

    const { data, error } = await supabase
        .from('classes')
        .update({ department: newName })
        .eq('department', oldName)
        .select();

    if (error) {
        console.error('Error updating classes:', error);
    } else {
        console.log(`Successfully updated ${data.length} classes.`);
        data.forEach(c => console.log(` - Updated class: ${c.name} (${c.id})`));
    }
}

fixMismatch();
