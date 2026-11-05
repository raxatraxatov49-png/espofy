import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://qxzzwjynggduwfjyoxdu.supabase.co";

const SUPABASE_KEY = "sb_publishable_oPVLrHCQiR6-HiTKCGXO7w_3QhWRQgS";

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);
