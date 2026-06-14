import { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import type { PurchasesOffering, PurchasesPackage } from 'react-native-purchases';

import { useBilling } from 'features/billing/BillingContext';
import {
  getCurrentOffering,
  purchasePackage,
  restorePurchases,
  hasPremiumEntitlement,
} from 'features/billing/services/purchaseService';
import type { PaywallReason } from 'features/billing/types';

const HEADLINE: Record<PaywallReason, string> = {
  manual: 'Unlock premium',
  gate: 'This is a premium feature',
  '402': 'Your access has expired',
};

export default function PaywallModal() {
  const { paywall, closePaywall, refreshUntilPremium } = useBilling();
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [loadingOffering, setLoadingOffering] = useState(false);
  const [busy, setBusy] = useState(false);

  // Fetch the offering each time the paywall opens.
  useEffect(() => {
    if (!paywall.open) return;
    let active = true;
    setLoadingOffering(true);
    getCurrentOffering()
      .then((o) => active && setOffering(o))
      .catch(() => active && setOffering(null))
      .finally(() => active && setLoadingOffering(false));
    return () => {
      active = false;
    };
  }, [paywall.open]);

  const pkg: PurchasesPackage | undefined = offering?.availablePackages[0];

  const handleSubscribe = async () => {
    if (!pkg) return;
    setBusy(true);
    try {
      const info = await purchasePackage(pkg);
      if (hasPremiumEntitlement(info)) {
        closePaywall();
        // Reconcile backend status in the background.
        void refreshUntilPremium();
      }
    } catch (e: any) {
      // User-cancelled is not an error worth alerting.
      if (!e?.userCancelled) {
        Alert.alert('Purchase failed', 'Something went wrong. Please try again.');
      }
    } finally {
      setBusy(false);
    }
  };

  const explainRestore = () =>
    Alert.alert(
      'Restore purchases',
      'Already paid but the app shows the paywall? Tap "Restore purchases" to ' +
        're-activate your subscription. Useful after reinstalling, switching ' +
        'phones, or signing in with a different account — your purchase lives ' +
        'with your App Store account, not just this device.',
    );

  const handleRestore = async () => {
    setBusy(true);
    try {
      const info = await restorePurchases();
      if (hasPremiumEntitlement(info)) {
        closePaywall();
        void refreshUntilPremium();
      } else {
        Alert.alert('Nothing to restore', 'No previous purchases were found.');
      }
    } catch {
      Alert.alert('Restore failed', 'Could not restore purchases. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      visible={paywall.open}
      transparent
      animationType="slide"
      onRequestClose={closePaywall}
    >
      <View className="flex-1 justify-end bg-black/60">
        <View className="rounded-t-3xl border-t border-white/10 bg-slate-950 px-6 pb-10 pt-6">
          <Text className="text-center text-2xl font-bold text-white">
            {HEADLINE[paywall.reason]}
          </Text>
          <Text className="mt-2 text-center text-base text-slate-400">
            Subscribe to unlock swing uploads, drills and results.
          </Text>

          {loadingOffering ? (
            <ActivityIndicator className="my-8" color="#a5b4fc" />
          ) : pkg ? (
            <View className="mt-6 items-center">
              <Text className="text-lg font-semibold text-white">
                {pkg.product.title}
              </Text>
              <Text className="mt-1 text-3xl font-bold text-indigo-400">
                {pkg.product.priceString}
              </Text>
            </View>
          ) : (
            <Text className="my-8 text-center text-slate-400">
              Plans are unavailable right now. Please try again later.
            </Text>
          )}

          <TouchableOpacity
            activeOpacity={0.85}
            disabled={!pkg || busy}
            onPress={handleSubscribe}
            className={`mt-6 rounded-2xl py-4 ${!pkg || busy ? 'bg-indigo-500/40' : 'bg-indigo-500'}`}
          >
            {busy ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-center text-base font-semibold text-white">
                Subscribe
              </Text>
            )}
          </TouchableOpacity>

          <View className="mt-3 flex-row items-center justify-center">
            <TouchableOpacity activeOpacity={0.7} disabled={busy} onPress={handleRestore}>
              <Text className="text-center text-sm font-medium text-slate-400">
                Already subscribed? Restore purchases
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={explainRestore}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              className="ml-1.5 h-5 w-5 items-center justify-center rounded-full border border-slate-500"
            >
              <Text className="text-xs font-bold text-slate-400">?</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity activeOpacity={0.7} disabled={busy} onPress={closePaywall} className="mt-4">
            <Text className="text-center text-sm font-medium text-slate-500">
              Maybe later
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
