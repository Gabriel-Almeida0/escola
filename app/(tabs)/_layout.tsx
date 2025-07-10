import { Tabs } from 'expo-router';
import { Users, Calendar, FileText, Chrome as Home } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          paddingBottom: 8,
          paddingTop: 8,
          height: 70,
        },
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#6B7280',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Registros',
          tabBarIcon: ({ size, color }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="students"
        options={{
          title: 'Alunos',
          tabBarIcon: ({ size, color }) => <Users size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendário',
          tabBarIcon: ({ size, color }) => <Calendar size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Relatórios',
          tabBarIcon: ({ size, color }) => <FileText size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}