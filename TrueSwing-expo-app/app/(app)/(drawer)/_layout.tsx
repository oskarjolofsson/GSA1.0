import { useWindowDimensions } from 'react-native';
import { Drawer } from 'expo-router/drawer';

import AddFocusDrawer from 'features/addFocus/AddFocusDrawer';

/**
 * Home is the app. The drawer is the only other thing at this level, and it holds
 * nothing but the three ways to start a focus.
 *
 * FIXED 300px, NOT THE 70%-OF-SCREEN DEFAULT. The drawer carries three short rows
 * whose measure should not change with the device — at 70% an iPad gets a ~520px
 * menu for three links. The 80% cap only bites on a narrow phone, where it keeps a
 * sliver of home visible so the drawer still reads as an overlay.
 */
export default function DrawerLayout() {
  const { width } = useWindowDimensions();

  return (
    <Drawer
      drawerContent={(props) => <AddFocusDrawer {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        drawerStyle: {
          width: Math.min(300, width * 0.8),
          backgroundColor: '#0A0F1A',
          borderRightWidth: 1,
          borderRightColor: 'rgba(232,220,196,.13)',
        },
      }}>
      <Drawer.Screen name="index" />
    </Drawer>
  );
}
