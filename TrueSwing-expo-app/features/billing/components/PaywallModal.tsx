import { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, ActivityIndicator, Alert, Linking } from 'react-native';
import { PACKAGE_TYPE } from 'react-native-purchases';
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

// TODO(you): paste your real hosted URLs here. Both must be functional, reachable
// HTTPS pages — Apple clicks them during review. If you don't have your own EULA,
// Apple's standard one is accepted:
// https://www.apple.com/legal/internet-services/itunes/dev/stdeula/
const PRIVACY_POLICY_URL = 'https://trueswing.se/legal/privacy-policy';
const TERMS_OF_USE_URL = 'https://trueswing.se/legal/terms-and-conditions';

// "1 month, auto-renewing" style label. packageType is a reliable enum;
// subscriptionPeriod is nullable, so it's only the fallback.
function periodLabel(pkg: PurchasesPackage): string {
  switch (pkg.packageType) {
    case PACKAGE_TYPE.WEEKLY:
      return '1 week, auto-renewing';
    case PACKAGE_TYPE.MONTHLY:
      return '1 month, auto-renewing';
    case PACKAGE_TYPE.ANNUAL:
      return '1 year, auto-renewing';
    default:
      return pkg.product.subscriptionPeriod
        ? `${pkg.product.subscriptionPeriod}, auto-renewing`
        : 'auto-renewing subscription';
  }
}

async function openLink(url: string) {
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('Error', 'Could not open the link.');
  }
}

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
              <Text className="mt-1 text-sm text-slate-400">{periodLabel(pkg)}</Text>
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

          {pkg ? (
            <>
              <Text className="mt-4 text-center text-xs leading-5 text-slate-500">
                Payment is charged to your Apple ID account at confirmation. The
                subscription renews automatically for the same price and period
                unless cancelled at least 24 hours before the end of the current
                period. Manage or cancel anytime in your App Store account settings.
              </Text>

              <View className="mt-3 flex-row items-center justify-center">
                <TouchableOpacity activeOpacity={0.7} onPress={() => openLink(TERMS_OF_USE_URL)}>
                  <Text className="text-xs font-medium text-slate-400 underline">
                    Terms of Use
                  </Text>
                </TouchableOpacity>
                <Text className="mx-2 text-xs text-slate-600">·</Text>
                <TouchableOpacity activeOpacity={0.7} onPress={() => openLink(PRIVACY_POLICY_URL)}>
                  <Text className="text-xs font-medium text-slate-400 underline">
                    Privacy Policy
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : null}

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
