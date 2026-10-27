import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Activity, ArrowRight, CheckCircle, Clock, AlertCircle, DollarSign } from "lucide-react";
import { formatDistance } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ActivityItem {
  id: string;
  type: 'order' | 'payment' | 'schedule' | 'contract';
  title: string;
  description: string;
  timestamp: string;
  user?: {
    name: string;
    avatar?: string;
  };
  status?: 'success' | 'warning' | 'error' | 'info';
  amount?: number;
}

interface ActivityFeedProps {
  activities: ActivityItem[];
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  const getActivityIcon = (type: string, status?: string) => {
    switch (type) {
      case 'payment':
        return <DollarSign className="h-3 w-3" />;
      case 'order':
        return status === 'success' ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />;
      case 'schedule':
        return <Clock className="h-3 w-3" />;
      case 'contract':
        return <CheckCircle className="h-3 w-3" />;
      default:
        return <Activity className="h-3 w-3" />;
    }
  };

  const getActivityColor = (type: string, status?: string) => {
    if (status) {
      switch (status) {
        case 'success':
          return 'text-green-500';
        case 'warning':
          return 'text-yellow-500';
        case 'error':
          return 'text-red-500';
        case 'info':
          return 'text-blue-500';
        default:
          return 'text-muted-foreground';
      }
    }

    switch (type) {
      case 'payment':
        return 'text-green-500';
      case 'order':
        return 'text-blue-500';
      case 'schedule':
        return 'text-purple-500';
      case 'contract':
        return 'text-orange-500';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <Card className="bg-gradient-to-b from-muted/30 via-background/30 to-background/30 backdrop-blur-md @container/card h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          Atividades Recentes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhuma atividade recente</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-px bg-border"></div>
            
            {activities.slice(0, 8).map((activity, index) => (
              <div key={activity.id} className="relative flex items-start gap-3 pb-4">
                {/* Timeline dot */}
                <div className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-card ${getActivityColor(activity.type, activity.status)}`}>
                  {getActivityIcon(activity.type, activity.status)}
                </div>
                
                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium leading-tight">
                        {activity.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {activity.description}
                      </p>
                      {activity.amount && (
                        <p className="text-xs font-medium text-green-600 mt-1">
                          R$ {activity.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 ml-2">
                      <span className="text-xs text-muted-foreground">
                        {formatDistance(new Date(activity.timestamp), new Date(), { 
                          addSuffix: true, 
                          locale: ptBR 
                        })}
                      </span>
                      {activity.status && (
                        <Badge variant="outline" className="text-xs">
                          {activity.status === 'success' && 'Concluído'}
                          {activity.status === 'warning' && 'Pendente'}
                          {activity.status === 'error' && 'Erro'}
                          {activity.status === 'info' && 'Em andamento'}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {activity.user && (
                    <div className="flex items-center gap-2 mt-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={activity.user.avatar} />
                        <AvatarFallback className="text-xs">
                          {activity.user.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground">
                        {activity.user.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export const defaultActivities: ActivityItem[] = [
  {
    id: '1',
    type: 'payment',
    title: 'Pagamento recebido',
    description: 'Contrato #1234 - Festa de aniversário',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
    status: 'success',
    amount: 2500,
    user: {
      name: 'Maria Silva'
    }
  },
  {
    id: '2',
    type: 'order',
    title: 'Novo pedido criado',
    description: 'Aluguel de mesa e cadeiras para evento corporativo',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2h ago
    status: 'info',
    user: {
      name: 'João Santos'
    }
  },
  {
    id: '3',
    type: 'schedule',
    title: 'Entrega agendada',
    description: 'Entrega para evento de casamento - Sábado 15h',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4h ago
    status: 'warning'
  },
  {
    id: '4',
    type: 'contract',
    title: 'Contrato assinado',
    description: 'Contrato #1235 aprovado e assinado digitalmente',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6h ago
    status: 'success',
    user: {
      name: 'Ana Costa'
    }
  },
  {
    id: '5',
    type: 'payment',
    title: 'Pagamento pendente',
    description: 'Cobrança vencida - Contrato #1230',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), // 8h ago
    status: 'warning',
    amount: 1800
  }
];