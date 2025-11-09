import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { ProfileTab } from '@/components/Settings/ProfileTab';
import { PrivacyTab } from '@/components/Settings/PrivacyTab';
import { NotificationsTab } from '@/components/Settings/NotificationsTab';
import { PreferencesTab } from '@/components/Settings/PreferencesTab';

export default function Settings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: '👤 Perfil' },
    { id: 'privacy', label: '🔒 Privacidade' },
    { id: 'notifications', label: '🔔 Notificações' },
    { id: 'preferences', label: '⚙️ Preferências' },
  ];

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Dashboard
          </Button>
          <h1 className="text-3xl font-heading font-bold">Configurações</h1>
          <p className="text-muted-foreground mt-2">Gerencie sua conta e preferências</p>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar - Tabs */}
          <div className="md:w-48">
            <div className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible">
              {tabs.map(tab => (
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

          {/* Content */}
          <div className="flex-1">
            <div className="bg-card rounded-lg shadow-md p-6 border">
              {activeTab === 'profile' && <ProfileTab user={user} />}
              {activeTab === 'privacy' && <PrivacyTab user={user} />}
              {activeTab === 'notifications' && <NotificationsTab user={user} />}
              {activeTab === 'preferences' && <PreferencesTab user={user} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
