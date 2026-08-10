import { useCallback, useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import type { PurchasesOffering, PurchasesPackage } from 'react-native-purchases';

import { useBilling } from 'features/billing/BillingContext';
import PaywallLegal from 'features/billing/components/PaywallLegal';
import PaywallPrice from 'features/billing/components/PaywallPrice';
import {
  getCurrentOffering,
  purchasePackage,
  restorePurchases,
  hasPremiumEntitlement,
} from 'features/billing/services/purchaseService';
import type { PaywallReason } from 'features/billing/types';

/**
 * Full-screen paywall.
 *
 * NOT a route, and cannot become one: BillingContext renders this as a sibling of
 * {children}, which puts it outside the expo-router tree entirely. The 402 interceptor
 * also fires from anywhere with no navigator in hand. `presentationStyle="fullScreen"`
 * with NO `transparent` prop is the whole mechanism — RN silently downgrades to
 * `overFullScreen` whenever `transparent` is true.
 *
 *   BillingProvider
 *     |- {children}        <- the router tree lives in here
 *     '- <PaywallModal />  <- reached only via paywall.open state
 */

// One record rather than three `reason ===` ternaries scattered through the render.
// A golfer whose access just died mid-practice does not need a feature list, so 402
// drops the value set and says what happened instead.
const COPY: Record<PaywallReason, { headline: string; showValueSet: boolean; note?: string }> = {
  manual: { headline: 'Keep practicing\nwith a plan', showValueSet: true },
  gate: { headline: "That one's part\nof the plan", showValueSet: true },
  '402': {
    headline: 'Your plan\nhas ended',
    showValueSet: false,
    note: 'Nothing has been charged. Your focuses and history are still here.',
  },
};

const VALUE_SET = [
  'Film a swing, get it analysed',
  'Drills chosen for what you actually lose shots on',
  'A plan that adapts as you improve',
];

export default function PaywallModal() {
  const insets = useSafeAreaInsets();
  const { paywall, closePaywall, refreshUntilPremium } = useBilling();
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loadingOffering, setLoadingOffering] = useState(false);
  const [busy, setBusy] = useState(false);

  const loadOffering = useCallback(() => {
    let active = true;
    setLoadingOffering(true);
    getCurrentOffering()
      .then((o) => {
        if (!active) return;
        setOffering(o);
        setSelectedId(o?.availablePackages[0]?.identifier ?? null);
      })
      .catch(() => active && setOffering(null))
      .finally(() => active && setLoadingOffering(false));
    return () => {
      active = false;
    };
  }, []);

  // Fetch the offering each time the paywall opens.
  useEffect(() => {
    if (!paywall.open) return;
    return loadOffering();
  }, [paywall.open, loadOffering]);

  const packages = offering?.availablePackages ?? [];
  // Never index [0] blindly: a second package added in the RevenueCat dashboard would
  // otherwise be hidden with no error and nothing in the logs.
  const pkg = packages.find((p) => p.identifier === selectedId) ?? packages[0];
  const copy = COPY[paywall.reason];

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
    } catch (e) {
      // User-cancelled is not an error worth alerting.
      if (!(e as { userCancelled?: boolean })?.userCancelled) {
        Alert.alert('Purchase failed', 'Something went wrong. Please try again.');
      }
    } finally {
      setBusy(false);
    }
  };

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

  const ctaDisabled = !pkg || busy;

  return (
    <Modal
      visible={paywall.open}
      presentationStyle="fullScreen"
      animationType="slide"
      onRequestClose={closePaywall}
    >
      <View
        className="flex-1 bg-ink px-6"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom + 16 }}
      >
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={closePaywall}
          accessibilityRole="button"
          accessibilityLabel="Close"
          className="-ml-3 h-11 w-11 items-center justify-center"
        >
          <X size={24} color="#EADFC8" />
        </TouchableOpacity>

        <View className="mt-8">
          <Text className="text-[11px] font-semibold uppercase tracking-[2.5px] text-sand-dim">
            TrueSwing Premium
          </Text>
          <Text className="mt-[18px] font-display text-[30px] leading-[36px] text-sand">
            {copy.headline}
          </Text>
        </View>

        {copy.showValueSet ? (
          <View className="mt-8" accessibilityRole="list">
            {VALUE_SET.map((item) => (
              <View key={item} className="mb-3.5 flex-row">
                {/* Gold-stroked mark, not a numbered rail: these are true at once, in no
                    order, so a spine would tell the golfer to work through them in turn. */}
                <View
                  accessibilityElementsHidden
                  importantForAccessibility="no"
                  className="mr-3 mt-[7px] h-[9px] w-[9px] rounded-full border border-gold"
                />
                <Text className="flex-1 text-[15px] leading-[22px] text-sand">{item}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {copy.note ? (
          <Text className="mt-5 text-[15px] leading-[22px] text-sand-dim">{copy.note}</Text>
        ) : null}

        <View className="flex-1" />

        <PaywallPrice
          packages={packages}
          selected={pkg}
          loading={loadingOffering}
          onSelect={setSelectedId}
          onRetry={loadOffering}
        />

        {pkg || loadingOffering ? (
          <TouchableOpacity
            activeOpacity={0.85}
            disabled={ctaDisabled}
            onPress={handleSubscribe}
            accessibilityRole="button"
            accessibilityState={{ disabled: ctaDisabled }}
            className={`mt-7 h-14 items-center justify-center rounded-2xl ${ctaDisabled ? 'bg-gold/30' : 'bg-gold'}`}
          >
            {busy ? (
              <ActivityIndicator color="#0A0F1A" />
            ) : (
              <Text
                className={`text-[15px] font-semibold ${ctaDisabled ? 'text-ink/50' : 'text-ink'}`}
              >
                Subscribe
              </Text>
            )}
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          activeOpacity={0.7}
          disabled={busy}
          onPress={handleRestore}
          accessibilityRole="button"
          accessibilityState={{ disabled: busy }}
          className="mt-6 min-h-[44px] justify-center"
        >
          <Text className="text-[13px] font-medium text-sand">Restore purchases</Text>
          {/* This used to be a 20px "?" button opening an Alert, because a bottom sheet
              had no room for the sentence. Full screen does. */}
          <Text className="mt-1 text-[13px] leading-5 text-sand-dim">
            Already paid? Restoring re-activates your subscription after a reinstall or a
            new phone.
          </Text>
        </TouchableOpacity>

        <View className="mt-6">
          <PaywallLegal />
        </View>
      </View>
    </Modal>
  );
}
