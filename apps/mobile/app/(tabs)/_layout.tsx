import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUiStore } from '@/stores/uiStore';
import { i18n } from '@/lib/i18n';
import { colors, typography } from '@/theme/tokens';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

function TabIcon({ name, focused }: { name: IoniconsName; focused: boolean }) {
  return (
    <Ionicons
      name={focused ? name : (`${name}-outline` as IoniconsName)}
      size={24}
      color={focused ? colors.navy : colors.ink400}
    />
  );
}

export default function TabsLayout() {
  const { locale } = useUiStore();
  const t = (k: string) => i18n.t(k, { locale });
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.navy,
        tabBarInactiveTintColor: colors.ink400,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.stone,
          borderTopWidth: 1,
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : 8,
          height: Platform.OS === 'ios' ? 80 : 64,
        },
        tabBarLabelStyle: {
          ...typography.xs,
          fontWeight: '600',
          marginBottom: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('nav.home'),
          tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="catalog"
        options={{
          title: t('nav.catalog'),
          tabBarIcon: ({ focused }) => <TabIcon name="construct" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="quotes"
        options={{
          title: t('nav.quotes'),
          tabBarIcon: ({ focused }) => <TabIcon name="document-text" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="assistant"
        options={{
          title: t('nav.assistant'),
          tabBarIcon: ({ focused }) => <TabIcon name="chatbubbles" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('nav.profile'),
          tabBarIcon: ({ focused }) => <TabIcon name="person-circle" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
