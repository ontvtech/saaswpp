import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, CheckCircle2, XCircle, Zap, MessageSquare, Store, MoreVertical } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Modal } from '../components/Modal';
import { Toast, ToastType } from '../components/Toast';

export const PlansPage: React.FC = () => {
  const [plans, setPlans] = useState<any[]>([]);
  const { token } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    type: 'MERCHANT', // MERCHANT or RESELLER
    maxTenants: 0,
    maxInstances: 1,
    maxMessages: 1000,
    description: '',
    modules: {
      attendance: true,
      sales: false,
      predictive: false,
      autoPilot: false
    }
  });

  useEffect(() => {
    fetchPlans();
  }, [token]);

  const fetchPlans = async () => {
    try {
      const res = await fetch('/api/admin/plans', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setPlans(data);
        } else {
          setPlans([
            { id: '1', name: 'Básico', price: 97.00, type: 'MERCHANT', instanceLimit: 1, maxMessages: 1000, description: 'Ideal para começar', modules: { attendance: true, sales: false, predictive: false, autoPilot: false } },
            { id: '2', name: 'Pro', price: 197.00, type: 'MERCHANT', instanceLimit: 3, maxMessages: 5000, description: 'Para negócios em crescimento', modules: { attendance: true, sales: true, predictive: false, autoPilot: false } },
            { id: '3', name: 'Elite AI', price: 297.00, type: 'MERCHANT', instanceLimit: 5, maxMessages: 10000, description: 'Automação total com Piloto Automático', modules: { attendance: true, sales: true, predictive: true, autoPilot: true } },
            { id: '4', name: 'Revenda Start', price: 497.00, type: 'RESELLER', maxTenants: 10, description: 'Comece sua própria SaaS' }
          ]);
        }
      } else {
        // Fallback data if API fails
        setPlans([
          { id: '1', name: 'Básico', price: 97.00, type: 'MERCHANT', instanceLimit: 1, maxMessages: 1000, description: 'Ideal para começar', modules: { attendance: true, sales: false, predictive: false, autoPilot: false } },
          { id: '2', name: 'Pro', price: 197.00, type: 'MERCHANT', instanceLimit: 3, maxMessages: 5000, description: 'Para negócios em crescimento', modules: { attendance: true, sales: true, predictive: false, autoPilot: false } },
          { id: '3', name: 'Elite AI', price: 297.00, type: 'MERCHANT', instanceLimit: 5, maxMessages: 10000, description: 'Automação total com Piloto Automático', modules: { attendance: true, sales: true, predictive: true, autoPilot: true } },
          { id: '4', name: 'Revenda Start', price: 497.00, type: 'RESELLER', maxTenants: 10, description: 'Comece sua própria SaaS' }
        ]);
      }
    } catch (e) {
      console.error(e);
      setPlans([
        { id: '1', name: 'Básico', price: 97.00, type: 'MERCHANT', instanceLimit: 1, maxMessages: 1000, description: 'Ideal para começar', modules: { attendance: true, sales: false, predictive: false, autoPilot: false } },
        { id: '2', name: 'Pro', price: 197.00, type: 'MERCHANT', instanceLimit: 3, maxMessages: 5000, description: 'Para negócios em crescimento', modules: { attendance: true, sales: true, predictive: false, autoPilot: false } },
        { id: '3', name: 'Elite AI', price: 297.00, type: 'MERCHANT', instanceLimit: 5, maxMessages: 10000, description: 'Automação total com Piloto Automático', modules: { attendance: true, sales: true, predictive: true, autoPilot: true } },
        { id: '4', name: 'Revenda Start', price: 497.00, type: 'RESELLER', maxTenants: 10, description: 'Comece sua própria SaaS' }
      ]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingPlan ? `/api/admin/plans/${editingPlan.id}` : '/api/admin/plans';
      const method = editingPlan ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          name: formData.name,
          price: Number(formData.price),
          description: formData.description,
          type: formData.type,
          maxTenants: formData.maxTenants,
          maxMessages: formData.maxMessages,
          modules: formData.modules,
          tokenLimit: formData.maxMessages * 10, // Rough estimate
          instanceLimit: formData.maxInstances,
        })
      });

      if (res.ok) {
        setToast({ message: `Plano ${editingPlan ? 'atualizado' : 'criado'} com sucesso!`, type: 'success' });
        fetchPlans();
        setIsModalOpen(false);
        setEditingPlan(null);
        setFormData({ name: '', price: '', type: 'MERCHANT', maxTenants: 0, maxInstances: 1, maxMessages: 1000, description: '', modules: { attendance: true, sales: false, predictive: false, autoPilot: false } });
      } else {
        throw new Error('API Error');
      }
    } catch (e) {
      setToast({ message: 'Erro ao salvar plano.', type: 'error' });
    }
  };

  const handleEdit = (plan: any) => {
    setEditingPlan(plan);
    setFormData({
      ...plan,
      maxInstances: plan.instanceLimit || 1,
      maxMessages: (plan.tokenLimit || 10000) / 10,
      modules: plan.modules || { attendance: true, sales: false, predictive: false, autoPilot: false }
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este plano?')) {
      try {
        const res = await fetch(`/api/admin/plans/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          setToast({ message: 'Plano excluído.', type: 'info' });
          fetchPlans();
        }
      } catch (e) {
        setToast({ message: 'Erro ao excluir plano.', type: 'error' });
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Planos & Preços</h2>
          <p className="text-muted-foreground">Gerencie os pacotes disponíveis para venda.</p>
        </div>
        <button 
          onClick={() => {
            setEditingPlan(null);
            setFormData({ name: '', price: '', type: 'MERCHANT', maxTenants: 0, maxInstances: 1, maxMessages: 1000, description: '', modules: { attendance: true, sales: false, predictive: false, autoPilot: false } });
            setIsModalOpen(true);
          }}
          className="bg-primary text-primary-foreground px-6 py-3 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> Novo Plano
        </button>
      </div>

      <div className="glass-card overflow-x-auto">
        <table className="w-full text-left min-w-[1000px]">
          <thead>
            <tr className="bg-muted/30 border-b border-border">
              <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Plano</th>
              <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Tipo</th>
              <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Preço</th>
              <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Recursos</th>
              <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Módulos</th>
              <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {plans.map(plan => (
              <tr key={plan.id} className="hover:bg-muted/20 transition-colors group">
                <td className="px-6 py-4">
                  <p className="font-bold text-sm">{plan.name}</p>
                  <p className="text-[10px] text-muted-foreground line-clamp-1 max-w-[200px]">{plan.description}</p>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg inline-block ${plan.type === 'RESELLER' ? 'bg-purple-500/10 text-purple-500' : 'bg-blue-500/10 text-blue-500'}`}>
                    {plan.type === 'RESELLER' ? 'Revenda' : 'Lojista'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <p className="font-black text-sm">R$ {Number(plan.price).toFixed(2)}</p>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    {plan.type === 'RESELLER' ? (
                      <p className="text-[10px] flex items-center gap-1"><Store className="w-3 h-3" /> {plan.maxTenants} Lojistas</p>
                    ) : (
                      <>
                        <p className="text-[10px] flex items-center gap-1"><Zap className="w-3 h-3" /> {plan.instanceLimit} Conexões</p>
                        <p className="text-[10px] flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {plan.maxMessages} Msg/mês</p>
                      </>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-1 flex-wrap max-w-[200px]">
                    {plan.modules?.attendance && <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-500 text-[9px] font-bold rounded uppercase">Atendimento</span>}
                    {plan.modules?.sales && <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-500 text-[9px] font-bold rounded uppercase">Vendas</span>}
                    {plan.modules?.predictive && <span className="px-1.5 py-0.5 bg-purple-500/10 text-purple-500 text-[9px] font-bold rounded uppercase">Preditivo</span>}
                    {plan.modules?.autoPilot && <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-500 text-[9px] font-bold rounded uppercase flex items-center gap-0.5"><Zap className="w-2 h-2" /> Auto</span>}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(plan)} className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-primary transition-colors" title="Editar">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(plan.id)} className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-destructive transition-colors" title="Excluir">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPlan ? "Editar Plano" : "Novo Plano"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nome do Plano</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full p-2 rounded-lg border border-border bg-background" 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Preço (R$)</label>
              <input 
                type="number" 
                value={formData.price}
                onChange={e => setFormData({...formData, price: e.target.value})}
                className="w-full p-2 rounded-lg border border-border bg-background" 
                required 
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tipo de Plano</label>
            <select 
              value={formData.type}
              onChange={e => setFormData({...formData, type: e.target.value})}
              className="w-full p-2 rounded-lg border border-border bg-background"
            >
              <option value="MERCHANT">Lojista (Cliente Final)</option>
              <option value="RESELLER">Revendedor (White Label)</option>
            </select>
          </div>

          {formData.type === 'RESELLER' ? (
            <div>
              <label className="block text-sm font-medium mb-1">Máximo de Lojistas</label>
              <input 
                type="number" 
                value={formData.maxTenants}
                onChange={e => setFormData({...formData, maxTenants: Number(e.target.value)})}
                className="w-full p-2 rounded-lg border border-border bg-background" 
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Conexões WhatsApp</label>
                <input 
                  type="number" 
                  value={formData.maxInstances}
                  onChange={e => setFormData({...formData, maxInstances: Number(e.target.value)})}
                  className="w-full p-2 rounded-lg border border-border bg-background" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Limite Disparos/Mês</label>
                <input 
                  type="number" 
                  value={formData.maxMessages}
                  onChange={e => setFormData({...formData, maxMessages: Number(e.target.value)})}
                  className="w-full p-2 rounded-lg border border-border bg-background" 
                />
              </div>
            </div>
          )}

          <div className="space-y-3 pt-4 border-t border-border">
            <h4 className="font-bold text-sm">Módulos de IA Permitidos</h4>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/20 cursor-pointer hover:bg-muted/50 transition-colors">
                <input 
                  type="checkbox" 
                  checked={formData.modules.attendance}
                  onChange={e => setFormData({...formData, modules: {...formData.modules, attendance: e.target.checked}})}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                />
                <div>
                  <p className="font-bold text-sm">Atendimento & Agenda (Core)</p>
                  <p className="text-xs text-muted-foreground">Respostas a dúvidas e triangulação de agenda.</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/20 cursor-pointer hover:bg-muted/50 transition-colors">
                <input 
                  type="checkbox" 
                  checked={formData.modules.sales}
                  onChange={e => setFormData({...formData, modules: {...formData.modules, sales: e.target.checked}})}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                />
                <div>
                  <p className="font-bold text-sm">Módulo de Vendas (Vendedor)</p>
                  <p className="text-xs text-muted-foreground">Links de pagamento, catálogo e indução ao fechamento.</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/20 cursor-pointer hover:bg-muted/50 transition-colors">
                <input 
                  type="checkbox" 
                  checked={formData.modules.predictive}
                  onChange={e => setFormData({...formData, modules: {...formData.modules, predictive: e.target.checked}})}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                />
                <div>
                  <p className="font-bold text-sm">Módulo Preditivo (Caçador)</p>
                  <p className="text-xs text-muted-foreground">Abordagem ativa de clientes frios e aniversariantes.</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/20 cursor-pointer hover:bg-muted/50 transition-colors">
                <input 
                  type="checkbox" 
                  checked={formData.modules.autoPilot}
                  onChange={e => setFormData({...formData, modules: {...formData.modules, autoPilot: e.target.checked}})}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                />
                <div>
                  <p className="font-bold text-sm flex items-center gap-2">
                    <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                    Piloto Automático (Auto-Pilot)
                  </p>
                  <p className="text-xs text-muted-foreground">IA identifica nicho e serviços automaticamente sem configuração.</p>
                </div>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Descrição Curta</label>
            <textarea 
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              className="w-full p-2 rounded-lg border border-border bg-background h-20" 
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg hover:bg-muted transition-colors">Cancelar</button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-bold hover:opacity-90 transition-opacity">
              {editingPlan ? 'Salvar Alterações' : 'Criar Plano'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
