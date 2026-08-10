import { View, Text, TouchableOpacity } from 'react-native';
import { PACKAGE_TYPE } from 'react-native-purchases';
import type { PurchasesPackage } from 'react-native-purchases';

type Props = {
  packages: PurchasesPackage[];
  selected: PurchasesPackage | undefined;
  loading: boolean;
  onSelect: (identifier: string) => void;
  onRetry: () => void;
};

// "1 month, auto-renewing". packageType is a reliable enum; subscriptionPeriod is
// nullable, so it's only the fallback.
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

function shortPeriod(pkg: PurchasesPackage): string {
  switch (pkg.packageType) {
    case PACKAGE_TYPE.WEEKLY:
      return '1 week';
    case PACKAGE_TYPE.ANNUAL:
      return '1 year';
    default:
      return '1 month';
  }
}

/**
 * The price slot: everything between the hairline and the Subscribe button.
 *
 * Owns three states (loading / priced / unreachable) and two shapes (a single price,
 * or a row per package once more than one exists). The multi-package shape is not
 * speculative — `availablePackages[0]` used to be indexed blindly, so adding an annual
 * tier in the RevenueCat dashboard would have hidden it with no error and nothing in
 * the logs.
 *
 * Rows are hairlines, never cards, and selection is carried by a word as well as by
 * colour — DESIGN.md forbids colour-only signalling.
 */
export default function PaywallPrice({ packages, selected, loading, onSelect, onRetry }: Props) {
  if (loading) {
    return (
      <>
        <View className="h-px bg-[rgba(232,220,196,0.13)]" />
        <View className="mt-7 h-9 w-32 rounded bg-[rgba(232,220,196,0.07)]" />
        <View className="mt-3 h-[13px] w-44 rounded bg-[rgba(232,220,196,0.07)]" />
      </>
    );
  }

  if (!selected) {
    // A subscriber who reinstalled with no signal must not be trapped here. Restore
    // lives outside this component and stays reachable in every state.
    return (
      <View>
        <View className="h-px bg-[rgba(232,220,196,0.13)]" />
        <Text className="mt-7 text-[15px] leading-[22px] text-danger">
          Couldn&apos;t reach the App Store.
        </Text>
        <Text className="mt-2 text-[15px] leading-[22px] text-sand-dim">
          Prices load from Apple, so this needs a connection. Nothing has been charged.
        </Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onRetry}
          accessibilityRole="button"
          className="mt-6 h-14 items-center justify-center rounded-2xl border border-gold"
        >
          <Text className="text-[15px] font-semibold text-gold">Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <View className="h-px bg-[rgba(232,220,196,0.13)]" />
      {packages.length > 1 ? (
        <View className="mt-4">
          {packages.map((p) => {
            const on = p.identifier === selected.identifier;
            return (
              <TouchableOpacity
                key={p.identifier}
                activeOpacity={0.7}
                onPress={() => onSelect(p.identifier)}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                className="min-h-[44px] flex-row items-center justify-between border-b border-[rgba(232,220,196,0.07)] py-3"
              >
                <Text className={`text-[15px] ${on ? 'text-sand' : 'text-sand-dim'}`}>
                  {shortPeriod(p)}
                  {on ? ' · selected' : ''}
                </Text>
                <Text
                  className={
                    on ? 'font-display text-[20px] text-gold' : 'text-[15px] text-sand-dim'
                  }
                >
                  {p.product.priceString}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        <View className="mt-7">
          <Text className="font-display text-[36px] leading-[38px] text-gold">
            {selected.product.priceString}
          </Text>
          <Text className="mt-2 text-[13px] text-sand-dim">{periodLabel(selected)}</Text>
        </View>
      )}
    </>
  );
}
