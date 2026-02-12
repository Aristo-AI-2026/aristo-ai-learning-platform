
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mzbrvtejivslokbbkvnu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16YnJ2dGVqaXZzbG9rYmJrdm51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2MTk5NDcsImV4cCI6MjA4NjE5NTk0N30.KGHVFU5MwS_sBB4dd1fBWFmPmSRlYOzqtoKTyXnqpWY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
