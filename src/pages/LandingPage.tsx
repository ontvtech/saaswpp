import React from 'react';
import { motion } from 'motion/react';
import { MessageSquare, ShieldCheck, Zap, BrainCircuit, ArrowRight, CheckCircle2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LandingPageProps {
  onLogin: (view?: 'login' | 'trial') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  return (
    <div className="min-h-screen bg-background selection:bg-primary/30">
      {/* Nav */}
      <nav className="h-20 border-b border-border/50 flex items-center justify-between px-8 md:px-20 sticky top-0 bg-background/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
            <MessageSquare className="w-6 h-6" />
          </div>
          <span className="text-xl font-bold tracking-tight">SaaSWpp</span>
        </div>
        
        <div className="flex items-center gap-6">
          <button onClick={() => onLogin('login')} className="text-sm font-medium hover:text-primary transition-colors">Entrar</button>
          <button onClick={() => onLogin('trial')} className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
            Começar Agora
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-40 pb-32 px-8 md:px-20 max-w-7xl mx-auto text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full opacity-5 pointer-events-none">
          <BrainCircuit className="w-full h-full" />
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10"
        >
          <span className="tech-label text-primary mb-8 inline-block px-4 py-2 bg-primary/5 border border-primary/10 rounded-full">
            Automação de WhatsApp de Próxima Geração
          </span>
          <h1 className="text-[12vw] md:text-[8vw] font-black tracking-tighter leading-[0.85] uppercase mb-12">
            Crescimento de <br />
            <span className="text-primary">Receita</span> <br />
            Guiado por IA
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto mb-12 font-medium leading-relaxed">
            Transforme seu WhatsApp em uma máquina de vendas de alta performance. IA Preditiva para clínicas e centros automotivos.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <button onClick={() => onLogin('trial')} className="w-full sm:w-auto bg-primary text-primary-foreground px-10 py-5 rounded-2xl text-lg font-black uppercase tracking-tighter shadow-2xl shadow-primary/20 hover:scale-105 transition-all flex items-center justify-center gap-3">
              Começar Teste Grátis <ArrowRight className="w-6 h-6" />
            </button>
            <button onClick={() => onLogin('login')} className="w-full sm:w-auto px-10 py-5 rounded-2xl text-lg font-black uppercase tracking-tighter border-2 border-border hover:bg-muted transition-all">
              Demo ao Vivo
            </button>
          </div>
        </motion.div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-border bg-muted/20 py-12">
        <div className="max-w-7xl mx-auto px-8 md:px-20 grid grid-cols-2 md:grid-cols-4 gap-12">
          {[
            { label: "Lojistas Ativos", val: "1.2k+" },
            { label: "Mensagens Enviadas", val: "45M+" },
            { label: "Precisão da IA", val: "99.4%" },
            { label: "Aumento de Receita", val: "32%" },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <p className="text-3xl font-black tracking-tighter uppercase mb-1">{s.val}</p>
              <p className="tech-label">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-32 px-8 md:px-20 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {[
            { 
              icon: BrainCircuit, 
              title: "Núcleo Preditivo", 
              desc: "Análise profunda de padrões de clientes para disparar abordagens no momento perfeito." 
            },
            { 
              icon: Zap, 
              title: "Stack Evolution", 
              desc: "Infraestrutura de WhatsApp de nível empresarial para 100% de entrega de mensagens." 
            },
            { 
              icon: ShieldCheck, 
              title: "Segurança de Cofre", 
              desc: "Criptografia de nível bancário e isolamento total de dados para cada negócio." 
            }
          ].map((f, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-10 hover:border-primary/50 transition-all group"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/5 text-primary flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-500">
                <f.icon className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tighter mb-4">{f.title}</h3>
              <p className="text-muted-foreground leading-relaxed font-medium">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-8 md:px-20 bg-muted/30">
        <div className="max-w-7xl mx-auto text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Planos Simples e Transparentes</h2>
          <p className="text-muted-foreground">Escolha o plano ideal para o tamanho do seu negócio.</p>
        </div>

        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { name: "Trial", price: "Grátis", features: ["7 dias de teste", "50 mensagens IA", "1 instância WhatsApp", "Suporte básico"], active: false },
            { name: "Basic", price: "R$ 147", features: ["Mensagens ilimitadas", "1 instância WhatsApp", "IA Preditiva básica", "Suporte via e-mail"], active: true },
            { name: "Pro", price: "R$ 297", features: ["Tudo do Basic", "3 instâncias WhatsApp", "IA Preditiva avançada", "Suporte prioritário", "API de integração"], active: false },
          ].map((p, i) => (
            <div key={i} className={cn(
              "glass-card p-8 flex flex-col relative overflow-hidden",
              p.active && "border-primary shadow-2xl shadow-primary/10 scale-105 z-10"
            )}>
              {p.active && <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-4 py-1 text-[10px] font-bold uppercase tracking-widest rounded-bl-xl">Mais Popular</div>}
              <h3 className="text-xl font-bold mb-2">{p.name}</h3>
              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-4xl font-black">{p.price}</span>
                {p.price !== "Grátis" && <span className="text-muted-foreground">/mês</span>}
              </div>
              <ul className="space-y-4 mb-10 flex-1">
                {p.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>
              <button onClick={() => onLogin(p.name === 'Trial' ? 'trial' : 'login')} className={cn(
                "w-full py-4 rounded-xl font-bold transition-all",
                p.active ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-muted hover:bg-muted/80"
              )}>
                Selecionar Plano
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border px-8 md:px-20">
        <div className="max-w-7xl mx-auto flex flex-col md:row items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
              <MessageSquare className="w-5 h-5" />
            </div>
            <span className="font-bold">SaaSWpp</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2024 SaaSWpp. Todos os direitos reservados.</p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">Termos</a>
            <a href="#" className="hover:text-primary transition-colors">Privacidade</a>
            <a href="#" className="hover:text-primary transition-colors">Contato</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
