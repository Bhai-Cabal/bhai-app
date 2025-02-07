import { supabase } from '../lib/supabase';

export const protectRoute = async (req: { user: any; }, res: { redirect: (arg0: string) => any; }, next: () => void) => {
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    console.error('Authentication error:', error);
    return res.redirect('/login'); // Redirect to login page if not authenticated
  }

  req.user = user;
  next();
};
