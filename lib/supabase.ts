import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://dbvresswgtgouudyotpx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRidnJlc3N3Z3Rnb3V1ZHlvdHB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0OTIxMzksImV4cCI6MjA5MzA2ODEzOX0.AHOAnZ6JtoajdfGYpZz_nM8IDZ90hLq5S5ZWMPQifJU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
