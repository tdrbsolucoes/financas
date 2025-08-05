import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom/client';

// =================================================================================
// ICONS (Recreated as SVG components)
// =================================================================================

const IconWrapper = ({ children, className = "w-6 h-6" }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>{children}</svg>;
const SpinnerIcon = ({ className }) => <IconWrapper className={`${className || ''} animate-spin`}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></IconWrapper>;
const RefreshCwIcon = ({ className }) => <IconWrapper className={className}><path d="M3 2v6h6" /><path d="M21 12A9 9 0 0 0 6 5.3L3 8" /><path d="M21 22v-6h-6" /><path d="M3 12a9 9 0 0 0 15 6.7l3-2.7" /></IconWrapper>;
const SearchIcon = ({ className }) => <IconWrapper className={className}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></IconWrapper>;
const PlusIcon = ({ className }) => <IconWrapper className={className}><path d="M5 12h14" /><path d="M12 5v14" /></IconWrapper>;
const EditIcon = ({ className }) => <IconWrapper className={className}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></IconWrapper>;
const TrashIcon = ({ className }) => <IconWrapper className={className}><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></IconWrapper>;
const SettingsIcon = ({ className }) => <IconWrapper className={className}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l-.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></IconWrapper>;
const TerminalIcon = ({ className }) => <IconWrapper className={className}><polyline points="4 17 10 11 4 5" /><line x1="12" x2="20" y1="19" y2="19" /></IconWrapper>;


// =================================================================================
// HELPERS (from helpers.ts)
// =================================================================================

const capitalizeWords = (str) => !str ? '' : str.toLowerCase().replace(/(?:^|\s|-)\S/g, (c) => c.toUpperCase());
const maskDocument = (value) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 11) {
        return cleaned.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').slice(0, 14);
    }
    return cleaned.replace(/(\d{2})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1/$2').replace(/(\d{4})(\d)/, '$1-$2').slice(0, 18);
};
const maskPhone = (value) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 10) return cleaned.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2').slice(0, 14);
    return cleaned.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 15);
};
const maskZip = (value) => value.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 9);
const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
};

// =================================================================================
// SERVICES (from company.service.ts, location.service.ts, and mocked services)
// =================================================================================

const fetchCompanyDataFromCnpj = async (cnpj) => {
    try {
        const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
        if (!response.ok) throw new Error('Serviço de busca de CNPJ indisponível.');
        const data = await response.json();
        if (data.type || data.name === 'CnpjError') throw new Error(data.message || 'CNPJ não encontrado ou inválido.');
        
        return {
            legalName: capitalizeWords(data.razao_social || ''),
            tradeName: capitalizeWords(data.nome_fantasia || ''),
            contactName: data.qsa && data.qsa.length > 0 ? capitalizeWords(data.qsa[0].nome_socio) : '',
            phone: data.ddd_telefone_1 ? maskPhone(data.ddd_telefone_1) : '',
            email: data.email ? data.email.toLowerCase() : '',
            address: {
                street: capitalizeWords(data.logradouro || ''),
                number: data.numero || '',
                neighborhood: capitalizeWords(data.bairro || ''),
                city: capitalizeWords(data.municipio || ''),
                state: (data.uf || '').toUpperCase(),
                zip: maskZip(data.cep || ''),
            }
        };
    } catch (error) { console.error("BrasilAPI CNPJ Error:", error); throw error; }
};

const fetchAddressFromCep = async (cep) => {
    try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        if (!response.ok) throw new Error("Erro ao buscar CEP.");
        const data = await response.json();
        if (data.erro) throw new Error("CEP não encontrado.");
        return {
            street: capitalizeWords(data.logradouro || ''),
            neighborhood: capitalizeWords(data.bairro || ''),
            city: capitalizeWords(data.localidade || ''),
            state: (data.uf || '').toUpperCase(),
        };
    } catch (error) { console.error("ViaCEP Error:", error); throw error; }
};

const geocodeAddress = async (addressQuery) => {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressQuery)}&limit=1`);
        if (!response.ok) throw new Error("Erro ao geolocalizar endereço.");
        const data = await response.json();
        if (data.length > 0) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        return null;
    } catch (err) { console.error("Geocoding failed:", err); throw new Error("Não foi possível encontrar a localização."); }
};

const reverseGeocode = async (lat, lng) => {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
        if (!response.ok) throw new Error("Falha ao buscar endereço.");
        const data = await response.json();
        if (data && data.address) {
            const addr = data.address;
            return {
                street: capitalizeWords(addr.road || ''),
                number: addr.house_number || '',
                neighborhood: capitalizeWords(addr.suburb || addr.neighbourhood || ''),
                city: capitalizeWords(addr.city || addr.town || ''),
                state: (addr.state_code || addr.state || '').toUpperCase(),
                zip: maskZip(addr.postcode || ''),
            };
        }
        throw new Error("Endereço não encontrado para as coordenadas.");
    } catch (err) { console.error("Reverse Geocoding failed:", err); throw err; }
};

const storage = {
    loadClientFieldSettings: () => {
        try { const settings = localStorage.getItem('clientFieldSettings'); return settings ? JSON.parse(settings) : { email: false, phone: false }; }
        catch (e) { return { email: false, phone: false }; }
    },
    saveClientFieldSettings: (settings) => { localStorage.setItem('clientFieldSettings', JSON.stringify(settings)); },
};

const backend = {
    getClientes: async () => {
        try {
            let clients = JSON.parse(localStorage.getItem('clients'));
            if (!clients) {
                clients = [
                    { id: 1, customerType: 'PJ', document: '11.222.333/0001-44', legalName: 'Tecnologia Inovadora Ltda', tradeName: 'Tech Inova', contactName: 'Carlos Silva', email: 'contato@techinova.com', phone: '(11) 98765-4321', status: 'Ativo', address: { street: 'Av. Paulista', number: '1000', neighborhood: 'Bela Vista', region: 'Centro', city: 'São Paulo', state: 'SP', zip: '01310-100' }, location: { lat: -23.5613, lng: -46.6565 } },
                    { id: 2, customerType: 'PF', document: '123.456.789-00', legalName: 'Maria Oliveira', tradeName: '', contactName: 'Maria Oliveira', email: 'maria.o@email.com', phone: '(21) 91234-5678', status: 'Ativo', address: { street: 'Av. Atlântica', number: '2000', neighborhood: 'Copacabana', region: 'Zona Sul', city: 'Rio de Janeiro', state: 'RJ', zip: '22070-001' }, location: { lat: -22.9715, lng: -43.1825 } },
                    { id: 3, customerType: 'PJ', document: '44.555.666/0001-77', legalName: 'Comércio Varejista Brasil S.A.', tradeName: 'Varejo Brasil', contactName: 'Ana Souza', email: 'ana.s@varejobrasil.com', phone: '(31) 99999-8888', status: 'Inativo', address: { street: 'Av. Afonso Pena', number: '3000', neighborhood: 'Centro', region: '', city: 'Belo Horizonte', state: 'MG', zip: '30130-007' }, location: { lat: -19.9245, lng: -43.9352 } }
                ];
                localStorage.setItem('clients', JSON.stringify(clients));
            }
            return clients;
        } catch (e) { return []; }
    },
    saveCliente: async (clientData) => {
        const clients = await backend.getClientes();
        if (clientData.id) {
            const index = clients.findIndex(c => c.id === clientData.id);
            if (index !== -1) clients[index] = clientData;
        } else {
            clientData.id = Date.now();
            clients.push(clientData);
        }
        localStorage.setItem('clients', JSON.stringify(clients));
        return clients;
    },
    deleteCliente: async (id) => {
        let clients = await backend.getClientes();
        clients = clients.filter(c => c.id !== id);
        localStorage.setItem('clients', JSON.stringify(clients));
        return clients;
    },
};

// =================================================================================
// GENERIC COMPONENTS
// =================================================================================

const StatusBadge = ({ status }) => (
    <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full inline-block ${status === 'Ativo' ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-300'}`}>{status}</span>
);

const ClientTableSkeleton = () => (
    <div className="animate-pulse">
        {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center p-6 border-b border-gray-700/50">
                <div className="w-10 h-10 bg-gray-700 rounded-full"></div>
                <div className="flex-1 ml-4 space-y-2"><div className="h-4 bg-gray-700 rounded w-3/4"></div><div className="h-3 bg-gray-700 rounded w-1/2"></div></div>
                <div className="h-4 bg-gray-700 rounded w-1/4 hidden md:block"></div>
                <div className="h-4 bg-gray-700 rounded w-24 hidden sm:block mx-6"></div>
                <div className="w-20 flex items-center justify-end space-x-3"><div className="w-5 h-5 bg-gray-700 rounded"></div><div className="w-5 h-5 bg-gray-700 rounded"></div></div>
            </div>
        ))}
    </div>
);

const InputField = ({ label, id, required = false, ...props }) => (
    <div><label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">{label}{required && <span className="text-red-400 ml-1">*</span>}</label><input id={id} required={required} {...props} className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition disabled:opacity-50" /></div>
);

const Switch = ({ label, enabled, onChange }) => (
    <label className="flex items-center justify-between cursor-pointer bg-gray-700/60 p-4 rounded-lg hover:bg-gray-700 transition-colors">
        <span className="font-medium text-white">{label}</span>
        <div className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${enabled ? 'bg-blue-600' : 'bg-gray-600'}`}>
            <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${enabled ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
        </div>
        <input type="checkbox" className="hidden" checked={enabled} onChange={onChange} />
    </label>
);

const Modal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-md' }) => {
    useEffect(() => {
        const handleEsc = (event) => { if (event.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex justify-center items-center p-4 modal-enter" onClick={onClose} aria-modal="true" role="dialog">
            <div className={`bg-gray-800 rounded-xl shadow-2xl w-full ${maxWidth} modal-content-enter flex flex-col max-h-[95vh]`} onClick={e => e.stopPropagation()}>
                <header className="flex-shrink-0 flex justify-between items-center p-5 border-b border-gray-700">
                    <h3 className="text-xl font-semibold text-white">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors" aria-label="Close modal"><IconWrapper><path d="M18 6 6 18" /><path d="m6 6 12 12" /></IconWrapper></button>
                </header>
                <div className="p-6 overflow-y-auto">{children}</div>
            </div>
        </div>
    );
};

declare var L: any;
const MapPicker = ({ lat, lng, onLocationChange, address }) => {
    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);
    const markerRef = useRef(null);
    const createPopupContent = (addr) => [addr.street, addr.number, addr.neighborhood, addr.city, addr.state].filter(Boolean).join(', ');

    useEffect(() => {
        if (mapContainerRef.current && !mapRef.current) {
            const map = L.map(mapContainerRef.current).setView([lat, lng], 13);
            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>', subdomains: 'abcd', maxZoom: 20 }).addTo(map);
            const marker = L.marker([lat, lng], { draggable: true }).addTo(map);
            if (address) marker.bindPopup(createPopupContent(address)).openPopup();
            marker.on('dragend', (event) => onLocationChange(event.target.getLatLng()));
            mapRef.current = map;
            markerRef.current = marker;
        }
    }, []);

    useEffect(() => {
        if (mapRef.current && markerRef.current) {
            const newLatLng = L.latLng(lat, lng);
            const currentZoom = mapRef.current.getZoom();
            mapRef.current.setView(newLatLng, currentZoom < 15 ? 15 : currentZoom);
            markerRef.current.setLatLng(newLatLng);
            const popupContent = createPopupContent(address);
            if (popupContent) {
                if (markerRef.current.getPopup()) markerRef.current.setPopupContent(popupContent).openPopup();
                else markerRef.current.bindPopup(popupContent).openPopup();
            }
        }
    }, [lat, lng, address]);

    return <div ref={mapContainerRef} className="h-64 w-full rounded-lg z-0 bg-gray-700"></div>;
};

const LogPanel = ({ isOpen, onClose, logs, onClear }) => {
    const scrollRef = useRef(null);
    const panelRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [position, setPosition] = useState({ x: window.innerWidth - 404, y: window.innerHeight - (window.innerHeight * 0.4) - 20 });
    const offsetRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = 0;
        }
    }, [logs]);

    const handleMouseDown = (e) => {
        if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
        setIsDragging(true);
        const panelRect = panelRef.current.getBoundingClientRect();
        offsetRef.current = {
            x: e.clientX - panelRect.left,
            y: e.clientY - panelRect.top,
        };
        e.preventDefault();
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isDragging) return;
            const panelWidth = panelRef.current?.offsetWidth || 0;
            const panelHeight = panelRef.current?.offsetHeight || 0;
            const newX = Math.max(0, Math.min(e.clientX - offsetRef.current.x, window.innerWidth - panelWidth));
            const newY = Math.max(0, Math.min(e.clientY - offsetRef.current.y, window.innerHeight - panelHeight));
            setPosition({ x: newX, y: newY });
        };

        const handleMouseUp = () => setIsDragging(false);

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp, { once: true });
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    if (!isOpen) return null;

    return (
        <div
            ref={panelRef}
            className="fixed w-96 max-w-[90vw] bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-lg shadow-2xl z-[100] flex flex-col max-h-[40vh]"
            style={{ top: `${position.y}px`, left: `${position.x}px` }}
        >
            <header
                className="flex-shrink-0 flex justify-between items-center p-3 border-b border-gray-700 cursor-move"
                onMouseDown={handleMouseDown}
            >
                <h4 className="font-semibold text-sm text-white">Painel de Logs</h4>
                <div className="flex items-center space-x-2">
                    <button onClick={onClear} className="px-3 py-1 text-xs text-gray-300 bg-gray-700 hover:bg-gray-600 rounded transition-colors" aria-label="Limpar logs">Limpar</button>
                    <button onClick={onClose} className="p-1 text-gray-400 hover:text-white transition-colors" aria-label="Fechar painel"><IconWrapper className="w-4 h-4"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></IconWrapper></button>
                </div>
            </header>
            <div ref={scrollRef} className="p-3 overflow-y-auto text-xs space-y-2">
                {logs.length === 0 ? (<p className="text-gray-500 italic text-center py-4">Nenhuma ação registrada.</p>) : (
                    logs.map((log, index) => (
                        <div key={index} className="flex items-start bg-gray-900/50 p-2 rounded-md">
                            <span className="text-gray-500 mr-2 flex-shrink-0">[{log.timestamp.toLocaleTimeString()}]</span>
                            <p className="text-gray-300 break-words font-mono">{log.message}</p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};


// =================================================================================
// MODAL COMPONENTS
// =================================================================================

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, bodyText }) => (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirmar Exclusão" maxWidth="max-w-lg">
        <p className="text-gray-300">{bodyText || 'Tem certeza que deseja excluir o item? Esta ação não pode ser desfeita.'}</p>
        <div className="flex justify-end space-x-3 pt-6 mt-2">
            <button type="button" onClick={onClose} className="px-5 py-2 text-sm font-semibold text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">Cancelar</button>
            <button type="button" onClick={onConfirm} className="px-5 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-500 transition-colors">Excluir</button>
        </div>
    </Modal>
);

const FieldSettingsModal = ({ isOpen, onClose, onSave, initialSettings }) => {
    const [settings, setSettings] = useState(initialSettings);
    useEffect(() => { if (isOpen) setSettings(initialSettings); }, [isOpen, initialSettings]);
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Configuração de Campos" maxWidth="max-w-md">
            <div className="space-y-4">
                <div className="flex items-start bg-gray-900/50 p-4 rounded-lg"><SettingsIcon className="w-6 h-6 text-gray-400 mr-4 mt-1 flex-shrink-0" /><p className="text-sm text-gray-400">Defina quais campos devem ser de preenchimento obrigatório no cadastro de clientes.</p></div>
                <div className="space-y-3 pt-2"><Switch label="Email Obrigatório" enabled={settings.email} onChange={() => setSettings(p => ({ ...p, email: !p.email }))} /><Switch label="Telefone Obrigatório" enabled={settings.phone} onChange={() => setSettings(p => ({ ...p, phone: !p.phone }))} /></div>
            </div>
            <div className="flex justify-end space-x-3 pt-6 mt-4 border-t border-gray-700">
                <button type="button" onClick={onClose} className="px-5 py-2 text-sm font-semibold text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">Cancelar</button>
                <button type="button" onClick={() => onSave(settings)} className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors">Salvar</button>
            </div>
        </Modal>
    );
};

const ClientFormModal = ({ isOpen, onClose, onSave, client, fieldSettings = { email: false, phone: false }, addLog }) => {
    const initialFormState = { customerType: 'PJ', document: '', legalName: '', tradeName: '', contactName: '', email: '', phone: '', status: 'Ativo', address: { street: '', number: '', neighborhood: '', region: '', city: '', state: '', zip: '' }, location: { lat: -23.55052, lng: -46.633308 } };
    const [formData, setFormData] = useState(initialFormState);
    const [isLoading, setIsLoading] = useState({ cep: false, document: false, geo: false });
    const [error, setError] = useState({ cep: '', document: '', geo: '' });

    const resetForm = useCallback(() => {
        setError({ cep: '', document: '', geo: '' });
        if (client) {
            const clientLocation = client.location && typeof client.location.lat === 'number' ? client.location : initialFormState.location;
            setFormData({ ...initialFormState, ...client, address: { ...initialFormState.address, ...client.address }, location: clientLocation });
            addLog(`Carregando dados para editar cliente: ${client.legalName}`);
        } else {
            setFormData(initialFormState);
            addLog('Abrindo formulário para novo cliente.');
        }
    }, [client, addLog]);
    
    useEffect(() => { if (isOpen) resetForm(); }, [client, isOpen, resetForm]);
    
    // Auto-geolocation for new clients
    useEffect(() => {
        if (isOpen && !client) {
            addLog("Tentando obter geolocalização do navegador...");
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const { latitude, longitude } = position.coords;
                        setFormData(prev => ({ ...prev, location: { lat: latitude, lng: longitude } }));
                        addLog(`Geolocalização obtida: [${latitude.toFixed(4)}, ${longitude.toFixed(4)}]`);
                    },
                    (err) => {
                        addLog(`ERRO (Geolocalização): ${err.message}`);
                    }
                );
            } else {
                addLog("Geolocalização não é suportada por este navegador.");
            }
        }
    }, [isOpen, client, addLog]);

    useEffect(() => {
        if (!isOpen) return;
        setFormData(prev => ({ ...prev, tradeName: prev.customerType === 'PJ' ? prev.tradeName : '', contactName: prev.contactName || (prev.customerType === 'PJ' ? '' : prev.legalName) }));
    }, [formData.customerType, isOpen]);
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        let finalValue = ['legalName', 'tradeName', 'contactName'].includes(name) ? capitalizeWords(value) : value;
        if (name === 'document') { finalValue = maskDocument(value); setError(p => ({ ...p, document: '' })); }
        if (name === 'phone') finalValue = maskPhone(value);
        setFormData(p => ({ ...p, [name]: finalValue }));
        addLog(`Campo '${name}' alterado para: "${finalValue}"`);
    };

    const handleCepLookup = useCallback(async (cep) => {
        addLog(`Iniciando busca por CEP: ${cep}`);
        setIsLoading(p => ({...p, cep: true})); setError(p => ({...p, cep: ''}));
        try {
            const newAddressData = await fetchAddressFromCep(cep);
            setFormData(p => ({ ...p, address: { ...p.address, ...newAddressData } }));
            addLog(`CEP encontrado. Endereço preenchido: ${newAddressData.street}`);

            const addressQuery = `${newAddressData.street}, ${newAddressData.city}, ${newAddressData.state}`;
            const newLocation = await geocodeAddress(addressQuery);
            if (newLocation) {
                setFormData(p => ({ ...p, location: newLocation }));
                addLog(`Geolocalização do CEP encontrada.`);
            }
        } catch (err) { 
            setError(p => ({...p, cep: err.message})); 
            addLog(`ERRO (CEP): ${err.message}`);
        } finally { setIsLoading(p => ({...p, cep: false})); }
    }, [addLog]);

    const debouncedCepLookup = useMemo(() => debounce(handleCepLookup, 500), [handleCepLookup]);

    const handleAddressChange = (e) => {
        const { name, value } = e.target;
        
        if (name === 'zip') {
            setError(p => ({ ...p, cep: '' }));
            const finalValue = maskZip(value);
            setFormData(p => ({ ...p, address: { ...p.address, zip: finalValue } }));
            addLog(`Endereço: campo 'zip' alterado para: "${finalValue}"`);

            const cleanedCep = finalValue.replace(/\D/g, '');
            if (cleanedCep.length === 8) {
                addLog(`CEP completo, iniciando busca em 500ms...`);
                debouncedCepLookup(cleanedCep);
            }
        } else {
             const finalValue = ['street', 'neighborhood', 'city', 'region'].includes(name) ? capitalizeWords(value) : (name === 'state' ? value.toUpperCase().slice(0, 2) : value);
             setFormData(p => ({ ...p, address: { ...p.address, [name]: finalValue } }));
             addLog(`Endereço: campo '${name}' alterado para: "${finalValue}"`);
        }
    };

    const handleDocumentLookup = async () => {
        const cleanedCnpj = formData.document.replace(/\D/g, '');
        if (cleanedCnpj.length !== 14) { setError(p => ({ ...p, document: 'Busca disponível apenas para CNPJ válido.' })); return; }
        addLog(`Iniciando busca por CNPJ: ${cleanedCnpj}`);
        setIsLoading(p => ({ ...p, document: true })); setError(p => ({ ...p, document: '' }));
        try {
            const data = await fetchCompanyDataFromCnpj(cleanedCnpj);
            const newLocation = await geocodeAddress(`${data.address.street}, ${data.address.number}, ${data.address.city}, ${data.address.state}`);
            
            setFormData(p => {
                const updates: { [key: string]: any } = {
                    legalName: data.legalName,
                    tradeName: data.tradeName,
                    address: { ...p.address, ...data.address },
                    ...(newLocation && { location: newLocation })
                };
                if (data.contactName) updates.contactName = data.contactName;
                if (data.phone) updates.phone = data.phone;
                if (data.email) updates.email = data.email;

                return { ...p, ...updates };
            });

            addLog(`CNPJ encontrado. Dados preenchidos para: ${data.legalName}`);
            if(data.tradeName) addLog(`- Nome Fantasia: ${data.tradeName}`);
            if(data.contactName) addLog(`- Contato: ${data.contactName}`);
            if(data.phone) addLog(`- Telefone: ${data.phone}`);
            if(data.email) addLog(`- Email: ${data.email}`);

        } catch (err) { 
            setError(p => ({ ...p, document: err.message }));
            addLog(`ERRO (CNPJ): ${err.message}`);
        } finally { setIsLoading(p => ({ ...p, document: false })); }
    };

    const handleUpdateAddressFromMap = async () => {
        addLog(`Atualizando endereço a partir do mapa: [${formData.location.lat.toFixed(4)}, ${formData.location.lng.toFixed(4)}]`);
        setIsLoading(p => ({ ...p, geo: true })); setError(p => ({ ...p, geo: '' }));
        try {
            const newAddressData = await reverseGeocode(formData.location.lat, formData.location.lng);
            if (Object.values(newAddressData).some(v => v)) {
                setFormData(p => ({ ...p, address: { ...p.address, ...newAddressData }}));
                addLog(`Endereço do mapa encontrado: ${newAddressData.street}`);
            } else throw new Error("Não foi possível obter um endereço detalhado.");
        } catch (err) {
            setError(p => ({ ...p, geo: err.message }));
            addLog(`ERRO (Mapa): ${err.message}`);
        } finally { setIsLoading(p => ({ ...p, geo: false })); }
    };

    const handleSubmit = (e) => { 
        e.preventDefault(); 
        const dataToSave = { id: client?.id, ...formData, contactName: formData.customerType === 'PF' ? formData.legalName : formData.contactName };
        addLog(`Tentativa de salvar cliente: ${dataToSave.legalName}`);
        onSave(dataToSave);
    };
    
    const isPJ = formData.customerType === 'PJ';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={client ? 'Editar Cliente' : 'Adicionar Cliente'} maxWidth="max-w-5xl">
            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-8 gap-y-10">
                    <div className="lg:col-span-2 space-y-8">
                        <fieldset><legend className="text-lg font-semibold text-white mb-4 pb-3 border-b border-gray-700">Identificação</legend><div className="space-y-6">
                            <div className="flex items-center space-x-6">
                                <label className="flex items-center space-x-2 text-white cursor-pointer"><input type="radio" name="customerType" value="PJ" checked={isPJ} onChange={handleChange} className="form-radio bg-gray-700 text-blue-500 border-gray-600 focus:ring-blue-500" /><span>Pessoa Jurídica</span></label>
                                <label className="flex items-center space-x-2 text-white cursor-pointer"><input type="radio" name="customerType" value="PF" checked={!isPJ} onChange={handleChange} className="form-radio bg-gray-700 text-blue-500 border-gray-600 focus:ring-blue-500" /><span>Pessoa Física</span></label>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
                                <div>
                                    <label htmlFor="document" className="block text-sm font-medium text-gray-300 mb-1">{isPJ ? 'CNPJ' : 'CPF'}<span className="text-red-400 ml-1">*</span></label>
                                    <div className="flex space-x-2"><input type="text" name="document" id="document" value={formData.document} onChange={handleChange} className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder={isPJ ? 'XX.XXX.XXX/XXXX-XX' : 'XXX.XXX.XXX-XX'} required />{isPJ && <button type="button" onClick={handleDocumentLookup} disabled={isLoading.document} className="px-3 py-2 text-sm font-semibold text-white bg-gray-600 rounded-lg hover:bg-gray-500 transition-colors disabled:opacity-50 flex items-center">{isLoading.document ? <SpinnerIcon className="w-5 h-5"/> : <SearchIcon className="w-5 h-5"/>}</button>}</div>
                                    {error.document && <p className="text-red-400 text-xs mt-1">{error.document}</p>}
                                </div>
                                <InputField label={isPJ ? "Razão Social" : "Nome Completo"} id="legalName" name="legalName" value={formData.legalName} onChange={handleChange} required />
                                {isPJ && <InputField label="Nome Fantasia" id="tradeName" name="tradeName" value={formData.tradeName} onChange={handleChange} />}
                                <InputField label="Nome do Contato" id="contactName" name="contactName" value={formData.contactName} onChange={handleChange} required />
                                <InputField label="Email" id="email" name="email" type="email" value={formData.email} onChange={handleChange} required={fieldSettings.email} />
                                <InputField label="Telefone" id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} required={fieldSettings.phone} placeholder="(XX) XXXXX-XXXX" />
                            </div>
                        </div></fieldset>
                         <fieldset><legend className="text-lg font-semibold text-white mb-4 pb-3 border-b border-gray-700">Endereço</legend><div className="grid grid-cols-1 md:grid-cols-6 gap-x-4 gap-y-6">
                            <div className="md:col-span-2"><label htmlFor="zip" className="block text-sm font-medium text-gray-300 mb-1">CEP</label><div className="relative"><input type="text" name="zip" id="zip" value={formData.address.zip} onChange={handleAddressChange} className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10" placeholder="XXXXX-XXX" />{isLoading.cep && (<div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none"><SpinnerIcon className="w-5 h-5 text-gray-400" /></div>)}</div>{error.cep && <p className="text-red-400 text-xs mt-1">{error.cep}</p>}</div>
                            <div className="md:col-span-4"><InputField label="Rua / Logradouro" id="street" name="street" value={formData.address.street} onChange={handleAddressChange} /></div>
                            <div className="md:col-span-1"><InputField label="Nº" id="number" name="number" value={formData.address.number} onChange={handleAddressChange} /></div>
                            <div className="md:col-span-3"><InputField label="Bairro" id="neighborhood" name="neighborhood" value={formData.address.neighborhood} onChange={handleAddressChange} /></div>
                            <div className="md:col-span-2"><InputField label="Região/Complemento" id="region" name="region" value={formData.address.region || ''} onChange={handleAddressChange} placeholder="Ex: Zona Sul" /></div>
                            <div className="md:col-span-4"><InputField label="Cidade" id="city" name="city" value={formData.address.city} onChange={handleAddressChange} /></div>
                            <div className="md:col-span-2"><InputField label="UF" id="state" name="state" value={formData.address.state} onChange={handleAddressChange} placeholder="SP" /></div>
                        </div></fieldset>
                    </div>
                    <div className="lg:col-span-1 space-y-8">
                        <fieldset><legend className="text-lg font-semibold text-white mb-4 pb-3 border-b border-gray-700">Status</legend><div className="flex rounded-lg bg-gray-700 p-1"><button type="button" onClick={() => setFormData(p => ({...p, status: 'Ativo'}))} className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-colors ${formData.status === 'Ativo' ? 'bg-green-500 text-white' : 'text-gray-300 hover:bg-gray-600'}`}>Ativo</button><button type="button" onClick={() => setFormData(p => ({...p, status: 'Inativo'}))} className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-colors ${formData.status === 'Inativo' ? 'bg-red-500 text-white' : 'text-gray-300 hover:bg-gray-600'}`}>Inativo</button></div></fieldset>
                        <fieldset><legend className="text-lg font-semibold text-white mb-4 pb-3 border-b border-gray-700 flex justify-between items-center"><span>Localização</span><button type="button" onClick={handleUpdateAddressFromMap} disabled={isLoading.geo} className="flex items-center px-2 py-1 text-xs font-semibold text-white bg-gray-600 rounded-md hover:bg-gray-500 disabled:opacity-50"><RefreshCwIcon className={`w-3 h-3 mr-1.5 ${isLoading.geo ? 'animate-spin' : ''}`} />Atualizar</button></legend>
                            <p className="text-xs text-gray-400 mb-2 -mt-2">Arraste o marcador para ajustar.</p><MapPicker lat={formData.location.lat} lng={formData.location.lng} onLocationChange={(loc) => { setFormData(p => ({ ...p, location: loc })); addLog(`Mapa ajustado para: [${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}]`); }} address={formData.address} />
                            <div className="flex items-center space-x-4 mt-2"><p className="text-xs text-gray-400">Lat: {formData.location.lat.toFixed(6)}</p><p className="text-xs text-gray-400">Lng: {formData.location.lng.toFixed(6)}</p>{error.geo && <p className="text-red-400 text-xs">{error.geo}</p>}</div>
                        </fieldset>
                    </div>
                </div>
                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-700"><button type="button" onClick={onClose} className="px-5 py-2 text-sm font-semibold text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">Cancelar</button><button type="submit" className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors">Salvar Cliente</button></div>
            </form>
        </Modal>
    );
};

// =================================================================================
// MAIN PAGE COMPONENT
// =================================================================================

const Breadcrumb = ({ page }) => <nav aria-label="breadcrumb"><ol className="flex items-center space-x-2 text-gray-400 text-sm"><li className="hover:text-white transition-colors"><a href="#">Início</a></li><li><span>/</span></li><li className="font-medium text-white">{page}</li></ol></nav>;

const ClientsPage = () => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormModalOpen, setFormModalOpen] = useState(false);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState(null);
    const [fieldSettings, setFieldSettings] = useState({ email: false, phone: false });
    const [logs, setLogs] = useState([]);
    const [isLogPanelVisible, setLogPanelVisible] = useState(false);

    const addLog = useCallback((message) => {
        const newLog = { timestamp: new Date(), message };
        setLogs(prev => [newLog, ...prev].slice(0, 30));
    }, []);

    const clearLogs = () => setLogs([]);

    const loadClients = useCallback(async () => {
        setLoading(true);
        setError(null);
        try { const data = await backend.getClientes(); setClients(data); }
        catch (err) { setError(err.message); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { loadClients(); setFieldSettings(storage.loadClientFieldSettings()); }, [loadClients]);

    const handleOpenAddModal = () => { setSelectedClient(null); setFormModalOpen(true); };
    const handleOpenEditModal = (c) => { setSelectedClient(c); setFormModalOpen(true); };
    const handleOpenDeleteModal = (c) => { setSelectedClient(c); setDeleteModalOpen(true); };
    const handleCloseModals = () => { setFormModalOpen(false); setDeleteModalOpen(false); setSettingsModalOpen(false); setSelectedClient(null); };

    const handleSaveClient = async (clientData) => {
        try { const updated = await backend.saveCliente(clientData); setClients(updated); handleCloseModals(); }
        catch (err) { alert(`Erro ao salvar cliente: ${err.message}`); }
    };

    const handleConfirmDelete = async () => { if (selectedClient) { const updated = await backend.deleteCliente(selectedClient.id); setClients(updated); } handleCloseModals(); };
    const handleSaveSettings = (newSettings) => { setFieldSettings(newSettings); storage.saveClientFieldSettings(newSettings); setSettingsModalOpen(false); };

    const filteredClients = useMemo(() => clients.filter(c => Object.values(c).some(val => typeof val === 'string' && val.toLowerCase().includes(searchTerm.toLowerCase()))), [clients, searchTerm]);

    return (
        <>
            <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
                <Breadcrumb page="Clientes" />
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-6 mb-8">
                    <div><h2 className="text-3xl font-bold text-white">Clientes</h2><p className="text-gray-400 mt-1">Gerencie seus clientes e informações de contato.</p></div>
                    <div className="flex items-center space-x-2 mt-4 sm:mt-0 w-full sm:w-auto">
                        <div className="relative flex-grow sm:flex-grow-0"><span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><SearchIcon className="w-5 h-5"/></span><input type="search" placeholder="Buscar..." className="w-full sm:w-64 bg-gray-800 text-white rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" onChange={(e) => setSearchTerm(e.target.value)} /></div>
                        <button onClick={() => setSettingsModalOpen(true)} className="p-2 text-gray-400 bg-gray-800 rounded-lg hover:bg-gray-700 hover:text-white transition-colors" aria-label="Configurar Campos"><SettingsIcon className="w-5 h-5" /></button>
                        <button onClick={() => setLogPanelVisible(p => !p)} className="p-2 text-gray-400 bg-gray-800 rounded-lg hover:bg-gray-700 hover:text-white transition-colors" aria-label="Painel de Logs"><TerminalIcon className="w-5 h-5" /></button>
                        <button onClick={handleOpenAddModal} className="flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500"><PlusIcon className="w-4 h-4 mr-2" />Adicionar</button>
                    </div>
                </header>
                <div className="bg-gray-800 rounded-xl shadow-lg">
                    {loading ? <ClientTableSkeleton /> : error ? <div className="p-8 text-center text-red-400">{error}</div> : (
                        <div className="overflow-x-auto"><table className="w-full text-sm text-left text-gray-300">
                            <thead className="text-xs text-gray-400 uppercase bg-gray-800 border-b border-gray-700"><tr className="border-b border-gray-700/50"><th scope="col" className="px-6 py-4">Cliente</th><th scope="col" className="px-6 py-4 hidden md:table-cell">Localização</th><th scope="col" className="px-6 py-4 hidden sm:table-cell">Telefone</th><th scope="col" className="px-6 py-4">Status</th><th scope="col" className="px-6 py-4 text-right">Ações</th></tr></thead>
                            <tbody>{filteredClients.map((client) => {
                                const displayName = client.tradeName || client.legalName;
                                return (<tr key={client.id} className="bg-gray-800 border-b border-gray-700/50 hover:bg-gray-700/50 transition-colors">
                                    <th scope="row" className="px-6 py-4 font-medium text-white whitespace-nowrap"><div className="flex items-center">
                                        <img className="w-10 h-10 rounded-full object-cover bg-gray-700" src={`https://i.pravatar.cc/100?u=${client.id}`} alt={displayName} />
                                        <div className="pl-3"><div className="text-base font-semibold">{displayName}</div><div className="font-normal text-gray-400">{client.customerType === 'PJ' ? client.legalName : client.document}</div></div>
                                    </div></th>
                                    <td className="px-6 py-4 hidden md:table-cell">{client.address?.city && client.address?.state ? `${client.address.city}, ${client.address.state}` : 'N/A'}</td>
                                    <td className="px-6 py-4 hidden sm:table-cell">{client.phone || 'N/A'}</td>
                                    <td className="px-6 py-4"><StatusBadge status={client.status} /></td>
                                    <td className="px-6 py-4 text-right"><div className="flex items-center justify-end space-x-3"><button onClick={() => handleOpenEditModal(client)} className="text-blue-400 hover:text-blue-300 transition-colors" aria-label={`Editar ${displayName}`}><EditIcon className="w-5 h-5" /></button><button onClick={() => handleOpenDeleteModal(client)} className="text-red-500 hover:text-red-400 transition-colors" aria-label={`Excluir ${displayName}`}><TrashIcon className="w-5 h-5" /></button></div></td>
                                </tr>);
                            })}</tbody>
                        </table></div>
                    )}
                    {!loading && filteredClients.length === 0 && <div className="p-8 text-center text-gray-400">{clients.length > 0 ? `Nenhum cliente encontrado com o termo "${searchTerm}".` : 'Nenhum cliente cadastrado. Adicione um para começar.'}</div>}
                </div>
                {isFormModalOpen && <ClientFormModal isOpen={isFormModalOpen} onClose={handleCloseModals} onSave={handleSaveClient} client={selectedClient} fieldSettings={fieldSettings} addLog={addLog} />}
                <DeleteConfirmationModal isOpen={isDeleteModalOpen} onClose={handleCloseModals} onConfirm={handleConfirmDelete} bodyText={`Tem certeza que deseja excluir o cliente "${selectedClient?.tradeName || selectedClient?.legalName}"? Esta ação não pode ser desfeita.`} />
                <FieldSettingsModal isOpen={isSettingsModalOpen} onClose={() => setSettingsModalOpen(false)} onSave={handleSaveSettings} initialSettings={fieldSettings} />
            </main>
            <LogPanel isOpen={isLogPanelVisible} onClose={() => setLogPanelVisible(false)} logs={logs} onClear={clearLogs} />
        </>
    );
};

// =================================================================================
// RENDER APPLICATION
// =================================================================================

const App = () => (
    <div className="bg-gray-900 text-white min-h-screen font-sans">
        <ClientsPage />
    </div>
);

const rootElement = document.getElementById('root');
if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(<React.StrictMode><App /></React.StrictMode>);
}