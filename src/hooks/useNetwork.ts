import { useState, useEffect } from 'react';
import * as Network from 'expo-network';

export function useNetwork() {
  const [isOnline, setIsOnline] = useState(true);
  const [isWifi, setIsWifi] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function check() {
      const state = await Network.getNetworkStateAsync();
      if (!mounted) return;
      setIsOnline(state.isConnected ?? true);
      setIsWifi(state.type === Network.NetworkStateType.WIFI);
    }

    check();

    // Re-check periodically (expo-network doesn't have a listener API)
    const interval = setInterval(check, 10_000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return { isOnline, isWifi };
}
