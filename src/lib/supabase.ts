import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  import.meta.env?.VITE_SUPABASE_URL ||
  (typeof window !== "undefined" ? (window as any).env?.VITE_SUPABASE_URL : undefined) ||
  process.env.SUPABASE_URL ||
  "https://wspaqtirqslarbzrnkhf.supabase.co";

const supabaseAnonKey =
  import.meta.env?.VITE_SUPABASE_ANON_KEY ||
  (typeof window !== "undefined" ? (window as any).env?.VITE_SUPABASE_ANON_KEY : undefined) ||
  process.env.SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndzcGFxdGlycXNsYXJienJua2hmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2MzY0MjksImV4cCI6MjA5ODIxMjQyOX0.vZFMVWO2wmHGpGrTSnbwmUc7oSLvxm1Mgo1gvCPsSoA";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
