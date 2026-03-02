import React, { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  MessageSquare, 
  Settings, 
  BrainCircuit, 
  LogOut, 
  Sun, 
  Moon,
  ShieldCheck,
  Store,
  Package,
  Bell,
  Send,
  DollarSign,
  Server,
  Shield,
  ShieldAlert,
  BarChart3,
  UserCircle,
  UserPlus,
  Cpu,
  Database,
  FileText,
  Eye,
  Headphones,
  CreditCard,
  Key,
  Activity,
  Terminal,
  Link as LinkIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { theme, toggleTheme, user, logout, impersonatedMerchantId, impersonatedResellerId, setImpersonation } = useStore();
  const location = useLocation();

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const menuItems = [
    // Dashboard
    { path: '/', icon: LayoutDashboard, label: 'Dashboard', roles: ['ADMIN', 'RESELLER', 'MERCHANT'] },

    // 👑 ADMIN
    // INFRAESTRUTURA
    { path: '/admin/infrastructure/whatsapp', icon: MessageSquare, label: 'Monitor WhatsApp', roles: ['ADMIN'], group: 'INFRAESTRUTURA' },
    { path: '/admin/infrastructure/servers', icon: Server, label: 'Servidores e Rede', roles: ['ADMIN'], group: 'INFRAESTRUTURA' },
    { path: '/admin/infrastructure/logs', icon: Terminal, label: 'Logs do Sistema', roles: ['ADMIN'], group: 'INFRAESTRUTURA' },
    { path: '/admin/infrastructure/status', icon: Activity, label: 'Status dos Serviços', roles: ['ADMIN'], group: 'INFRAESTRUTURA' },
    { path: '/admin/infrastructure/ai-keys', icon: Key, label: 'Chaves de IA (Pool)', roles: ['ADMIN'], group: 'INFRAESTRUTURA' },

    // REVENDEDORES
    { path: '/admin/resellers/list', icon: Users, label: 'Lista de Revendedores', roles: ['ADMIN'], group: 'REVENDEDORES' },
    { path: '/admin/resellers/new', icon: UserPlus, label: 'Novo Revendedor', roles: ['ADMIN'], group: 'REVENDEDORES' },
    { path: '/admin/resellers/plans', icon: ShieldCheck, label: 'Planos e Preços', roles: ['ADMIN'], group: 'REVENDEDORES' },
    { path: '/admin/resellers/financials', icon: DollarSign, label: 'Relatórios Financeiros', roles: ['ADMIN'], group: 'REVENDEDORES' },

    // IA GLOBAL
    { path: '/admin/ai/plans-niches', icon: ShieldCheck, label: 'Planos e Nichos', roles: ['ADMIN'], group: 'IA GLOBAL' },
    { path: '/admin/ai/trial-links', icon: LinkIcon, label: 'Links de Teste', roles: ['ADMIN'], group: 'IA GLOBAL' },
    { path: '/admin/ai/prompts', icon: MessageSquare, label: 'Prompts por Nicho', roles: ['ADMIN'], group: 'IA GLOBAL' },
    { path: '/admin/ai/sales', icon: DollarSign, label: 'IA Vendas (Padrão)', roles: ['ADMIN'], group: 'IA GLOBAL' },
    { path: '/admin/ai/predictive', icon: BrainCircuit, label: 'IA Preditiva (Padrão)', roles: ['ADMIN'], group: 'IA GLOBAL' },
    { path: '/admin/ai/models', icon: Cpu, label: 'Modelos e Limites', roles: ['ADMIN'], group: 'IA GLOBAL' },
    { path: '/admin/ai/knowledge-base', icon: Database, label: 'Base de Conhecimento Auto', roles: ['ADMIN'], group: 'IA GLOBAL' },

    // SEGURANÇA
    { path: '/admin/security/firewall', icon: Shield, label: 'Proteção e Firewall', roles: ['ADMIN'], group: 'SEGURANÇA' },
    { path: '/admin/security/logs', icon: FileText, label: 'Logs de Acesso', roles: ['ADMIN'], group: 'SEGURANÇA' },
    { path: '/admin/security/audit', icon: Eye, label: 'Auditoria', roles: ['ADMIN'], group: 'SEGURANÇA' },

    // COMUNICAÇÃO
    { path: '/admin/communication/broadcast', icon: Send, label: 'Avisos em Massa', roles: ['ADMIN'], group: 'COMUNICAÇÃO' },
    { path: '/admin/communication/support', icon: Headphones, label: 'Suporte (Tickets)', roles: ['ADMIN'], group: 'COMUNICAÇÃO' },

    // CONFIGURAÇÕES GERAIS
    { path: '/admin/settings/system', icon: Settings, label: 'Sistema', roles: ['ADMIN'], group: 'CONFIGURAÇÕES' },
    { path: '/admin/settings/payment', icon: CreditCard, label: 'Gateways de Pagamento', roles: ['ADMIN'], group: 'CONFIGURAÇÕES' },

    // ... (Merchant and Reseller items would go here, but focusing on Admin for now as requested)
    // Merchant
    { path: '/whatsapp', icon: MessageSquare, label: 'Conexão WhatsApp', roles: ['MERCHANT'] },
    { path: '/ai-config', icon: BrainCircuit, label: 'Configuração da IA', roles: ['MERCHANT'] },
    { path: '/catalog', icon: Package, label: 'Catálogo de Produtos', roles: ['MERCHANT'] },
    { path: '/appointments', icon: Calendar, label: 'Agenda Inteligente', roles: ['MERCHANT'] },
    { path: '/knowledge-base', icon: Settings, label: 'Base de Conhecimento', roles: ['MERCHANT'] },
    { path: '/crm-predictive', icon: Users, label: 'CRM & Preditivo', roles: ['MERCHANT'] },
    { path: '/crisis-management', icon: ShieldAlert, label: 'Gestão de Crises', roles: ['MERCHANT'] },
    { path: '/reports', icon: BarChart3, label: 'Relatórios', roles: ['MERCHANT'] },
    { path: '/my-plan', icon: DollarSign, label: 'Meu Plano', roles: ['MERCHANT'] },
    { path: '/team-profile', icon: UserCircle, label: 'Perfil e Equipe', roles: ['MERCHANT'] },

    // Reseller
    { path: '/reseller/tenants', icon: Store, label: 'Gestão de Lojistas', roles: ['RESELLER'] },
    { path: '/reseller/ai-templates', icon: BrainCircuit, label: 'Templates de IA', roles: ['RESELLER'] },
    { path: '/reseller/whatsapp-monitor', icon: MessageSquare, label: 'Monitor WhatsApp', roles: ['RESELLER'] },
    { path: '/reseller/broadcast', icon: Send, label: 'Comunicação', roles: ['RESELLER'] },
    { path: '/reseller/settings', icon: Settings, label: 'Configurações da Conta', roles: ['RESELLER'] },
  ];

  const effectiveRole = impersonatedMerchantId ? 'MERCHANT' : (impersonatedResellerId ? 'RESELLER' : user?.role);
  const filteredMenu = menuItems.filter(item => item.roles.includes(effectiveRole || ''));

  // Group items
  const groupedMenu: { [key: string]: typeof menuItems } = {};
  filteredMenu.forEach(item => {
    const group = item.group || 'GERAL';
    if (!groupedMenu[group]) groupedMenu[group] = [];
    groupedMenu[group].push(item);
  });

  const isSuspended = user?.status === 'suspended';

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card/80 backdrop-blur-2xl flex flex-col fixed h-full z-50">
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter uppercase">SaaSWpp</h1>
            <p className="text-[8px] font-mono font-bold tracking-[0.2em] text-muted-foreground uppercase">Empresarial v2.0</p>
          </div>
        </div>

        {isSuspended && (
          <div className="mx-4 mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-xl">
            <p className="text-[10px] font-bold text-destructive uppercase tracking-widest flex items-center gap-2">
              <ShieldAlert className="w-3 h-3" /> Conta Suspensa
            </p>
            <p className="text-[9px] text-muted-foreground mt-1">Regularize seu financeiro para liberar o acesso.</p>
          </div>
        )}

        <nav className="flex-1 px-4 py-4 space-y-6 overflow-y-auto custom-scrollbar">
          {Object.entries(groupedMenu).map(([group, items]) => (
            <div key={group} className="space-y-1">
              {group !== 'GERAL' && (
                <h3 className="px-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">{group}</h3>
              )}
              {items.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group relative",
                      isActive 
                        ? "emerald-active shadow-sm" 
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                  >
                    <item.icon className={cn("w-4 h-4 transition-transform group-hover:scale-110 shrink-0", isActive && "text-primary")} />
                    <span className="text-xs font-bold tracking-tight truncate">{item.label}</span>
                    {isActive && (
                      <motion.div 
                        layoutId="active-pill"
                        className="absolute left-0 w-1 h-4 bg-primary rounded-r-full"
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="p-6 mt-auto border-t border-border bg-muted/20 shrink-0">
          <div className="flex items-center gap-3 mb-6 p-3 rounded-xl bg-background/50 border border-border">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider truncate">Plano Pro</p>
              <div className="w-full h-1 bg-muted rounded-full mt-1 overflow-hidden">
                <div className="w-3/4 h-full bg-primary" />
              </div>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all group"
          >
            <LogOut className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
            <span className="text-sm font-semibold">Encerrar Sessão</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 flex flex-col min-h-screen">
        {(impersonatedMerchantId || impersonatedResellerId) && (
          <div className="bg-amber-500 text-white px-10 py-2 flex items-center justify-between sticky top-0 z-[60] shadow-lg">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
              <span className="text-sm font-bold uppercase tracking-widest">
                Modo de Visualização Ativo: {impersonatedMerchantId ? 'Lojista' : 'Revendedor'} ({impersonatedMerchantId || impersonatedResellerId})
              </span>
            </div>
            <button 
              onClick={() => {
                setImpersonation(null, null);
                window.location.href = '/';
              }}
              className="bg-white text-amber-500 px-4 py-1 rounded-lg text-xs font-black uppercase hover:bg-amber-50 transition-colors"
            >
              Sair da Visualização
            </button>
          </div>
        )}
        {/* Header */}
        <header className="h-20 border-b border-border bg-background/60 backdrop-blur-xl sticky top-0 z-40 px-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-8 w-1 bg-primary/20 rounded-full" />
            <div className="flex flex-col">
              <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                {menuItems.find(i => i.path === location.pathname)?.label || 'Dashboard'}
              </h2>
              <p className="text-xs font-medium">Sessão ativa: <span className="text-primary">{user?.name}</span></p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-border hover:bg-muted transition-colors"
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
            
            <div className="h-8 w-px bg-border mx-2" />

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold">{user?.name}</p>
                <p className="text-[10px] uppercase tracking-wider text-primary font-bold">{user?.role}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center border border-border overflow-hidden">
                <img 
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} 
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </header>

        <div className="p-8 flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};
