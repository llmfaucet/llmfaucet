'use client';

import { useEffect } from 'react';
import { useTheme } from 'next-themes';
import { api } from '@/lib/api-client';

export function ThemePreferenceSync() {
  const { setTheme } = useTheme();
  useEffect(() => {
    void api.preferences().then(({ preferences }) => setTheme(preferences.theme)).catch(() => undefined);
  }, [setTheme]);
  return null;
}
