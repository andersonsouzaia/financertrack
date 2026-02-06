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
import { Card, CardContent } from '@/components/ui/card';

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
      contentClassName="w-full space-y-10"
    >
      <div className="flex flex-col gap-10 md:flex-row">
        <div className="md:w-56">
          <div className="flex flex-row gap-2 overflow-x-auto pb-2 md:flex-col md:overflow-visible md:pb-0">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                variant={activeTab === tab.id ? 'default' : 'outline'}
                className={`whitespace-nowrap md:whitespace-normal md:justify-start transition-all duration-300 ${
                  activeTab === tab.id ? 'font-semibold shadow-sm' : ''
                }`}
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </div>
        <div className="flex-1">
          <Card className="border-border/50">
            <CardContent className="p-6">
              {activeTab === 'profile' && <ProfileTab user={user} />}
              {activeTab === 'financial' && <FinancialTab user={user} />}
              {activeTab === 'privacy' && <PrivacyTab user={user} />}
              {activeTab === 'notifications' && <NotificationsTab user={user} />}
              {activeTab === 'preferences' && <PreferencesTab user={user} />}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
