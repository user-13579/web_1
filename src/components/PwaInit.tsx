'use client';

import { useEffect } from 'react';

export default function PwaInit() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const register = async () => {
        try {
          await navigator.serviceWorker.register('/service-worker.js');
        } catch (err) {
          // ignore
        }
      };
      register();
    }
  }, []);
  return null;
}




