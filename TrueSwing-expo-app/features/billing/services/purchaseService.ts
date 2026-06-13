import { Platform } from 'react-native';
import Purchases, {
  type CustomerInfo,
  type PurchasesOffering,
  type PurchasesPackage,
} from 'react-native-purchases';

/**
 * RevenueCat SDK wrapper. Owns all `react-native-purchases` calls so the rest
 * of the app never imports the SDK directly. The backend stays the source of
 * truth for entitlement (see billingService); this layer drives the store
 * transaction and gives an optimistic, immediate unlock signal.
 *
 *   configure(once) ──► identifyUser(supabase id) on login
 *                        getCurrentOffering ──► purchaseCurrentPackage
 *                        forgetUser() on logout
 */

// The single entitlement configured in the RevenueCat dashboard.
const PREMIUM_ENTITLEMENT = 'premium';

let configured = false;

function platformApiKey(): string | undefined {
  return Platform.select({
    ios: process.env.EXPO_PUBLIC_RC_APPLE_KEY,
    android: process.env.EXPO_PUBLIC_RC_GOOGLE_KEY,
  });
}

/** Configure the SDK once with the platform public key. No-op if already done. */
export function configurePurchases(): void {
  if (configured) return;

  const apiKey = platformApiKey();
  if (!apiKey) {
    console.warn(`[billing] No RevenueCat SDK key for platform ${Platform.OS}`);
    return;
  }

  Purchases.configure({ apiKey });
  configured = true;
}

/** Map the RevenueCat identity to the Supabase user id. Call on login. */
export async function identifyUser(userId: string): Promise<void> {
  if (!configured) configurePurchases();
  await Purchases.logIn(userId);
}

/** Drop the identity so the next user doesn't inherit entitlements. Call on logout. */
export async function forgetUser(): Promise<void> {
  if (!configured) return;
  await Purchases.logOut();
}

/** The default offering, or null if none is configured / fetch fails upstream. */
export async function getCurrentOffering(): Promise<PurchasesOffering | null> {
  const offerings = await Purchases.getOfferings();
  return offerings.current ?? null;
}

/**
 * Purchase a package. Returns the fresh CustomerInfo so the caller can unlock
 * optimistically while the store → RevenueCat → backend webhook settles.
 */
export async function purchasePackage(pkg: PurchasesPackage): Promise<CustomerInfo> {
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return customerInfo;
}

/** Restore prior purchases (new device / reinstall). */
export async function restorePurchases(): Promise<CustomerInfo> {
  return Purchases.restorePurchases();
}

/** True if the SDK currently reports the premium entitlement active. */
export function hasPremiumEntitlement(info: CustomerInfo): boolean {
  return info.entitlements.active[PREMIUM_ENTITLEMENT] !== undefined;
}
