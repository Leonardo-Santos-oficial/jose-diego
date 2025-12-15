'use client';

import { useEffect, useState } from 'react';
import { AviatorController } from '@/modules/aviator/controllers/aviatorController';

export function useAviatorController(userId: string, engineAccessToken: string | null) {
  const [controller] = useState(() => new AviatorController(userId, engineAccessToken));

  useEffect(() => {
    controller.restoreMusicPreference();
    const dispose = controller.connect();
    return () => dispose();
  }, [controller]);

  return controller;
}
