import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Users, ArrowRight, MapPin, Package } from "lucide-react";
import { formatDate, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";

interface Schedule {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  type: string;
  tags: string[];
  buyer?: {
    name: string;
  };
  seller?: {
    name: string;
  };
  product?: {
    name: string;
  };
}

interface UpcomingSchedulesProps {
  schedules: Schedule[];
}

export function UpcomingSchedules({ schedules }: UpcomingSchedulesProps) {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'DELIVERY':
        return 'info';
      case 'PICKUP':
        return 'warning';
      case 'MEETING':
        return 'secondary';
      case 'EVENT':
        return 'success';
      default:
        return 'secondary';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'DELIVERY':
        return 'Entrega';
      case 'PICKUP':
        return 'Retirada';
      case 'MEETING':
        return 'Reunião';
      case 'EVENT':
        return 'Evento';
      default:
        return type;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'DELIVERY':
        return <MapPin className="h-3 w-3" />;
      case 'PICKUP':
        return <Package className="h-3 w-3" />;
      case 'MEETING':
        return <Users className="h-3 w-3" />;
      case 'EVENT':
        return <Calendar className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  return (
    <Card className="bg-gradient-to-b from-muted/30 via-background/30 to-background/30 backdrop-blur-md @container/card h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          Próximos Agendamentos
        </CardTitle>
        <Link href="/dashboard/calendar" >
          <Button variant="ghost" size="sm" className="text-xs">
            Ver agenda
            <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        {schedules.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum agendamento próximo</p>
          </div>
        ) : (
          schedules.slice(0, 5).map((schedule) => (
            <div
              key={schedule.id}
              className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex-shrink-0 mt-0.5">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  {getTypeIcon(schedule.type)}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-sm truncate">
                    {schedule.title || getTypeText(schedule.type)}
                  </p>
                 
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                  <Clock className="h-3 w-3" />
                  {formatDate(new Date(schedule.startDate), "dd/MM", { locale: ptBR })} às {format(new Date(schedule.startDate), "HH:mm")}
                </div>
                {schedule.description && (
                  <p className="text-xs text-muted-foreground truncate">
                    {schedule.description}
                  </p>
                )}
                {(schedule.buyer || schedule.seller || schedule.product) && (
                  <p className="text-xs text-muted-foreground truncate mt-1">
                    {schedule.buyer?.name || schedule.seller?.name || schedule.product?.name}
                  </p>
                )}
                {schedule.tags.length > 0 && (
                  <div className="flex gap-1 mt-1">
                    {schedule.tags.slice(0, 2).map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs px-1 py-0">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}