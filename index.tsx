import React, { useState, FC, SVGProps, createContext, useContext, ReactNode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import { User, Session, AuthResponsePassword, OAuthResponse } from '@supabase/auth-js';
import './index.css';

// --- INICIALIZAÇÃO DO SUPABASE ---
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Anon Key:', supabaseAnonKey ? 'Carregada' : 'NÃO CARREGADA');

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("As variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY precisam ser definidas no arquivo .env");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- TYPES AND INTERFACES ---
type ContactType = 'empresa' | 'cliente';
type Page = 'dashboard' | 'contatos' | 'financeiro' | 'relatorios';
type ModalType = 'addContact' | 'editContact' | 'addTransaction' | 'editTransaction' | 'welcome';

interface RecurringCharge {
  isActive: boolean;
  amount: number;
  launchDay: number; // 1-31
  dueDay: number; // 1-31
}

interface Contact {
  id: string;
  name: string;
  type: ContactType;
  email?: string;
  recurringCharge?: RecurringCharge;
}

interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string; // Launch date
  dueDate: string; // Due date
  type: 'income' | 'expense';
  contactId?: string;
  isRecurring?: boolean;
  isPaid: boolean;
  paidDate: string | null;
}

type ModalState = {
  type: ModalType;
  data?: Contact | Transaction;
} | null;

type ItemToDelete = { id: string; type: 'contact' | 'transaction' } | null;

type ColumnVisibility = Record<string, boolean>;

// --- AUTHENTICATION ---
interface AuthContextType {
  user: User | null;
  session: Session | null;
  login: (email, password) => Promise<AuthResponsePassword>;
  loginWithGoogle: () => Promise<OAuthResponse>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    return supabase.auth.signInWithPassword({ email, password });
  };

  const loginWithGoogle = async () => {
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };
  
  if (loading) {
      return null; // Or a loading spinner
  }

  return <AuthContext.Provider value={{ user, session, login, loginWithGoogle, logout }}>{children}</AuthContext.Provider>;
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// --- UI COMPONENTS ---

const LoginScreen: FC = () => {
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
    
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const { error } = await login(email, password);
    if (error) {
      setError(error.message);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    const { error } = await loginWithGoogle();
    if (error) {
      setError(error.message);
    }
  }

    return (
        <div className="login-container">
            <div className="login-box">
                <div className="logo-container">
                    <div className="logo">F</div>
                    <h1>Finanças</h1>
                </div>
                <h2>Acesse sua conta</h2>
                {error && <p className="error-message">{error}</p>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input type="email" id="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Senha</label>
                        <input type="password" id="password" placeholder="********" value={password} onChange={e => setPassword(e.target.value)} required />
                    </div>
                    <div className="form-group-checkbox">
                        <input type="checkbox" id="rememberMe" />
                        <label htmlFor="rememberMe">Lembrar usuário</label>
                    </div>
                    <button type="submit" className="login-button">Entrar</button>
                </form>
                <div className="divider">
                    <span>ou</span>
                </div>
                <button onClick={handleGoogleLogin} className="google-login-button">
                    <GoogleIcon />
                    Entrar com Google
                </button>
            </div>
        </div>
    );
};

const navItemsList: { page: Page; label: string; icon: JSX.Element }[] = [
  { page: 'dashboard', label: 'Dashboard', icon: <HomeIcon /> },
  { page: 'contatos', label: 'Contatos', icon: <UsersIcon /> },
  { page: 'financeiro', label: 'Financeiro', icon: <ArrowUpDownIcon /> },
  { page: 'relatorios', label: 'Relatórios', icon: <ChartIcon /> },
];

const Sidebar: FC<{ currentPage: Page; setCurrentPage: (page: Page) => void }> = ({ currentPage, setCurrentPage }) => {
  const { logout } = useAuth();
  return (
    <aside className="sidebar">
        <div>
            <div className="sidebar-header">
                <div className="logo">F</div>
                <h1>Finanças</h1>
            </div>
            <nav aria-label="Navegação Principal">
                <ul>
                {navItemsList.map((item) => (
                    <li key={item.page}>
                      <a href="#" className={currentPage === item.page ? 'active' : ''} onClick={(e) => { e.preventDefault(); setCurrentPage(item.page); }} aria-current={currentPage === item.page ? 'page' : undefined} title={item.label}>
                          {item.icon}
                          <span>{item.label}</span>
                      </a>
                    </li>
                ))}
                </ul>
            </nav>
        </div>
        <button onClick={logout} className="logout-button">
            <LogOutIcon />
            <span>Sair</span>
        </button>
    </aside>
  );
};

const BottomNav: FC<{ currentPage: Page; setCurrentPage: (page: Page) => void }> = ({ currentPage, setCurrentPage }) => (
    <nav className="bottom-nav" aria-label="Navegação Móvel">
        <ul>
            {navItemsList.map(item => (
                <li key={item.page}>
                    <a href="#" className={currentPage === item.page ? 'active' : ''} onClick={(e) => { e.preventDefault(); setCurrentPage(item.page); }} aria-current={currentPage === item.page ? 'page' : undefined} title={item.label}>
                      {item.icon}
                      <span>{item.label}</span>
                    </a>
                </li>
            ))}
        </ul>
    </nav>
);

const Header: FC<{ currentPage: Page }> = ({ currentPage }) => {
  const title = navItemsList.find((item) => item.page === currentPage)?.label || 'Dashboard';
  return (
    <header className="header">
      <h2>{title}</h2>
    </header>
  );
};

const StatCard: FC<{ label: string; value: string; change?: string; changeType?: 'positive' | 'negative' }> = ({ label, value, change, changeType }) => (
    <div className="card stat-card">
        <div className="label">{label}</div>
        <div className="value">{value}</div>
        {change && <div className={`change ${changeType}`}>{change}</div>}
    </div>
);

// --- PAGE COMPONENTS ---

const Dashboard: FC<{ transactions: Transaction[] }> = ({ transactions }) => {
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const balance = totalIncome - totalExpense;
    const unpaidExpenses = transactions.filter(t => t.type === 'expense' && !t.isPaid).reduce((sum, t) => sum + t.amount, 0);

    return (
        <div className="page-content">
            <div className="dashboard-grid">
                <StatCard label="Saldo Total" value={`R$ ${balance.toFixed(2)}`} />
                <StatCard label="Receitas do Mês" value={`R$ ${totalIncome.toFixed(2)}`} change="+5.2% vs mês passado" changeType="positive" />
                <StatCard label="Despesas do Mês" value={`R$ ${totalExpense.toFixed(2)}`} change="+1.8% vs mês passado" changeType="negative" />
                <StatCard label="Contas a Pagar" value={`R$ ${unpaidExpenses.toFixed(2)}`} />
            </div>
        </div>
    );
};

const ContactsPage: FC<{ contacts: Contact[], onEdit: (contact: Contact) => void, onDelete: (id: string) => void }> = ({ contacts, onEdit, onDelete }) => {
    const [filter, setFilter] = useState<'all' | 'empresa' | 'cliente'>('all');

    const filteredContacts = contacts.filter(c => filter === 'all' || c.type === filter);
    
    return (
    <div className="page-content">
        <div className="page-header">
            <div className="filter-buttons">
                <button onClick={() => setFilter('all')} className={filter === 'all' ? 'active' : ''}>Todos</button>
                <button onClick={() => setFilter('empresa')} className={filter === 'empresa' ? 'active' : ''}>Empresas</button>
                <button onClick={() => setFilter('cliente')} className={filter === 'cliente' ? 'active' : ''}>Clientes</button>
            </div>
        </div>
        <div className="data-list">
            {filteredContacts.length === 0 ? <p className="empty-state">Nenhum contato encontrado.</p> :
                filteredContacts.map(c => (
                    <div key={c.id} className="card data-item">
                        <div className="item-content">
                            <h4>{c.name}</h4>
                            <p>{c.type === 'cliente' ? c.email : `Contato tipo: ${c.type}`}</p>
                            {c.recurringCharge?.isActive && (
                                <div className="recurring-tag">
                                    <RepeatIcon />
                                    <span>Recorrente: R$ {c.recurringCharge.amount.toFixed(2)} todo dia {c.recurringCharge.launchDay}</span>
                                </div>
                            )}
                        </div>
                        <div className="item-actions">
                            <button onClick={() => onEdit(c)} className="action-button" title="Editar"><PencilIcon /></button>
                            <button onClick={() => onDelete(c.id)} className="action-button" title="Excluir"><TrashIcon /></button>
                        </div>
                    </div>
                ))
            }
        </div>
    </div>
    );
};

const ALL_COLUMNS = {
    statusCheck: '',
    status: 'Status',
    description: 'Descrição',
    contact: 'Contato',
    launchDate: 'Lançamento',
    dueDate: 'Vencimento',
    paidDate: 'Pagamento',
    value: 'Valor',
    actions: 'Ações'
};

const ColumnSelector: FC<{ visibleColumns: ColumnVisibility, setVisibleColumns: (cols: ColumnVisibility) => void }> = ({ visibleColumns, setVisibleColumns }) => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleColumn = (key: string) => {
        setVisibleColumns({ ...visibleColumns, [key]: !visibleColumns[key] });
    };

    return (
        <div className="column-selector-container">
            <button className="column-selector-button" onClick={() => setIsOpen(!isOpen)}>
                <ColumnsIcon /> Colunas
            </button>
            {isOpen && (
                <div className="column-selector-dropdown">
                    {Object.entries(ALL_COLUMNS)
                        .filter(([key]) => key !== 'statusCheck' && key !== 'actions')
                        .map(([key, label]) => (
                        <label key={key} className="column-selector-item">
                            <input type="checkbox" checked={!!visibleColumns[key]} onChange={() => toggleColumn(key)} />
                            {label}
                        </label>
                    ))}
                </div>
            )}
        </div>
    )
};


const FinancialTable: FC<{
    transactions: Transaction[],
    contacts: Contact[],
    onEdit: (t: Transaction) => void,
    onDelete: (id: string) => void,
    onTogglePaid: (id: string) => void,
    visibleColumns: ColumnVisibility
}> = ({ transactions, contacts, onEdit, onDelete, onTogglePaid, visibleColumns }) => {

    const getContactName = (contactId?: string) => {
        if (!contactId) return 'N/A';
        return contacts.find(c => c.id === contactId)?.name || 'Contato não encontrado';
    }

    const getStatus = (t: Transaction): { text: string; className: string } => {
        if (t.isPaid) {
            return { text: 'Paga', className: 'status-paid' };
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize today to the start of the day
        const dueDate = new Date(t.dueDate);
        dueDate.setHours(0, 0, 0, 0); // Normalize due date
        
        if (dueDate < today) {
            return { text: 'Atrasada', className: 'status-overdue' };
        }
        return { text: 'Em Aberto', className: 'status-open' };
    };

    return (
        <div className="table-container">
            <table className="financial-table">
                <thead>
                    <tr>
                        {visibleColumns.statusCheck && <th style={{ width: '40px' }}></th>}
                        {visibleColumns.status && <th>Status</th>}
                        {visibleColumns.description && <th>Descrição</th>}
                        {visibleColumns.contact && <th>Contato</th>}
                        {visibleColumns.launchDate && <th>Lançamento</th>}
                        {visibleColumns.dueDate && <th>Vencimento</th>}
                        {visibleColumns.paidDate && <th>Pagamento</th>}
                        {visibleColumns.value && <th>Valor</th>}
                        {visibleColumns.actions && <th>Ações</th>}
                    </tr>
                </thead>
                <tbody>
                    {transactions.length === 0 ? (
                        <tr>
                            <td colSpan={Object.values(visibleColumns).filter(Boolean).length}>
                                <p className="empty-state">Nenhuma transação encontrada.</p>
                            </td>
                        </tr>
                    ) : (
                        transactions.map(t => {
                            const status = getStatus(t);
                            return (
                                <tr key={t.id} className={`transaction-row ${t.isPaid ? 'paid' : ''}`}>
                                    {visibleColumns.statusCheck && (
                                        <td>
                                            <input
                                                type="checkbox"
                                                className="status-checkbox"
                                                checked={t.isPaid}
                                                onChange={() => onTogglePaid(t.id)}
                                                aria-label={`Marcar ${t.description} como pago`}
                                            />
                                        </td>
                                    )}
                                    {visibleColumns.status && <td><span className={`status-badge ${status.className}`}>{status.text}</span></td>}
                                    {visibleColumns.description && <td>{t.description}</td>}
                                    {visibleColumns.contact && <td>{getContactName(t.contactId)}</td>}
                                    {visibleColumns.launchDate && <td>{new Date(t.date).toLocaleDateString()}</td>}
                                    {visibleColumns.dueDate && <td>{new Date(t.dueDate).toLocaleDateString()}</td>}
                                    {visibleColumns.paidDate && <td>{t.paidDate ? new Date(t.paidDate).toLocaleDateString() : '—'}</td>}
                                    {visibleColumns.value && <td className={`amount ${t.type}`}>{t.type === 'income' ? '+' : '-'} R$ {t.amount.toFixed(2)}</td>}
                                    {visibleColumns.actions && (
                                        <td>
                                            <div className="item-actions">
                                                {!t.isRecurring && <button onClick={() => onEdit(t)} className="action-button" title="Editar"><PencilIcon /></button>}
                                                <button onClick={() => onDelete(t.id)} className="action-button" title="Excluir"><TrashIcon /></button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            )
                        })
                    )}
                </tbody>
            </table>
        </div>
    );
};


const FinancialPage: FC<{
    transactions: Transaction[],
    contacts: Contact[],
    onEdit: (t: Transaction) => void,
    onDelete: (id: string) => void,
    onTogglePaid: (id: string) => void,
    visibleColumns: ColumnVisibility,
    setVisibleColumns: (cols: ColumnVisibility) => void
}> = ({ transactions, contacts, onEdit, onDelete, onTogglePaid, visibleColumns, setVisibleColumns }) => {
    const [filter, setFilter] = useState<'all' | 'expense' | 'income'>('all');

    const sortedTransactions = [...transactions].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    const filteredTransactions = sortedTransactions.filter(t => {
        if (filter === 'all') return true;
        return t.type === filter;
    });

    return (
        <div className="page-content">
            <div className="page-header">
                <div className="filter-buttons">
                    <button onClick={() => setFilter('all')} className={filter === 'all' ? 'active' : ''}>Todos</button>
                    <button onClick={() => setFilter('expense')} className={filter === 'expense' ? 'active' : ''}>Contas a Pagar</button>
                    <button onClick={() => setFilter('income')} className={filter === 'income' ? 'active' : ''}>Contas a Receber</button>
                </div>
                <ColumnSelector visibleColumns={visibleColumns} setVisibleColumns={setVisibleColumns} />
            </div>
            <FinancialTable
                transactions={filteredTransactions}
                contacts={contacts}
                onEdit={onEdit}
                onDelete={onDelete}
                onTogglePaid={onTogglePaid}
                visibleColumns={visibleColumns}
            />
        </div>
    );
}

const ReportsPage: FC<{
    transactions: Transaction[],
    contacts: Contact[],
    onEdit: (t: Transaction) => void,
    onDelete: (id: string) => void,
    onTogglePaid: (id: string) => void,
    visibleColumns: ColumnVisibility,
    setVisibleColumns: (cols: ColumnVisibility) => void
}> = ({ transactions, contacts, onEdit, onDelete, onTogglePaid, visibleColumns, setVisibleColumns }) => {
    const [filter, setFilter] = useState<'all' | 'empresa' | 'cliente'>('all');
    
    const sortedTransactions = [...transactions].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    const filteredTransactions = sortedTransactions.filter(t => {
        if (filter === 'all') return true;
        const contact = contacts.find(c => c.id === t.contactId);
        return contact?.type === filter;
    });

    return (
        <div className="page-content">
            <div className="page-header">
                 <div className="filter-buttons">
                    <button onClick={() => setFilter('all')} className={filter === 'all' ? 'active' : ''}>Todos os Lançamentos</button>
                    <button onClick={() => setFilter('empresa')} className={filter === 'empresa' ? 'active' : ''}>Associados a Empresas</button>
                    <button onClick={() => setFilter('cliente')} className={filter === 'cliente' ? 'active' : ''}>Associados a Clientes</button>
                </div>
                 <ColumnSelector visibleColumns={visibleColumns} setVisibleColumns={setVisibleColumns} />
            </div>
            <FinancialTable transactions={filteredTransactions} contacts={contacts} onEdit={onEdit} onDelete={onDelete} onTogglePaid={onTogglePaid} visibleColumns={visibleColumns} />
        </div>
    );
};

// --- MODAL & FORMS ---

const Modal: FC<{ isOpen: boolean; onClose: () => void; title: string; children: ReactNode }> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{title}</h3>
                    <button onClick={onClose} className="close-button">&times;</button>
                </div>
                <div className="modal-body">{children}</div>
            </div>
        </div>
    );
};

const ConfirmationModal: FC<{ isOpen: boolean, onClose: () => void, onConfirm: () => void, title: string, message: ReactNode }> = ({ isOpen, onClose, onConfirm, title, message }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content confirmation-modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{title}</h3>
                    <button onClick={onClose} className="close-button">&times;</button>
                </div>
                <div className="modal-body">
                    <p>{message}</p>
                    <div className="confirmation-actions">
                        <button onClick={onClose} className="form-button cancel-button">Cancelar</button>
                        <button onClick={onConfirm} className="form-button confirm-button">Confirmar</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

const TransactionForm: FC<{ onSave: (t: Transaction) => void; onClose: () => void; contacts: Contact[], initialData?: Transaction }> = ({ onSave, onClose, contacts, initialData }) => {
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const transaction: Transaction = {
            id: initialData?.id || `new-${Date.now()}`,
            description: formData.get('description') as string,
            amount: parseFloat(formData.get('amount') as string),
            date: formData.get('date') as string,
            dueDate: formData.get('dueDate') as string,
            type: formData.get('type') as 'income' | 'expense',
            contactId: formData.get('contactId') as string || undefined,
            isRecurring: initialData?.isRecurring || false,
            isPaid: initialData?.isPaid || false,
            paidDate: initialData?.paidDate || null,
        };
        onSave(transaction);
        onClose();
    };
    return (
        <form onSubmit={handleSubmit} className="modal-form">
            <div className="form-group">
                <label htmlFor="description">Descrição</label>
                <input id="description" name="description" type="text" defaultValue={initialData?.description} required />
            </div>
            <div className="form-group">
                <label htmlFor="amount">Valor</label>
                <input id="amount" name="amount" type="number" step="0.01" defaultValue={initialData?.amount} required />
            </div>
             <div className="form-group">
                <label htmlFor="date">Data de Lançamento</label>
                <input id="date" name="date" type="date" defaultValue={initialData?.date || new Date().toISOString().split('T')[0]} required />
            </div>
            <div className="form-group">
                <label htmlFor="dueDate">Data de Vencimento</label>
                <input id="dueDate" name="dueDate" type="date" defaultValue={initialData?.dueDate || new Date().toISOString().split('T')[0]} required />
            </div>
            <div className="form-group">
                <label>Tipo</label>
                <select name="type" defaultValue={initialData?.type || 'expense'} required>
                    <option value="expense">Despesa</option>
                    <option value="income">Ganho</option>
                </select>
            </div>
            <div className="form-group">
                <label htmlFor="contactId">Vincular a um contato (Opcional)</label>
                <select name="contactId" id="contactId" defaultValue={initialData?.contactId}>
                    <option value="">Nenhum</option>
                    {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>
            <button type="submit" className="form-button">{initialData ? 'Salvar Alterações' : 'Adicionar'}</button>
        </form>
    );
};

const ContactForm: FC<{ onSave: (c: Contact) => void; onClose: () => void; initialData?: Contact }> = ({ onSave, onClose, initialData }) => {
    const [type, setType] = useState<ContactType>(initialData?.type || 'cliente');
    const [isRecurringActive, setIsRecurringActive] = useState(initialData?.recurringCharge?.isActive || false);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        
        const recurringCharge: RecurringCharge = {
            isActive: formData.has('recurringIsActive'),
            amount: parseFloat(formData.get('recurringAmount') as string) || 0,
            launchDay: parseInt(formData.get('recurringLaunchDay') as string) || 1,
            dueDay: parseInt(formData.get('recurringDueDay') as string) || 1,
        }

        const contact: Contact = {
            id: initialData?.id || `new-${Date.now()}`,
            name: formData.get('name') as string,
            type: formData.get('type') as ContactType,
            email: formData.get('email') as string || undefined,
            recurringCharge: recurringCharge,
        };
        onSave(contact);
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="modal-form">
            <fieldset className="contact-type-fieldset">
                <legend>Tipo de Contato</legend>
                <div className="contact-type-selector">
                    <button type="button" onClick={() => setType('cliente')} className={`contact-type-button ${type === 'cliente' ? 'active' : ''}`}>
                        <UserIcon /> Cliente
                    </button>
                    <button type="button" onClick={() => setType('empresa')} className={`contact-type-button ${type === 'empresa' ? 'active' : ''}`}>
                        <BriefcaseIcon /> Empresa
                    </button>
                </div>
                <input type="hidden" name="type" value={type} />
            </fieldset>

            <div className="form-group">
                <label htmlFor="name">{type === 'cliente' ? 'Nome do Cliente' : 'Nome da Empresa'}</label>
                <input id="name" name="name" type="text" defaultValue={initialData?.name} required />
            </div>

            {type === 'cliente' && (
                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input id="email" name="email" type="email" defaultValue={initialData?.email} />
                </div>
            )}
            
            <div className="recurring-form-section">
                <div className="form-group-checkbox recurring-toggle">
                    <label htmlFor="recurringIsActive">Ativar lançamento recorrente</label>
                    <input id="recurringIsActive" name="recurringIsActive" type="checkbox" checked={isRecurringActive} onChange={e => setIsRecurringActive(e.target.checked)} />
                </div>
                {isRecurringActive && (
                    <div className="recurring-fields">
                         <div className="form-group">
                            <label htmlFor="recurringAmount">Valor Fixo</label>
                            <input id="recurringAmount" name="recurringAmount" type="number" step="0.01" defaultValue={initialData?.recurringCharge?.amount} required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="recurringLaunchDay">Dia do Lançamento (1-31)</label>
                            <input id="recurringLaunchDay" name="recurringLaunchDay" type="number" min="1" max="31" defaultValue={initialData?.recurringCharge?.launchDay || 1} required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="recurringDueDay">Dia do Vencimento (1-31)</label>
                            <input id="recurringDueDay" name="recurringDueDay" type="number" min="1" max="31" defaultValue={initialData?.recurringCharge?.dueDay || 1} required />
                        </div>
                    </div>
                )}
            </div>

            <button type="submit" className="form-button">{initialData ? 'Salvar Alterações' : 'Adicionar'}</button>
        </form>
    );
};

const FloatingActionButton: FC<{ currentPage: Page; onFabClick: (state: ModalState) => void }> = ({ currentPage, onFabClick }) => {
  const fabConfig = {
    dashboard: { label: 'Adicionar Lançamento', icon: <PlusIcon />, action: () => onFabClick({ type: 'addTransaction' }) },
    contatos: { label: 'Adicionar Contato', icon: <UserPlusIcon />, action: () => onFabClick({ type: 'addContact' }) },
    financeiro: { label: 'Adicionar Lançamento', icon: <PlusIcon />, action: () => onFabClick({ type: 'addTransaction' }) },
    relatorios: { label: 'Exportar Relatório', icon: <DownloadIcon />, action: () => alert('Exportando relatório...') },
  };

  const { label, icon, action } = fabConfig[currentPage];

  return (
    <button className="fab" aria-label={label} title={label} onClick={action}>
      {icon}
    </button>
  );
};

// --- RECURRING TRANSACTION LOGIC ---

const createRecurringTransaction = (contact: Contact, date: Date): Transaction => {
    const dueDay = contact.recurringCharge!.dueDay;
    const dueDate = new Date(date.getFullYear(), date.getMonth(), dueDay);

    return {
        id: `recurring-${contact.id}-${date.getFullYear()}-${date.getMonth()}`,
        description: `Lançamento recorrente - ${contact.name}`,
        amount: contact.recurringCharge!.amount,
        date: date.toISOString().split('T')[0],
        dueDate: dueDate.toISOString().split('T')[0],
        type: contact.type === 'cliente' ? 'income' : 'expense',
        contactId: contact.id,
        isRecurring: true,
        isPaid: false,
        paidDate: null,
    };
};

const checkAndGenerateRecurringTransactions = (
    contactsToCheck: Contact[],
    currentTransactions: Transaction[]
): Transaction[] => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const currentDay = today.getDate();
    const newTransactions: Transaction[] = [];

    contactsToCheck.forEach(contact => {
        if (!contact.recurringCharge?.isActive) return;

        const launchDay = contact.recurringCharge.launchDay;

        if (launchDay <= currentDay) {
            const alreadyExists = currentTransactions.some(t =>
                t.isRecurring &&
                t.contactId === contact.id &&
                new Date(t.date).getFullYear() === currentYear &&
                new Date(t.date).getMonth() === currentMonth
            );

            if (!alreadyExists) {
                const transactionDate = new Date(currentYear, currentMonth, launchDay);
                const newTransaction = createRecurringTransaction(contact, transactionDate);
                newTransactions.push(newTransaction);
            }
        }
    });
    return newTransactions;
};

const defaultColumnVisibility: ColumnVisibility = {
    statusCheck: true,
    status: true,
    description: true,
    contact: true,
    launchDate: true,
    dueDate: true,
    paidDate: false,
    value: true,
    actions: true
};

// --- MAIN APP ---

const AppContent = () => {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [modalState, setModalState] = useState<ModalState>(null);
  const [itemToDelete, setItemToDelete] = useState<ItemToDelete>(null);
  
  // State for data
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [hasCheckedOnboarding, setHasCheckedOnboarding] = useState(false);
  const { user } = useAuth();

  // Column visibility states
  const [financialVisibleColumns, setFinancialVisibleColumns] = useState<ColumnVisibility>(defaultColumnVisibility);
  const [reportsVisibleColumns, setReportsVisibleColumns] = useState<ColumnVisibility>(defaultColumnVisibility);

  // --- 1. CARREGAR DADOS DO SUPABASE (SELECT) ---
  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setContacts([]);
        setTransactions([]);
        return;
      }

      // Fetch Contacts
      const { data: contactsData, error: contactsError } = await supabase
        .from('contacts')
        .select('*');
      
      if (contactsError) {
        console.error('Erro ao buscar contatos:', contactsError.message);
      } else {
        // supabase-js v2 converte snake_case para camelCase automaticamente
        setContacts((contactsData as Contact[]) || []);
      }

      // Fetch Transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*');

      if (transactionsError) {
        console.error('Erro ao buscar transações:', transactionsError.message);
      } else {
        setTransactions((transactionsData as Transaction[]) || []);
      }
    };

    fetchData();
  }, [user]); // Roda sempre que o usuário mudar (ou seja, no login)

  useEffect(() => {
    if (user && !hasCheckedOnboarding) {
      // Só mostra o modal de boas-vindas se os dados já foram carregados e estão vazios.
      if (contacts.length === 0 && transactions.length === 0 && financialVisibleColumns) {
        setModalState({ type: 'welcome' });
      }
      setHasCheckedOnboarding(true);
    }
  }, [user, contacts, transactions, hasCheckedOnboarding]);

  // Daily check for recurring transactions
  useEffect(() => {
    const generateAndSaveRecurring = async () => {
      if (!user || contacts.length === 0) return;

      const generated = checkAndGenerateRecurringTransactions(contacts, transactions);

      if (generated.length > 0) {
        console.log(`Gerando ${generated.length} transação(ões) recorrente(s)...`);
        const transactionsToSave = generated.map(t => {
          const { id, ...trans } = t; // O ID é gerado pelo banco, então removemos o ID temporário do cliente.
          return { ...trans, user_id: user.id };
        });

        const { data: newTransactions, error } = await supabase.from('transactions').insert(transactionsToSave).select();

        if (error) {
          console.error('Erro ao salvar transações recorrentes:', error.message);
        } else if (newTransactions) {
          setTransactions(prev => [...prev, ...newTransactions]);
        }
      }
    };

    generateAndSaveRecurring();
  }, [user, contacts]); // Roda quando os contatos são carregados. A lógica interna previne duplicatas.


  // CRUD Handlers
  const handleSaveContact = async (contact: Contact) => {
    if (!user) return;

    const contactToSave = { ...contact, user_id: user.id };
    // supabase-js v2 lida com a conversão de camelCase para snake_case
    // ex: recurringCharge -> recurring_charge

    // Se o contato já tem um ID, é uma atualização (UPDATE)
    if (contact.id && !contact.id.startsWith('new-')) {
      const { data, error } = await supabase
        .from('contacts')
        .update(contactToSave)
        .eq('id', contact.id)
        .select();

      if (error) {
        console.error("Erro ao atualizar contato:", error.message);
        alert("Falha ao atualizar contato: " + error.message);
      } else if (data) {
        setContacts(prev => prev.map(c => c.id === contact.id ? data[0] : c));
      }
    } else { // Senão, é uma inserção (INSERT)
      const { id, ...contactWithoutId } = contactToSave; // Remove o ID temporário do cliente
      const { data, error } = await supabase
        .from('contacts')
        .insert(contactWithoutId)
        .select();
      
      if (error) {
        console.error("Erro ao inserir contato:", error.message);
        alert("Falha ao salvar contato: " + error.message);
      } else if (data) {
        setContacts(prev => [...prev, ...data]);
      }
    }
  };

  const requestDelete = (id: string, type: 'contact' | 'transaction') => {
    setItemToDelete({ id, type });
  };

  const confirmDeletion = async () => {
    if(!itemToDelete) return;
    
    const tableName = itemToDelete.type === 'contact' ? 'contacts' : 'transactions';
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', itemToDelete.id);

    if (error) {
      console.error(`Erro ao deletar ${itemToDelete.type}:`, error.message);
      alert(`Falha ao deletar: ${error.message}`);
      setItemToDelete(null);
      return;
    }

    // Se a deleção no banco foi bem-sucedida, atualiza o estado local
    if (itemToDelete.type === 'contact') {
      setContacts(prev => prev.filter(c => c.id !== itemToDelete.id));
    } else {
      setTransactions(prev => prev.filter(t => t.id !== itemToDelete.id));
    }
    setItemToDelete(null);
  };

  const handleSaveTransaction = async (transaction: Transaction) => {
    if (!user) return;
    const transactionToSave = { ...transaction, user_id: user.id };

    if (transaction.id && !transaction.id.startsWith('new-')) {
      const { data, error } = await supabase.from('transactions').update(transactionToSave).eq('id', transaction.id).select();
      if (error) console.error("Erro ao atualizar transação:", error.message);
      else if (data) setTransactions(prev => prev.map(t => t.id === transaction.id ? data[0] : t));
    } else {
      const { id, ...transactionWithoutId } = transactionToSave; // Remove o ID temporário do cliente
      const { data, error } = await supabase.from('transactions').insert(transactionWithoutId).select();
      if (error) console.error("Erro ao inserir transação:", error.message);
      else if (data) setTransactions(prev => [...prev, ...data]);
    }
  };
  
  const handleToggleTransactionPaid = async (id: string) => {
      const transaction = transactions.find(t => t.id === id);
      if (!transaction) return;

      const isNowPaid = !transaction.isPaid;
      const updatedData = { 
        is_paid: isNowPaid, 
        paid_date: isNowPaid ? new Date().toISOString().split('T')[0] : null 
      };

      const { error } = await supabase.from('transactions').update(updatedData).eq('id', id);

      if (error) {
        console.error("Erro ao atualizar status de pagamento:", error.message);
        return;
      }

      setTransactions(prev => prev.map(t => {
          if (t.id === id) {
              return { 
                ...t, 
                isPaid: updatedData.is_paid, 
                paidDate: updatedData.paid_date 
              };
          }
          return t;
      }));
  }

  const handleOpenEditContact = (contact: Contact) => setModalState({ type: 'editContact', data: contact });
  const handleOpenEditTransaction = (transaction: Transaction) => setModalState({ type: 'editTransaction', data: transaction });

  const renderContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard transactions={transactions} />;
      case 'contatos':
        return <ContactsPage contacts={contacts} onEdit={handleOpenEditContact} onDelete={(id) => requestDelete(id, 'contact')} />;
      case 'financeiro':
        return <FinancialPage 
                    transactions={transactions} 
                    contacts={contacts} 
                    onEdit={handleOpenEditTransaction} 
                    onDelete={(id) => requestDelete(id, 'transaction')} 
                    onTogglePaid={handleToggleTransactionPaid}
                    visibleColumns={financialVisibleColumns}
                    setVisibleColumns={setFinancialVisibleColumns}
                />;
      case 'relatorios':
        return <ReportsPage 
                    transactions={transactions} 
                    contacts={contacts} 
                    onEdit={handleOpenEditTransaction} 
                    onDelete={(id) => requestDelete(id, 'transaction')} 
                    onTogglePaid={handleToggleTransactionPaid} 
                    visibleColumns={reportsVisibleColumns}
                    setVisibleColumns={setReportsVisibleColumns}
                />;
      default:
        return <Dashboard transactions={transactions} />;
    }
  };

  const renderModalContent = () => {
      if(!modalState) return null;

      switch (modalState.type) {
          case 'welcome':
              return (
                  <div>
                      <p>Bem-vindo ao seu novo gerenciador financeiro! Para começar, que tal adicionar seu primeiro contato?</p>
                      <button className="form-button" onClick={() => { setModalState(null); setTimeout(() => setModalState({ type: 'addContact'}), 10)}}>
                          Adicionar Contato
                      </button>
                  </div>
              )
          case 'addTransaction':
          case 'editTransaction':
              return <TransactionForm onSave={handleSaveTransaction} onClose={() => setModalState(null)} contacts={contacts} initialData={modalState.data as Transaction} />;
          case 'addContact':
          case 'editContact':
              return <ContactForm onSave={handleSaveContact} onClose={() => setModalState(null)} initialData={modalState.data as Contact} />;
          default:
              return null;
      }
  };

  const getModalTitle = () => {
      if (!modalState) return '';
      switch (modalState.type) {
          case 'welcome': return 'Bem-vindo(a)!';
          case 'addTransaction': return 'Adicionar Lançamento';
          case 'editTransaction': return 'Editar Lançamento';
          case 'addContact': return 'Adicionar Contato';
          case 'editContact': return 'Editar Contato';
          default: return '';
      }
  }

  return (
    <div className="app-container">
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <main className="main-content">
        <Header currentPage={currentPage} />
        {renderContent()}
      </main>
      <FloatingActionButton currentPage={currentPage} onFabClick={setModalState} />
      <BottomNav currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <Modal isOpen={!!modalState} onClose={() => setModalState(null)} title={getModalTitle()}>
          {renderModalContent()}
      </Modal>
      <ConfirmationModal 
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={confirmDeletion}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.`}
      />
    </div>
  );
};

const App = () => (
  <AuthProvider>
    <Root />
  </AuthProvider>
);

const Root = () => {
    const { user } = useAuth();
    return user ? <AppContent /> : <LoginScreen />;
}


// --- SVG ICONS ---
function HomeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function RepeatIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 2.1l4 4-4 4"/>
      <path d="M3 12.2v-2a4 4 0 0 1 4-4h12.8"/>
      <path d="M7 21.9l-4-4 4-4"/>
      <path d="M21 11.8v2a4 4 0 0 1-4 4H4.2"/>
    </svg>
  );
}

function ArrowUpDownIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21 16-4 4-4-4" />
      <path d="M17 20V4" />
      <path d="m3 8 4-4 4 4" />
      <path d="M7 4v16" />
    </svg>
  );
}

function ChartIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" />
        <path d="m19 9-5 5-4-4-3 3" />
    </svg>
  );
}

function UsersIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function UserIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    );
}

function BriefcaseIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
    );
}

function ColumnsIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <path d="M12 3v18" />
        </svg>
    );
}


function PlusIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14" />
        <path d="M12 5v14" />
    </svg>
  );
}

function UserPlusIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <line x1="19" x2="19" y1="8" y2="14" />
        <line x1="22" x2="16" y1="11" y2="11" />
    </svg>
  );
}

function DownloadIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" x2="12" y1="15" y2="3" />
        </svg>
    );
}

function LogOutIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" x2="9" y1="12" y2="12" />
        </svg>
    );
}

function PencilIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  );
}

function TrashIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function GoogleIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
            <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
            <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.657-3.356-11.303-8H6.306C9.656,39.663,16.318,44,24,44z"></path>
            <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C39.99,35.508,44,30.138,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
        </svg>
    );
}

function CheckCircleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}