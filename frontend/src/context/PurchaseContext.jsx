import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const PurchaseContext = createContext();

const STORAGE_KEY = 'pay_unlock_purchases_v1';

export function PurchaseProvider({ children }) {
  // Purchases map: { [mediaId]: { purchaseToken, recoveryCode, unlockedAt } }
  const [purchases, setPurchases] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      console.warn('Failed to parse saved purchases:', e);
      return {};
    }
  });

  const [unlockedItems, setUnlockedItems] = useState([]);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(purchases));
    } catch (e) {
      console.error('Failed to save purchase to localStorage:', e);
    }
  }, [purchases]);

  const savePurchase = ({ mediaId, purchaseToken, recoveryCode }) => {
    if (!mediaId) return;
    setPurchases(prev => ({
      ...prev,
      [mediaId]: {
        purchaseToken,
        recoveryCode,
        unlockedAt: new Date().toISOString()
      }
    }));
  };

  const isUnlocked = (mediaId) => {
    return Boolean(purchases[mediaId]);
  };

  const getPurchase = (mediaId) => {
    return purchases[mediaId] || null;
  };

  // Re-fetch library items metadata from backend
  const refreshLibrary = async () => {
    const keys = Object.keys(purchases);
    if (keys.length === 0) {
      setUnlockedItems([]);
      return;
    }

    setIsLoadingLibrary(true);
    try {
      const tokens = Object.values(purchases).map(p => p.purchaseToken).filter(Boolean);
      const recoveryCodes = Object.values(purchases).map(p => p.recoveryCode).filter(Boolean);

      const res = await api.getMyLibrary({ tokens, recoveryCodes });
      if (res.success) {
        setUnlockedItems(res.items || []);
      }
    } catch (err) {
      console.error('Failed to load library:', err);
    } finally {
      setIsLoadingLibrary(false);
    }
  };

  return (
    <PurchaseContext.Provider value={{
      purchases,
      isUnlocked,
      getPurchase,
      savePurchase,
      unlockedItems,
      isLoadingLibrary,
      refreshLibrary
    }}>
      {children}
    </PurchaseContext.Provider>
  );
}

export function usePurchases() {
  const context = useContext(PurchaseContext);
  if (!context) {
    throw new Error('usePurchases must be used within a PurchaseProvider');
  }
  return context;
}
