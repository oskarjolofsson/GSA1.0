import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { LogOut, UserX } from 'lucide-react-native';

import { useAuth } from 'features/auth/AuthProvider';
import colors from 'lib/colors';

/**
 * Sign out and delete, at the bottom of settings where the irreversible things belong.
 *
 * Only delete is `danger`. Signing out is reversible -- painting it red would spend the
 * palette's one alarm colour on something that is not a failure, and would leave nothing
 * louder for the action that actually ends the account.
 */
export default function AccountActions() {
  const { signOut, removeAccount } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch {
      Alert.alert('Error', 'Failed to sign out.');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete account',
      'Your account and everything in it will be removed. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            removeAccount()
              .then(() => Alert.alert('Account deleted', 'Your account has been deleted.'))
              .catch(() => Alert.alert('Error', 'Failed to delete account.'));
          },
        },
      ]
    );
  };

  return (
    <View>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={handleSignOut}
        accessibilityRole="button"
        className="min-h-[44px] flex-row items-center gap-x-3 border-t border-[rgba(232,220,196,0.13)]">
        <LogOut size={17} color={colors.sand} strokeWidth={1.75} importantForAccessibility="no" />
        <Text className="text-[15px] text-sand">Sign out</Text>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={handleDelete}
        accessibilityRole="button"
        className="min-h-[44px] flex-row items-center gap-x-3">
        <UserX size={17} color={colors.danger} strokeWidth={1.75} importantForAccessibility="no" />
        <Text className="text-[15px] text-danger">Delete account</Text>
      </TouchableOpacity>
    </View>
  );
}
