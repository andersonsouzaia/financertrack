import { Shield, Lock, CheckCircle2, Globe, FileCheck, Server } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SecurityBadge } from '@/components/security/SecurityBadge';

export default function Security() {
  return (
    <AppLayout
      title="Segurança e Privacidade"
      description="Informações sobre como protegemos seus dados"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Segurança</h2>
            <p className="text-muted-foreground">
              Seus dados estão protegidos com os mais altos padrões de segurança
            </p>
          </div>
        </div>

        {/* Security Badge */}
        <SecurityBadge />

        {/* Encryption */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              Criptografia
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Dados em Repouso</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Todos os dados armazenados são criptografados usando o padrão AES-256,
                um dos algoritmos de criptografia mais seguros disponíveis.
              </p>
              <Badge variant="outline">AES-256</Badge>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Dados em Trânsito</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Toda comunicação entre seu dispositivo e nossos servidores é protegida
                com TLS 1.3, garantindo que seus dados não possam ser interceptados.
              </p>
              <Badge variant="outline">TLS 1.3</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Compliance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-primary" />
              Conformidade e Certificações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold">LGPD</h3>
                  <p className="text-sm text-muted-foreground">
                    Totalmente em conformidade com a Lei Geral de Proteção de Dados
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold">GDPR</h3>
                  <p className="text-sm text-muted-foreground">
                    Atende aos requisitos do Regulamento Geral de Proteção de Dados da UE
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold">PCI DSS</h3>
                  <p className="text-sm text-muted-foreground">
                    Padrões de segurança para processamento de dados de cartão
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold">SOC 2 Type II</h3>
                  <p className="text-sm text-muted-foreground">
                    Auditoria de segurança, disponibilidade e confidencialidade
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Availability */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5 text-primary" />
              Disponibilidade
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Uptime</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Nosso objetivo é manter o sistema disponível 99.999% do tempo (Five Nines),
                garantindo que você sempre tenha acesso aos seus dados financeiros.
              </p>
              <Badge variant="outline" className="text-green-600 border-green-600">
                99.999% Uptime
              </Badge>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Redundância Geográfica</h3>
              <p className="text-sm text-muted-foreground">
                Seus dados são replicados em múltiplos data centers geograficamente distribuídos,
                garantindo continuidade mesmo em caso de falhas regionais.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Architecture */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              Arquitetura
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Microserviços</h3>
              <p className="text-sm text-muted-foreground">
                Nossa arquitetura baseada em microserviços garante modularidade,
                escalabilidade e resiliência. Cada componente é isolado e pode ser
                atualizado independentemente.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Logs Imutáveis</h3>
              <p className="text-sm text-muted-foreground">
                Todas as transações e alterações são registradas em logs imutáveis,
                criando um histórico completo e auditável de todas as operações.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card>
          <CardHeader>
            <CardTitle>Privacidade</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Respeitamos sua privacidade e nunca compartilhamos seus dados financeiros
              com terceiros sem seu consentimento explícito. Todos os dados são processados
              de acordo com nossa Política de Privacidade.
            </p>
            <div className="flex gap-2">
              <Badge variant="outline">Política de Privacidade</Badge>
              <Badge variant="outline">Termos de Uso</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
