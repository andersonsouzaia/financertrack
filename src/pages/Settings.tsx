import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ProfileTab } from '@/components/Settings/ProfileTab';
import { PrivacyTab } from '@/components/Settings/PrivacyTab';
import { NotificationsTab } from '@/components/Settings/NotificationsTab';
import { PreferencesTab } from '@/components/Settings/PreferencesTab';
import { FinancialTab } from '@/components/Settings/FinancialTab';
import { OpenAIConfig } from '@/components/Settings/OpenAIConfig';
import { AppearanceTab } from '@/components/Settings/AppearanceTab';
import { BackupTab } from '@/components/Settings/BackupTab';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { User, Wallet, Lock, Bell, Settings as SettingsIcon, Cpu, Palette, Database } from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: 'Perfil', icon: <User size={18} /> },
    { id: 'financial', label: 'Financeiro', icon: <Wallet size={18} /> },
    { id: 'openai', label: 'Inteligência Artificial', icon: <Cpu size={18} /> },
    { id: 'appearance', label: 'Aparência', icon: <Palette size={18} /> },
    { id: 'privacy', label: 'Privacidade', icon: <Lock size={18} /> },
    { id: 'notifications', label: 'Notificações', icon: <Bell size={18} /> },
    { id: 'backup', label: 'Dados e Backup', icon: <Database size={18} /> },
    { id: 'preferences', label: 'Outras Preferências', icon: <SettingsIcon size={18} /> },
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
      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Sidebar de Abas */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <nav className="flex flex-row overflow-x-auto lg:flex-col gap-1 p-1">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                variant={activeTab === tab.id ? 'secondary' : 'ghost'}
                className={`justify-start gap-3 whitespace-nowrap lg:w-full ${activeTab === tab.id ? 'font-medium bg-secondary' : 'text-muted-foreground'
                  }`}
              >
                {tab.icon}
                {tab.label}
              </Button>
            ))}
          </nav>
        </div>

        {/* Conteúdo da Aba */}
        <div className="flex-1 min-w-0">
          <Card className="border-border/50 shadow-sm">
            <CardContent className="p-6 md:p-8">
              {activeTab === 'profile' && <ProfileTab user={user} />}
              {activeTab === 'financial' && <FinancialTab user={user} />}
              {activeTab === 'openai' && <OpenAIConfig user={user} />}
              {activeTab === 'appearance' && <AppearanceTab />}
              {activeTab === 'privacy' && <PrivacyTab user={user} />}
              {activeTab === 'notifications' && <NotificationsTab user={user} />}
              {activeTab === 'backup' && <BackupTab user={user} />}
              {activeTab === 'preferences' && <PreferencesTab user={user} />}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
