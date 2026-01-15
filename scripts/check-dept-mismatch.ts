
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
    } else {
        console.warn('.env.local not found');
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

async function checkMismatch() {
    console.log('Checking for department name mismatches...');

    // 1. Get all departments
    const { data: departments, error: deptError } = await supabase
        .from('departments')
        .select('name, sort_order')
        .order('sort_order', { ascending: true }); // Ensure ascending order

    if (deptError) {
        console.error('Error fetching departments:', deptError);
        return;
    }

    console.log('\n--- Departments Table (Sorted) ---');
    departments.forEach(d => console.log(`${d.name} (Order: ${d.sort_order})`));

    // 2. Get distinct departments from classes
    const { data: classes, error: classError } = await supabase
        .from('classes')
        .select('department, name');

    if (classError) {
        console.error('Error fetching classes:', classError);
        return;
    }

    const classDepartments = [...new Set(classes.map(c => c.department))];

    console.log('\n--- Departments in Classes Table ---');
    classDepartments.forEach(d => console.log(d));

    // 3. Find mismatches
    console.log('\n--- Mismatches (In Classes but NOT in Departments) ---');
    const deptNames = new Set(departments.map(d => d.name));
    const mismatches = classDepartments.filter(d => !deptNames.has(d));

    if (mismatches.length > 0) {
        mismatches.forEach(m => {
            console.log(`Mismatch: "${m}"`);
            // Show which classes use this mismatched name
            const affectedClasses = classes.filter(c => c.department === m).map(c => c.name);
            console.log(`  -> Used in classes: ${affectedClasses.join(', ')}`);
        });
    } else {
        console.log('No mismatches found!');
    }
}

checkMismatch();
