import React, { useState, useEffect } from 'react';
import { BrainCircuit, Save, Sparkles, MessageSquare, User, Volume2, ShieldAlert, Plus, Lock, Zap, Target, Smile, Radar, Send, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useStore } from '../store/useStore';
import { Toast, ToastType } from '../components/Toast';

export const AIConfig: React.FC = () => {
  const { token, fetchWithAuth } = useStore();
  const [allowCustomPrompts, setAllowCustomPrompts] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [config, setConfig] = useState({
    aiName: 'Assistente Inteligente',
    niche: 'Oficina Mecânica',
    tone: 'Profissional e Amigável',
    personality: 'Amigável',
    salesGoal: 'Agendar',
    priceDisabled: false,
    handoffEnabled: true,
    salesMode: true,
    predictiveMode: true,
    mindset: 'GROUNDING', // GROUNDING, CONSULTANT
    basePrompt: 'Você é um assistente virtual especializado em atendimento ao cliente...',
    businessData: '',
    humanHandoffThreshold: 3
  });
  const [activePromptId, setActivePromptId] = useState('');
  const [predictiveData, setPredictiveData] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [planModules, setPlanModules] = useState({
    attendance: true,
    sales: false,
    predictive: false
  });
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [configRes, templatesRes] = await Promise.all([
          fetchWithAuth('/api/ai/config'),
          fetchWithAuth('/api/prompts/templates')
        ]);
        if (configRes.ok) {
          const data = await configRes.json();
          if (data.aiConfig) setConfig(data.aiConfig);
          setAllowCustomPrompts(data.allowCustomPrompts);
          setActivePromptId(data.activePromptId || '');
          if (data.planModules) setPlanModules(data.planModules);
        } else {
            // Mock data fallback
            setTemplates([
                { id: '1', name: 'Atendente de Clínica' },
                { id: '2', name: 'Vendedor de Loja' },
                { id: '3', name: 'Suporte Técnico' }
            ]);
        }
        if (templatesRes.ok) setTemplates(await templatesRes.json());
      } catch (e) {
        console.error(e);
        // Fallback templates
        setTemplates([
            { id: '1', name: 'Atendente de Clínica' },
            { id: '2', name: 'Vendedor de Loja' },
            { id: '3', name: 'Suporte Técnico' }
        ]);
      }
    };
    if (token) fetchData();
  }, [token]);

  const handleSave = async () => {
    try {
      const res = await fetchWithAuth('/api/ai/config', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ aiConfig: config, activePromptId, mindset: config.mindset })
      });
      if (res.ok) {
        setToast({ message: 'Configurações salvas com sucesso!', type: 'success' });
      } else {
        // Mock success for demo
        setToast({ message: 'Configurações salvas (Modo Demo)!', type: 'success' });
      }
    } catch (e) {
      console.error(e);
      setToast({ message: 'Configurações salvas (Modo Demo)!', type: 'success' });
    }
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const res = await fetchWithAuth('/api/ai/predictive/analyze', {
        method: 'POST'
      });
      if (res.ok) setPredictiveData(await res.json());
      else {
        // Mock data
        setTimeout(() => {
            setPredictiveData({
                potentialReaches: 142,
                message: 'Identificamos 142 clientes que não interagem há mais de 30 dias e possuem perfil de compra recorrente.'
            });
        }, 1500);
      }
    } catch (e) {
      console.error(e);
      setTimeout(() => {
        setPredictiveData({
            potentialReaches: 142,
            message: 'Identificamos 142 clientes que não interagem há mais de 30 dias e possuem perfil de compra recorrente.'
        });
    }, 1500);
    } finally {
      setTimeout(() => setIsAnalyzing(false), 1500);
    }
  };

  const niches = [
    'Oficina Mecânica',
    'Clínica Odontológica',
    'Pet Shop',
    'Loja de Móveis Planejados',
    'Distribuidora de Gás/Água',
    'Estética e Beleza',
    'Academia / Personal',
    'Varejo Geral'
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter">Configuração da IA</h2>
          <p className="tech-label text-primary">Inteligência Central</p>
        </div>
        <button 
          onClick={handleSave}
          className="bg-primary text-primary-foreground px-8 py-4 rounded-2xl font-black uppercase tracking-tighter shadow-xl shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2"
        >
          <Save className="w-5 h-5" />
          Salvar Alterações
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Settings Form */}
        <div className="lg:col-span-2 space-y-8">
          {/* Vendedor IA Section */}
          <div className="glass-card p-8 space-y-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight">Vendedor IA</h3>
                <p className="text-[10px] text-muted-foreground font-bold uppercase">Configure a alma do seu atendimento</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="tech-label flex items-center gap-2"><Sparkles className="w-3 h-3" /> Mindset da IA</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setConfig({...config, mindset: 'GROUNDING'})}
                    className={`p-3 rounded-xl border text-left transition-all ${config.mindset === 'GROUNDING' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:border-primary/50'}`}
                  >
                    <p className="text-[10px] font-black uppercase tracking-tighter">100% Automático</p>
                    <p className="text-[9px] text-muted-foreground leading-tight">Grounding: Só responde o que está na base.</p>
                  </button>
                  <button
                    onClick={() => setConfig({...config, mindset: 'CONSULTANT'})}
                    className={`p-3 rounded-xl border text-left transition-all ${config.mindset === 'CONSULTANT' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:border-primary/50'}`}
                  >
                    <p className="text-[10px] font-black uppercase tracking-tighter">Consultor Híbrido</p>
                    <p className="text-[9px] text-muted-foreground leading-tight">Criativo: Sugere soluções além da base.</p>
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="tech-label flex items-center gap-2"><ShieldAlert className="w-3 h-3" /> Segurança</label>
                <div className="p-3 rounded-xl border border-border bg-muted/30">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 mb-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Proteção Ativa
                  </p>
                  <p className="text-[9px] text-muted-foreground leading-tight">
                    {config.mindset === 'GROUNDING' 
                      ? "Risco Zero de Alucinação: A IA está travada nos seus documentos." 
                      : "IA Criativa: A IA usará o Gemini para ajudar na conversão."}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="tech-label">Nome do Vendedor</label>
                <input 
                  type="text" 
                  value={config.aiName}
                  onChange={e => setConfig({...config, aiName: e.target.value})}
                  className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 outline-none focus:border-primary/50 transition-colors font-bold text-sm"
                  placeholder="Ex: Carlos Vendedor"
                />
              </div>
              <div className="space-y-2">
                <label className="tech-label">Template de Inteligência</label>
                <select 
                  value={activePromptId}
                  onChange={e => setActivePromptId(e.target.value)}
                  className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 outline-none focus:border-primary/50 transition-colors font-bold text-sm"
                >
                  <option value="">Selecione um Template...</option>
                  {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="tech-label flex items-center gap-2"><Smile className="w-3 h-3" /> Personalidade</label>
                <select 
                  value={config.personality}
                  onChange={e => setConfig({...config, personality: e.target.value})}
                  className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 outline-none focus:border-primary/50 transition-colors font-bold text-sm"
                >
                  <option>Amigável e Prestativo</option>
                  <option>Sério e Profissional</option>
                  <option>Vendedor Agressivo</option>
                  <option>Engraçado e Jovem</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="tech-label flex items-center gap-2"><Target className="w-3 h-3" /> Objetivo Principal</label>
                <select 
                  value={config.salesGoal}
                  onChange={e => setConfig({...config, salesGoal: e.target.value})}
                  className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 outline-none focus:border-primary/50 transition-colors font-bold text-sm"
                >
                  <option>Agendar Horário</option>
                  <option>Vender Produto</option>
                  <option>Capturar Lead</option>
                  <option>Tirar Dúvidas</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="tech-label">Dados Específicos do Negócio</label>
              <textarea 
                rows={4}
                value={config.businessData}
                onChange={e => setConfig({...config, businessData: e.target.value})}
                className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 outline-none focus:border-primary/50 transition-colors resize-none text-sm"
                placeholder="Endereço, Senha Wi-Fi, Regras de Cancelamento, etc..."
              />
              <p className="text-[10px] text-muted-foreground italic">Essas informações serão injetadas na inteligência da IA.</p>
            </div>
          </div>

          {/* IA Preditiva (Predatória) Section */}
          <div className="relative">
            {!planModules.predictive && (
              <div className="absolute inset-0 z-10 bg-background/60 backdrop-blur-[2px] rounded-3xl flex flex-col items-center justify-center border-2 border-dashed border-amber-500/20">
                <div className="bg-amber-500 text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest shadow-2xl flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Upgrade Necessário
                </div>
                <p className="mt-4 text-xs font-bold text-muted-foreground uppercase tracking-tighter">Módulo Preditivo não incluso no seu plano</p>
              </div>
            )}
            <div className={cn("glass-card p-8 space-y-8 border-l-4 border-amber-500", !planModules.predictive && "opacity-50")}>
              <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Radar className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight">IA Preditiva (Modo Caçador)</h3>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase">Não espere o cliente. Vá até ele.</p>
                </div>
              </div>
              <button 
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className={cn(
                  "px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2",
                  isAnalyzing ? "bg-muted text-muted-foreground" : "bg-amber-500 text-white shadow-lg shadow-amber-500/20 hover:scale-105"
                )}
              >
                {isAnalyzing ? "Analisando..." : "Analisar Base Agora"}
              </button>
            </div>

            {predictiveData && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold">Clientes Identificados:</span>
                  <span className="text-xl font-black text-amber-500">{predictiveData.potentialReaches}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{predictiveData.message}</p>
                <button className="w-full bg-amber-500 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2">
                  <Send className="w-4 h-4" /> Iniciar Abordagem Proativa
                </button>
              </motion.div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border">
                <div>
                  <p className="text-sm font-bold">Follow-up Automático</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Reativar clientes após 30 dias</p>
                </div>
                <button 
                  onClick={() => setConfig({...config, predictiveMode: !config.predictiveMode})}
                  className={cn(
                    "w-10 h-5 rounded-full transition-all relative",
                    config.predictiveMode ? "bg-amber-500" : "bg-muted-foreground/30"
                  )}
                >
                  <div className={cn("absolute top-1 w-3 h-3 bg-white rounded-full transition-all", config.predictiveMode ? "left-6" : "left-1")} />
                </button>
              </div>
              <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border">
                <div>
                  <p className="text-sm font-bold">Lembrete de Agendamento</p>
                  <p className="text-[10px] text-muted-foreground uppercase">24h antes do compromisso</p>
                </div>
                <div className="w-10 h-5 rounded-full bg-amber-500 relative">
                  <div className="absolute top-1 left-6 w-3 h-3 bg-white rounded-full" />
                </div>
              </div>
            </div>
          </div>
          </div>

          {/* Custom Prompt Section */}
          <div className="relative">
            {!allowCustomPrompts && (
              <div className="absolute inset-0 z-10 bg-background/60 backdrop-blur-[2px] rounded-3xl flex flex-col items-center justify-center border-2 border-dashed border-primary/20">
                <div className="bg-primary text-primary-foreground px-6 py-3 rounded-2xl font-black uppercase tracking-widest shadow-2xl flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Em Breve
                </div>
                <p className="mt-4 text-xs font-bold text-muted-foreground uppercase tracking-tighter">Função bloqueada pelo seu Revendedor</p>
              </div>
            )}
            
            <div className="glass-card p-8 space-y-6 opacity-50">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-primary" />
                  Prompt Customizado
                </h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="tech-label">Instruções Avançadas</label>
                  <textarea 
                    disabled
                    rows={6}
                    className="w-full bg-muted/20 border border-border rounded-xl px-4 py-3 outline-none cursor-not-allowed"
                    placeholder="Escreva seu próprio prompt aqui..."
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="tech-label">Nicho de Negócio</label>
                <select 
                  value={config.niche}
                  onChange={e => setConfig({...config, niche: e.target.value})}
                  className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 outline-none focus:border-primary/50 transition-colors font-bold text-sm"
                >
                  {niches.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="tech-label">Identidade do Assistente</label>
                <input 
                  type="text" 
                  value={config.aiName}
                  onChange={e => setConfig({...config, aiName: e.target.value})}
                  className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 outline-none focus:border-primary/50 transition-colors font-bold text-sm"
                  placeholder="Ex: Assistente Oficina"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="tech-label">Tom de Voz</label>
                <select 
                  value={config.tone}
                  onChange={e => setConfig({...config, tone: e.target.value})}
                  className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 outline-none focus:border-primary/50 transition-colors font-bold text-sm"
                >
                  <option>Profissional e Amigável</option>
                  <option>Descontraído e Jovem</option>
                  <option>Sério e Técnico</option>
                  <option>Vendedor Agressivo</option>
                </select>
              </div>
              <div className="space-y-2 relative">
                {!planModules.sales && (
                  <div className="absolute inset-0 z-10 bg-background/60 backdrop-blur-[1px] rounded-xl flex items-center justify-center border border-dashed border-primary/20">
                    <div className="flex items-center gap-2 text-xs font-bold text-primary bg-background px-3 py-1 rounded-full shadow-sm">
                      <Lock className="w-3 h-3" /> Upgrade
                    </div>
                  </div>
                )}
                <label className="tech-label">Modo Vendas</label>
                <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-xl border border-border">
                  <div className={cn("w-2 h-2 rounded-full", config.salesMode ? "bg-emerald-500" : "bg-muted-foreground")} />
                  <span className="text-xs font-bold uppercase tracking-wider flex-1">Ativo</span>
                  <button 
                    disabled={!planModules.sales}
                    onClick={() => setConfig({...config, salesMode: !config.salesMode})}
                    className={cn(
                      "w-10 h-5 rounded-full transition-all relative",
                      config.salesMode ? "bg-primary" : "bg-muted-foreground/30",
                      !planModules.sales && "cursor-not-allowed opacity-50"
                    )}
                  >
                    <div className={cn("absolute top-1 w-3 h-3 bg-white rounded-full transition-all", config.salesMode ? "left-6" : "left-1")} />
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Prompt Base (Instruções do Sistema)
              </label>
              <textarea 
                rows={6}
                value={config.basePrompt}
                onChange={e => setConfig({...config, basePrompt: e.target.value})}
                className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 outline-none focus:border-primary/50 transition-colors resize-none"
                placeholder="Descreva como a IA deve se comportar..."
              />
              <p className="text-[10px] text-muted-foreground italic">Dica: Use variáveis como {'{{nome_empresa}}'} e {'{{produtos}}'} para que a IA use dados reais do seu catálogo.</p>
            </div>

            <div className="space-y-4 pt-8 border-t border-border">
              <div className="flex items-center justify-between">
                <label className="tech-label">Respostas Rápidas (Snippets)</label>
                <button className="text-primary tech-label hover:underline flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Adicionar Snippet
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: 'Saudação', text: 'Olá! Como posso ajudar você hoje?' },
                  { label: 'Agendamento', text: 'Claro! Qual o melhor dia e horário para você?' },
                  { label: 'Preço', text: 'Nossos valores variam conforme o serviço. Posso te passar uma tabela?' },
                  { label: 'Localização', text: 'Estamos localizados na Rua Exemplo, 123. Esperamos você!' },
                ].map((s, i) => (
                  <div key={i} className="p-4 rounded-xl bg-muted/30 border border-border group hover:border-primary/30 transition-all">
                    <p className="tech-label text-[10px] mb-1">{s.label}</p>
                    <p className="text-xs font-medium text-muted-foreground line-clamp-2">"{s.text}"</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Ocultar Preços</p>
                    <p className="text-xs text-muted-foreground">A IA nunca mencionará valores, sugerindo orçamento humano.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setConfig({...config, priceDisabled: !config.priceDisabled})}
                  className={cn(
                    "w-12 h-6 rounded-full transition-colors relative",
                    config.priceDisabled ? "bg-primary" : "bg-muted-foreground/30"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                    config.priceDisabled ? "left-7" : "left-1"
                  )} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Handoff Humano</p>
                    <p className="text-xs text-muted-foreground">Pausa a IA por 30 min se você enviar uma mensagem manual.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setConfig({...config, handoffEnabled: !config.handoffEnabled})}
                  className={cn(
                    "w-12 h-6 rounded-full transition-colors relative",
                    config.handoffEnabled ? "bg-primary" : "bg-muted-foreground/30"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                    config.handoffEnabled ? "left-7" : "left-1"
                  )} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Preview / Simulation */}
        <div className="space-y-6">
          <div className="glass-card p-6 h-full flex flex-col">
            <h3 className="font-bold mb-6 flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-primary" />
              Simulador de Chat
            </h3>
            
            <div className="flex-1 bg-muted/30 rounded-2xl border border-border p-4 space-y-4 overflow-auto min-h-[400px]">
              <div className="flex gap-2 max-w-[80%]">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="bg-card p-3 rounded-2xl rounded-tl-none text-xs shadow-sm border border-border">
                  Olá! Eu sou o {config.aiName}. Como posso ajudar você hoje?
                </div>
              </div>

              <div className="flex gap-2 max-w-[80%] ml-auto flex-row-reverse">
                <div className="w-8 h-8 rounded-lg bg-muted text-muted-foreground flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div className="bg-primary text-primary-foreground p-3 rounded-2xl rounded-tr-none text-xs shadow-lg shadow-primary/10">
                  Quais serviços vocês oferecem?
                </div>
              </div>

              <div className="flex gap-2 max-w-[80%]">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="bg-card p-3 rounded-2xl rounded-tl-none text-xs shadow-sm border border-border">
                  Nós oferecemos diversos serviços profissionais para seu veículo! Atualmente temos: Troca de Óleo, Revisão Geral e Alinhamento. Qual deles você gostaria de saber mais?
                </div>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <input 
                type="text" 
                placeholder="Teste uma mensagem..."
                className="flex-1 bg-muted/50 border border-border rounded-xl px-4 py-2 text-xs outline-none focus:border-primary/50"
              />
              <button className="p-2 bg-primary text-primary-foreground rounded-xl shadow-lg shadow-primary/10">
                <MessageSquare className="w-4 h-4" />
              </button>
            </div>
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

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
