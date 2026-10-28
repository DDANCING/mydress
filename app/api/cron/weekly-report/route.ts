import { NextRequest, NextResponse } from 'next/server'
import { sendWeeklyReport } from '@/actions/weekly-schedule-report'

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  try {
    // Verifica o token no header Authorization
    const authHeader = request.headers.get('authorization');
    // Sem CRON_SECRET configurado, "Bearer undefined" não pode servir de senha
    if (!CRON_SECRET || !authHeader || authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await sendWeeklyReport();

    return NextResponse.json({
      success: true,
      message: 'Relatório semanal enviado',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro no cron job:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}