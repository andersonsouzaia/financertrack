import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ProfileTab } from '@/components/Settings/ProfileTab';
import { PrivacyTab } from '@/components/Settings/PrivacyTab';
import { NotificationsTab } from '@/components/Settings/NotificationsTab';
import { PreferencesTab } from '@/components/Settings/PreferencesTab';
import { FinancialTab } from '@/components/Settings/FinancialTab';
import { AppLayout } from '@/components/layout/AppLayout';

export default function Settings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: '👤 Perfil' },
    { id: 'financial', label: '💼 Financeiro' },
    { id: 'privacy', label: '🔒 Privacidade' },
    { id: 'notifications', label: '🔔 Notificações' },
    { id: 'preferences', label: '⚙️ Preferências' },
  ];

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <AppLayout
      title="Configurações"
      description="Personalize sua conta, preferências e dados financeiros."
      actions={
        <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')}>
          Voltar ao dashboard
        </Button>
      }
      contentClassName="max-w-5xl mx-auto w-full space-y-6"
    >
      <div className="flex flex-col gap-6 md:flex-row">
        <div className="md:w-48">
          <div className="flex flex-row gap-2 overflow-x-auto md:flex-col md:overflow-visible">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                variant={activeTab === tab.id ? 'default' : 'outline'}
                className="whitespace-nowrap md:whitespace-normal md:justify-start"
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </div>
        <div className="flex-1">
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            {activeTab === 'profile' && <ProfileTab user={user} />}
            {activeTab === 'financial' && <FinancialTab user={user} />}
            {activeTab === 'privacy' && <PrivacyTab user={user} />}
            {activeTab === 'notifications' && <NotificationsTab user={user} />}
            {activeTab === 'preferences' && <PreferencesTab user={user} />}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
