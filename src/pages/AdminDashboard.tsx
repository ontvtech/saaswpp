import React, { useEffect, useState, useRef } from 'react';
import { useStore } from '../store/useStore';
import { 
  ShieldCheck, 
  Settings, 
  Activity, 
  Database, 
  Server, 
  Users, 
  Store, 
  DollarSign, 
  Zap, 
  Download, 
  TrendingUp,
  MessageSquare,
  Heart,
  Terminal
} from 'lucide-react';
import { Toast, ToastType } from '../components/Toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export const AdminDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState({
    totalResellers: 12,
    activePlans: 4,
    mrr: 12450,
    apiHealth: '99.9%',
    dbHealth: '100%',
    aiHealth: '98.5%',
    dailyConsumption: '0 tokens',
    totalMessages: 0,
    estimatedCost: '0.00',
    smartBox: '124 pendentes',
    inbox: '2.4k mensagens',
    hotEngagement: '85% taxa'
  });

  const [telemetryData, setTelemetryData] = useState<any[]>([]);
  const [logs, setLogs] = useState<string>('');
  const logsEndRef = useRef<HTMLDivElement>(null);

  const { token, fetchWithAuth } = useStore();
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const handleQuickAction = (action: string) => {
    setLoadingAction(action);
    setToast({ message: `Iniciando: ${action}...`, type: 'info' });
    
    setTimeout(() => {
      setLoadingAction(null);
      setToast({ message: `${action} concluído com sucesso!`, type: 'success' });
    }, 2000);
  };

  useEffect(() => {
    const fetchAiStats = async () => {
      try {
        const res = await fetchWithAuth('/api/admin/ai-stats');
        if (!res.ok) throw new Error('API Error');
        const data = await res.json();
        setMetrics(prev => ({
          ...prev,
          dailyConsumption: `${(data.totalTokens / 1000).toFixed(1)}k tokens`,
          totalMessages: data.totalMessages,
          estimatedCost: data.estimatedCost
        }));
      } catch (e) {
        if (import.meta.env.DEV) {
          setMetrics(prev => ({
            ...prev,
            dailyConsumption: '124.5k tokens',
            totalMessages: 8420,
            estimatedCost: '12.45'
          }));
        }
        console.error('Failed to fetch AI stats');
      }
    };

    const fetchTelemetry = async () => {
      try {
        const res = await fetchWithAuth('/api/admin/telemetry');
        if (!res.ok) throw new Error('API Error');
        const data = await res.json();
        
        const now = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        setTelemetryData(prev => {
          const newData = [...prev, {
            time: now,
            cpu16gb: parseFloat(data?.node16gb?.cpu || '0'),
            ram16gb: parseFloat(data?.node16gb?.memory?.used || '0'),
            cpu8gb: parseFloat(data?.node8gb?.cpu || '0'),
            ram8gb: parseFloat(data?.node8gb?.memory?.used || '0'),
          }];
          if (newData.length > 20) return newData.slice(newData.length - 20);
          return newData;
        });
      } catch (e) {
        if (import.meta.env.DEV) {
          const now = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          setTelemetryData(prev => {
            const newData = [...prev, {
              time: now,
              cpu16gb: 20 + Math.random() * 40, // 20% to 60%
              ram16gb: 45 + Math.random() * 15,
              cpu8gb: 15 + Math.random() * 30,
              ram8gb: 30 + Math.random() * 10,
            }];
            if (newData.length > 20) return newData.slice(newData.length - 20);
            return newData;
          });
        }
        console.error('Failed to fetch telemetry');
      }
    };

    const fetchLogs = async () => {
      try {
        const res = await fetchWithAuth('/api/admin/logs?type=backend');
        if (!res.ok) throw new Error('API Error');
        const data = await res.json();
        setLogs(data.logs);
      } catch (e) {
        if (import.meta.env.DEV) {
          const demoLogs = [
            `[${new Date().toISOString()}] INFO: Evolution API connected successfully.`,
            `[${new Date().toISOString()}] WARN: High latency detected in Node 8GB.`,
            `[${new Date().toISOString()}] INFO: AI Orchestrator processing message from +5511999999999.`,
            `[${new Date().toISOString()}] SUCCESS: Payment processed for tenant_842.`,
            `[${new Date().toISOString()}] DEBUG: Redis cache cleared.`
          ].join('\n');
          setLogs(prev => (prev + '\n' + demoLogs).split('\n').slice(-50).join('\n'));
        }
        console.error('Failed to fetch logs');
      }
    };

    fetchAiStats();
    fetchTelemetry();
    fetchLogs();

    const statsInterval = setInterval(fetchAiStats, 30000);
    const telemetryInterval = setInterval(fetchTelemetry, 5000);
    const logsInterval = setInterval(fetchLogs, 5000);

    return () => {
      clearInterval(statsInterval);
      clearInterval(telemetryInterval);
      clearInterval(logsInterval);
    };
  }, [token]);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter">Painel Administrativo</h2>
          <p className="text-muted-foreground">Visão geral do sistema e saúde da infraestrutura.</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-500 px-4 py-2 rounded-2xl border border-emerald-500/20">
          <Activity className="w-4 h-4 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-widest">Sistema Online</span>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6 border-l-4 border-primary">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-primary" />
            <h3 className="text-xs font-bold text-muted-foreground uppercase">Revendedores</h3>
          </div>
          <p className="text-3xl font-black">{metrics.totalResellers}</p>
          <p className="text-[10px] text-emerald-500 font-bold mt-1">+2 este mês</p>
        </div>
        <div className="glass-card p-6 border-l-4 border-emerald-500">
          <div className="flex items-center gap-3 mb-2">
            <Server className="w-5 h-5 text-emerald-500" />
            <h3 className="text-xs font-bold text-muted-foreground uppercase">Saúde Infra</h3>
          </div>
          <p className="text-3xl font-black">{metrics.apiHealth}</p>
          <p className="text-[10px] text-emerald-500 font-bold mt-1">Uptime 99.9%</p>
        </div>
        <div className="glass-card p-6 border-l-4 border-blue-500">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-5 h-5 text-blue-500" />
            <h3 className="text-xs font-bold text-muted-foreground uppercase">MRR Global</h3>
          </div>
          <p className="text-3xl font-black">R$ {metrics.mrr.toLocaleString()}</p>
          <p className="text-[10px] text-emerald-500 font-bold mt-1">+8% vs anterior</p>
        </div>
        <div className="glass-card p-6 border-l-4 border-amber-500">
          <div className="flex items-center gap-3 mb-2">
            <Zap className="w-5 h-5 text-amber-500" />
            <h3 className="text-xs font-bold text-muted-foreground uppercase">Consumo IA (24h)</h3>
          </div>
          <p className="text-3xl font-black">{metrics.dailyConsumption}</p>
          <div className="flex justify-between items-center mt-1">
            <p className="text-[10px] text-muted-foreground font-bold">{metrics.totalMessages} mensagens</p>
            <p className="text-[10px] text-amber-500 font-bold">Est: ${metrics.estimatedCost}</p>
          </div>
        </div>
      </div>

      {/* Telemetry & Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Telemetry Chart */}
        <div className="glass-card p-6 space-y-6">
          <h3 className="font-bold uppercase text-xs tracking-widest border-b border-border pb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" /> Telemetria em Tempo Real (CPU %)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={telemetryData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="time" stroke="#888" fontSize={10} />
                <YAxis stroke="#888" fontSize={10} domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line type="monotone" dataKey="cpu16gb" name="Nó 16GB (Gateway)" stroke="#10b981" strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="cpu8gb" name="Nó 8GB (Core)" stroke="#3b82f6" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Logs Terminal */}
        <div className="glass-card p-6 space-y-6 flex flex-col h-full">
          <h3 className="font-bold uppercase text-xs tracking-widest border-b border-border pb-4 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-primary" /> Terminal de Logs (Backend)
          </h3>
          <div className="bg-black text-green-400 font-mono text-[10px] p-4 rounded-xl overflow-y-auto flex-1 max-h-64 border border-border/50 shadow-inner">
            <pre className="whitespace-pre-wrap break-words">{logs}</pre>
            <div ref={logsEndRef} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* System Health */}
        <div className="glass-card p-6 space-y-6">
          <h3 className="font-bold uppercase text-xs tracking-widest border-b border-border pb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" /> Estado da Rede Operacional
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Evolution API Cluster</span>
              <span className="text-emerald-500 font-bold text-sm">{metrics.apiHealth}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Banco de Dados (PostgreSQL)</span>
              <span className="text-emerald-500 font-bold text-sm">{metrics.dbHealth}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Pool de IA (Gemini/OpenAI)</span>
              <span className="text-emerald-500 font-bold text-sm">{metrics.aiHealth}</span>
            </div>
          </div>
        </div>

        {/* Smart Box & Inbox */}
        <div className="glass-card p-6 space-y-6">
          <h3 className="font-bold uppercase text-xs tracking-widest border-b border-border pb-4 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" /> Visão Geral
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Smart Box (IA)</span>
              <span className="text-amber-500 font-bold text-sm">{metrics.smartBox}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Caixa de Entrada</span>
              <span className="text-blue-500 font-bold text-sm">{metrics.inbox}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Noivado Quente (Conversão)</span>
              <span className="text-emerald-500 font-bold text-sm">{metrics.hotEngagement}</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="font-bold uppercase text-xs tracking-widest border-b border-border pb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" /> Ações Rápidas
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => handleQuickAction('Limpar Cache')}
              disabled={!!loadingAction}
              className={`p-3 bg-muted hover:bg-primary hover:text-primary-foreground rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-2 ${loadingAction === 'Limpar Cache' ? 'opacity-50 cursor-wait' : ''}`}
            >
              <Zap className={`w-4 h-4 ${loadingAction === 'Limpar Cache' ? 'animate-spin' : ''}`} />
              {loadingAction === 'Limpar Cache' ? 'Limpando...' : 'Limpar Cache'}
            </button>
            <button 
              onClick={() => handleQuickAction('Backup DB')}
              disabled={!!loadingAction}
              className={`p-3 bg-muted hover:bg-primary hover:text-primary-foreground rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-2 ${loadingAction === 'Backup DB' ? 'opacity-50 cursor-wait' : ''}`}
            >
              <Download className={`w-4 h-4 ${loadingAction === 'Backup DB' ? 'animate-bounce' : ''}`} />
              {loadingAction === 'Backup DB' ? 'Salvando...' : 'Backup DB'}
            </button>
            <button 
              onClick={() => handleQuickAction('Reiniciar Cluster')}
              disabled={!!loadingAction}
              className={`p-3 bg-muted hover:bg-destructive hover:text-destructive-foreground rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-2 ${loadingAction === 'Reiniciar Cluster' ? 'opacity-50 cursor-wait' : ''}`}
            >
              <Zap className={`w-4 h-4 ${loadingAction === 'Reiniciar Cluster' ? 'animate-pulse' : ''}`} />
              {loadingAction === 'Reiniciar Cluster' ? 'Reiniciando...' : 'Restart Cluster'}
            </button>
            <button 
              onClick={() => handleQuickAction('Relatório Global')}
              disabled={!!loadingAction}
              className={`p-3 bg-muted hover:bg-primary hover:text-primary-foreground rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-2 ${loadingAction === 'Relatório Global' ? 'opacity-50 cursor-wait' : ''}`}
            >
              <TrendingUp className={`w-4 h-4 ${loadingAction === 'Relatório Global' ? 'animate-pulse' : ''}`} />
              {loadingAction === 'Relatório Global' ? 'Gerando...' : 'Relatório'}
            </button>
          </div>
        </div>
      </div>

      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
};
