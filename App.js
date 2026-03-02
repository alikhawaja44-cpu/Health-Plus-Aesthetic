import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  LayoutDashboard, Users, Calendar, FileText, CreditCard, 
  TestTube, Pill, UserCog, Settings, LogOut, Menu, X, 
  Plus, Search, Trash2, Edit, Printer, Share2, Download,
  Stethoscope, Activity, AlertCircle, CheckCircle, Clock,
  DollarSign, FilePlus
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// --- LOCAL STORAGE HOOK (BUG FIXED) ---
function useStickyState(defaultValue, key) {
  const [value, setValue] = useState(() => {
    try {
      const stickyValue = window.localStorage.getItem(key);
      return stickyValue !== null ? JSON.parse(stickyValue) : defaultValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  });
  
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error saving to localStorage key "${key}":`, error);
    }
  }, [key, value]);
  
  return [value, setValue];
}

// --- MOCK DATA SEEDS ---
const INITIAL_USERS = [
    { id: 1, username: 'admin', password: 'admin123', email: 'admin@clinic.com', role: 'Admin', name: 'Dr. Administrator' }
];
const MOCK_DRUGS = [
    { id: 1, name: 'Panadol 500mg', type: 'Tablet', stock: 500, price: 5 },
    { id: 2, name: 'Augmentin 625mg', type: 'Tablet', stock: 100, price: 45 },
    { id: 3, name: 'Brufen 400mg', type: 'Syrup', stock: 50, price: 120 },
    { id: 4, name: 'Flagyl 400mg', type: 'Tablet', stock: 200, price: 15 },
];

// --- UTILITY FUNCTIONS ---
const generateMR = () => {
    const year = new Date().getFullYear().toString().substr(-2);
    const random = Math.floor(1000 + Math.random() * 9000);
    return `MR-${year}-${random}`};
};

const formatCurrency = (amount) => {
    return `Rs ${Number(amount || 0).toLocaleString()}`;
};

const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

// --- COMPONENTS ---

// 1. LOGIN (IMPROVED VALIDATION)
const Login = ({ onLogin, error }) => {
    const [user, setUser] = useState('');
    const [pass, setPass] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        await onLogin(user, pass);
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200">
                <div className="text-center mb-8">
                    <div className="bg-white w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 shadow-sm overflow-hidden p-2">
                        <img src="./logo.jpg" alt="Logo" className="w-full h-full object-contain" 
                             onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                        />
                        <div className="hidden w-full h-full bg-blue-100 rounded-full items-center justify-center">
                            <Users size={32} className="text-blue-600" />
                        </div>
                    </div>
                    <h1 className="text-xl font-bold text-slate-800">Health+ & Aesthetic Clinic</h1>
                    <p className="text-slate-500">Secure Medical System</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Username or Email</label>
                        <input 
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                            value={user} 
                            onChange={e => setUser(e.target.value)} 
                            required 
                            disabled={isLoading}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                        <input 
                            type="password" 
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                            value={pass} 
                            onChange={e => setPass(e.target.value)} 
                            required 
                            disabled={isLoading}
                        />
                    </div>
                    {error && (
                        <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg flex items-center gap-2">
                            <AlertCircle size={16}/> {error}
                        </div>
                    )}
                    <button 
                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Signing In...' : 'Login to System'}
                    </button>
                </form>
            </div>
        </div>
    );
};

// 2. MAIN APP
const App = () => {
    // -- STATE --
    const [users, setUsers] = useStickyState(INITIAL_USERS, 'clinic_users');
    const [currentUser, setCurrentUser] = useStickyState(null, 'clinic_current_user');
    
    const [patients, setPatients] = useStickyState([], 'clinic_patients');
    const [appointments, setAppointments] = useStickyState([], 'clinic_appointments');
    const [inventory, setInventory] = useStickyState(MOCK_DRUGS, 'clinic_inventory');
    const [prescriptions, setPrescriptions] = useStickyState([], 'clinic_prescriptions');
    const [invoices, setInvoices] = useStickyState([], 'clinic_invoices');
    
    const [view, setView] = useState('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [authError, setAuthError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    // -- FORMS --
    const [showPatientForm, setShowPatientForm] = useState(false);
    const [showAppointmentForm, setShowAppointmentForm] = useState(false);
    const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);
    const [showBillingForm, setShowBillingForm] = useState(false);
    const [showInventoryForm, setShowInventoryForm] = useState(false);
    const [showUserForm, setShowUserForm] = useState(false);
    const [formData, setFormData] = useState({});
    const [formErrors, setFormErrors] = useState({});

    // -- SEARCH FUNCTIONALITY --
    const filteredPatients = useMemo(() => {
        if (!searchTerm) return patients;
        const term = searchTerm.toLowerCase();
        return patients.filter(patient => 
            patient.name?.toLowerCase().includes(term) || 
            patient.mrNumber?.toLowerCase().includes(term) ||
            patient.contact?.includes(term)
        );
    }, [patients, searchTerm]);

    // -- AUTH HANDLER --
    const handleLogin = (input, pass) => {
        const foundUser = users.find(u => (u.username === input || u.email === input) && u.password === pass);
        if (foundUser) {
            setCurrentUser(foundUser);
            setAuthError(null);
        } else {
            setAuthError("Invalid username/email or password");
        }
    };

    // -- FORM VALIDATION --
    const validateForm = (type, data) => {
        const errors = {};
        
        switch (type) {
            case 'user':
                if (!data.name?.trim()) errors.name = 'Name is required';
                if (!data.username?.trim()) errors.username = 'Username is required';
                if (!data.email?.trim()) errors.email = 'Email is required';
                if (!validateEmail(data.email)) errors.email = 'Invalid email format';
                if (!data.password?.trim()) errors.password = 'Password is required';
                if (data.password?.length < 6) errors.password = 'Password must be at least 6 characters';
                break;
            case 'patient':
                if (!data.name?.trim()) errors.name = 'Patient name is required';
                if (!data.age || data.age < 0 || data.age > 150) errors.age = 'Valid age is required';
                if (!data.contact?.trim()) errors.contact = 'Contact number is required';
                break;
            case 'appointment':
                if (!data.patientName) errors.patientName = 'Patient selection is required';
                if (!data.date) errors.date = 'Date is required';
                if (!data.doctor) errors.doctor = 'Doctor selection is required';
                break;
            case 'invoice':
                if (!data.patientName) errors.patientName = 'Patient selection is required';
                if (!data.total || data.total <= 0) errors.total = 'Valid amount is required';
                break;
        }
        
        return errors;
    };

    // -- MODULE: USERS --
    const handleSaveUser = (e) => {
        e.preventDefault();
        const errors = validateForm('user', formData);
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }
        setFormErrors({});

        const newUser = { 
            ...formData, 
            id: formData.id || Date.now(),
            role: formData.role || 'Staff'
        };
        
        if (formData.id) {
            setUsers(users.map(u => u.id === formData.id ? newUser : u));
        } else {
            if (users.some(u => u.username === newUser.username)) {
                setFormErrors({ username: 'Username already exists' });
                return;
            }
            if (users.some(u => u.email === newUser.email)) {
                setFormErrors({ email: 'Email already exists' });
                return;
            }
            setUsers([...users, newUser]);
        }
        setShowUserForm(false);
        setFormData({});
    };

    const handleDeleteUser = (id) => {
        if (id === 1) return alert("Cannot delete main admin!");
        if (confirm("Delete this user account?")) {
            setUsers(users.filter(u => u.id !== id));
            // If deleted user is current user, log them out
            if (currentUser?.id === id) {
                setCurrentUser(null);
            }
        }
    };

    // -- MODULE: PATIENTS --
    const handleSavePatient = (e) => {
        e.preventDefault();
        const errors = validateForm('patient', formData);
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }
        setFormErrors({});

        const newPatient = {
            id: formData.id || Date.now(),
            mrNumber: formData.mrNumber || generateMR(),
            ...formData,
            registeredAt: formData.registeredAt || new Date().toISOString()
        };
        
        if (formData.id) {
            setPatients(patients.map(p => p.id === formData.id ? newPatient : p));
        } else {
            setPatients([newPatient, ...patients]);
        }
        setShowPatientForm(false);
        setFormData({});
    };

    // Generic Delete (IMPROVED)
    const handleDelete = (id, type) => {
        if (currentUser.role !== 'Admin') {
            alert("Access Denied: Admins Only");
            return;
        }
        
        if (!confirm("Are you sure you want to delete this record?")) return;
        
        const actions = {
            patient: () => setPatients(patients.filter(p => p.id !== id)),
            appointment: () => setAppointments(appointments.filter(a => a.id !== id)),
            prescription: () => setPrescriptions(prescriptions.filter(p => p.id !== id)),
            inventory: () => setInventory(inventory.filter(i => i.id !== id)),
            invoice: () => setInvoices(invoices.filter(i => i.id !== id)),
        };
        
        if (actions[type]) actions[type]();
    };

    const handleEdit = (item, type) => {
        if (currentUser.role !== 'Admin') {
            alert("Access Denied: Admins Only");
            return;
        }
        setFormData(item);
        setFormErrors({});
        
        const formTypes = {
            patient: () => setShowPatientForm(true),
            appointment: () => setShowAppointmentForm(true),
            prescription: () => setShowPrescriptionForm(true),
            inventory: () => setShowInventoryForm(true),
            invoice: () => setShowBillingForm(true),
        };
        
        if (formTypes[type]) formTypes[type]();
    };

    // -- MODULE: APPOINTMENTS --
    const handleSaveAppointment = (e) => {
        e.preventDefault();
        const errors = validateForm('appointment', formData);
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }
        setFormErrors({});

        const tokenNumber = appointments.filter(a => a.date === formData.date).length + 1;
        const newAppt = {
            id: formData.id || Date.now(),
            token: formData.token || tokenNumber,
            status: formData.status || 'Pending',
            ...formData
        };
        
        if (formData.id) {
            setAppointments(appointments.map(a => a.id === formData.id ? newAppt : a));
        } else {
            setAppointments([newAppt, ...appointments]);
        }
        setShowAppointmentForm(false);
        setFormData({});
    };

    // -- MODULE: PRESCRIPTIONS --
    const handleSavePrescription = (e) => {
        e.preventDefault();
        const newRx = {
            id: formData.id || Date.now(),
            date: new Date().toISOString().split('T')[0],
            doctor: currentUser.name,
            ...formData
        };
        if (formData.id) {
            setPrescriptions(prescriptions.map(p => p.id === formData.id ? newRx : p));
        } else {
            setPrescriptions([newRx, ...prescriptions]);
        }
        setShowPrescriptionForm(false);
        setFormData({});
    };

    const printPrescription = (rx) => {
        try {
            const doc = new jsPDF();
            doc.setFontSize(20);
            doc.text("HEALTH+ & AESTHETIC CLINIC", 105, 20, null, null, "center");
            doc.setFontSize(12);
            doc.text(`Dr. ${rx.doctor}`, 105, 30, null, null, "center");
            
            doc.line(10, 35, 200, 35);
            
            doc.text(`Patient: ${rx.patientName}`, 14, 45);
            doc.text(`Date: ${rx.date}`, 150, 45);
            
            doc.setFontSize(14);
            doc.text("Rx", 14, 60);
            
            const meds = rx.medicines ? (typeof rx.medicines === 'string' ? JSON.parse(rx.medicines) : rx.medicines) : [];
            const tableData = meds.map(m => [m.name, m.dosage, m.duration]);
            
            doc.autoTable({
                startY: 65,
                head: [['Medicine', 'Dosage', 'Duration']],
                body: tableData,
            });
            
            doc.save(`Prescription-${rx.patientName}-${rx.date}.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Error generating prescription PDF');
        }
    };

    // -- MODULE: BILLING --
    const handleSaveInvoice = (e) => {
        e.preventDefault();
        const errors = validateForm('invoice', formData);
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }
        setFormErrors({});

        const newInv = {
            id: formData.id || Date.now(),
            date: new Date().toISOString().split('T')[0],
            status: 'Paid',
            ...formData
        };
        if (formData.id) {
            setInvoices(invoices.map(i => i.id === formData.id ? newInv : i));
        } else {
            setInvoices([newInv, ...invoices]);
        }
        setShowBillingForm(false);
        setFormData({});
    };

    // -- MODULE: INVENTORY --
    const handleSaveInventory = (e) => {
        e.preventDefault();
        if(formData.id) {
            setInventory(inventory.map(i => i.id === formData.id ? formData : i));
        } else {
            setInventory([...inventory, { ...formData, id: Date.now() }]);
        }
        setShowInventoryForm(false);
        setFormData({});
    };

    // -- DASHBOARD STATS --
    const stats = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        return {
            totalPatients: patients.length,
            todayAppointments: appointments.filter(a => a.date === today).length,
            revenue: invoices.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0),
            lowStock: inventory.filter(i => i.stock < 50).length,
            pendingAppointments: appointments.filter(a => a.status === 'Pending').length
        }
    }, [patients, appointments, invoices, inventory]);

    // -- RENDER HELPERS --
    const NavItem = ({ id, icon: Icon, label }) => (
        <button 
            onClick={() => { setView(id); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${view === id ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-blue-50 hover:text-blue-600'}`}
        >
            <Icon size={20} />
            <span className="font-medium">{label}</span>
        </button>
    );

    const AdminControls = ({ item, type }) => {
        if (currentUser.role !== 'Admin') return null;
        return (
            <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleEdit(item, type)} className="p-2 hover:bg-blue-50 text-blue-600 rounded" title="Edit">
                    <Edit size={16}/>
                </button>
                <button onClick={() => handleDelete(item.id, type)} className="p-2 hover:bg-red-50 text-red-600 rounded" title="Delete">
                    <Trash2 size={16}/>
                </button>
            </div>
        );
    };

    const FormField = ({ label, error, children }) => (
        <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
            {children}
            {error && <div className="text-red-500 text-xs mt-1">{error}</div>}
        </div>
    );

    if (!currentUser) return <Login onLogin={handleLogin} error={authError} />;

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
            {/* SIDEBAR */}
            <aside className={`fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200 z-50 transform transition-transform md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full border border-slate-200 p-1 flex-shrink-0">
                        <img src="./logo.jpg" className="w-full h-full object-contain rounded-full" alt="Logo"
                             onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                        <div className="hidden w-full h-full bg-blue-100 rounded-full items-center justify-center">
                            <Users size={20} className="text-blue-600" />
                        </div>
                    </div>
                    <div>
                        <h2 className="font-bold text-slate-800 text-sm leading-tight">Health+ & Aesthetic</h2>
                        <p className="text-xs text-slate-500">Clinic OS v2.1</p>
                    </div>
                </div>
                <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-140px)]">
                    <NavItem id="dashboard" icon={LayoutDashboard} label="Dashboard" />
                    <NavItem id="patients" icon={Users} label="Patients" />
                    <NavItem id="appointments" icon={Calendar} label="Appointments" />
                    <NavItem id="prescriptions" icon={FileText} label="Prescriptions" />
                    <NavItem id="billing" icon={CreditCard} label="Billing" />
                    <NavItem id="pharmacy" icon={Pill} label="Pharmacy" />
                    <NavItem id="lab" icon={TestTube} label="Laboratory" />
                    {currentUser.role === 'Admin' && <NavItem id="staff" icon={UserCog} label="Manage Staff" />}
                    <NavItem id="settings" icon={Settings} label="Settings" />
                </nav>
                <div className="absolute bottom-0 w-full p-4 border-t border-slate-100 bg-white">
                    <button onClick={() => setCurrentUser(null)} className="flex items-center gap-2 text-red-500 font-medium hover:bg-red-50 w-full p-2 rounded-lg transition">
                        <LogOut size={18} /> Logout
                    </button>
                </div>
            </aside>

            {/* MAIN AREA */}
            <div className="flex-1 flex flex-col md:pl-64 h-screen overflow-hidden">
                {/* HEADER */}
                <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 md:px-8">
                    <button onClick={() => setIsSidebarOpen(true)} className="md:hidden text-slate-500">
                        <Menu size={24}/>
                    </button>
                    <h1 className="text-xl font-bold text-slate-800 capitalize">
                        {view === 'staff' ? 'Manage Staff' : view}
                    </h1>
                    <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-bold text-slate-800">{currentUser.name}</p>
                            <p className="text-xs text-slate-500">{currentUser.role}</p>
                        </div>
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                            {currentUser.name?.[0] || 'U'}
                        </div>
                    </div>
                </header>

                {/* CONTENT SCROLLABLE */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    
                    {/* DASHBOARD */}
                    {view === 'dashboard' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-slate-500 text-sm font-medium">Total Patients</p>
                                            <h3 className="text-3xl font-bold text-slate-800 mt-1">{stats.totalPatients}</h3>
                                        </div>
                                        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Users size={24}/></div>
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-slate-500 text-sm font-medium">Today's Visits</p>
                                            <h3 className="text-3xl font-bold text-slate-800 mt-1">{stats.todayAppointments}</h3>
                                        </div>
                                        <div className="p-3 bg-purple-50 text-purple-600 rounded-lg"><Calendar size={24}/></div>
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-slate-500 text-sm font-medium">Total Revenue</p>
                                            <h3 className="text-3xl font-bold text-slate-800 mt-1">{formatCurrency(stats.revenue)}</h3>
                                        </div>
                                        <div className="p-3 bg-green-50 text-green-600 rounded-lg"><DollarSign size={24}/></div>
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-slate-500 text-sm font-medium">Low Stock Items</p>
                                            <h3 className="text-3xl font-bold text-red-600 mt-1">{stats.lowStock}</h3>
                                        </div>
                                        <div className="p-3 bg-red-50 text-red-600 rounded-lg"><AlertCircle size={24}/></div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Quick Actions */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                                <h3 className="font-bold text-slate-800 mb-4">Quick Actions</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <button onClick={() => { setFormData({}); setShowPatientForm(true); }} className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition">
                                        <Users size={24} className="text-blue-600 mb-2" />
                                        <span className="font-medium">New Patient</span>
                                    </button>
                                    <button onClick={() => { setFormData({ date: new Date().toISOString().split('T')[0] }); setShowAppointmentForm(true); }} className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition">
                                        <Calendar size={24} className="text-purple-600 mb-2" />
                                        <span className="font-medium">Book Appointment</span>
                                    </button>
                                    <button onClick={() => { setFormData({}); setShowPrescriptionForm(true); }} className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition">
                                        <FileText size={24} className="text-green-600 mb-2" />
                                        <span className="font-medium">Write Prescription</span>
                                    </button>
                                    <button onClick={() => setShowBillingForm(true)} className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition">
                                        <CreditCard size={24} className="text-orange-600 mb-2" />
                                        <span className="font-medium">Create Invoice</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STAFF MANAGEMENT */}
                    {view === 'staff' && currentUser.role === 'Admin' && (
                        <div className="space-y-6">
                            <div className="flex justify-end">
                                <button onClick={() => { setFormData({}); setShowUserForm(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2">
                                    <Plus size={20} /> Add New User
                                </button>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                {users.length === 0 ? (
                                    <div className="p-8 text-center text-slate-500">
                                        No staff members found. Add your first team member.
                                    </div>
                                ) : (
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50 text-slate-600 text-sm font-semibold border-b border-slate-200">
                                            <tr>
                                                <th className="p-4">Name</th>
                                                <th className="p-4">Username</th>
                                                <th className="p-4">Email</th>
                                                <th className="p-4">Role</th>
                                                <th className="p-4 text-center">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {users.map(u => (
                                                <tr key={u.id} className="hover:bg-slate-50">
                                                    <td className="p-4 font-medium">{u.name}</td>
                                                    <td className="p-4 text-slate-500">{u.username}</td>
                                                    <td className="p-4 text-slate-500">{u.email}</td>
                                                    <td className="p-4">
                                                        <span className={`px-2 py-1 rounded text-xs font-bold ${u.role === 'Admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                                            {u.role}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-center flex justify-center gap-2">
                                                        <button onClick={() => { setFormData(u); setShowUserForm(true); }} className="p-2 hover:bg-blue-50 text-blue-600 rounded">
                                                            <Edit size={16}/>
                                                        </button>
                                                        {u.id !== 1 && (
                                                            <button onClick={() => handleDeleteUser(u.id)} className="p-2 hover:bg-red-50 text-red-600 rounded">
                                                                <Trash2 size={16}/>
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    )}

                    {/* PATIENTS */}
                    {view === 'patients' && (
                        <div className="space-y-6">
                            <div className="flex flex-col sm:flex-row justify-between gap-4">
                                <div className="relative max-w-md w-full">
                                    <Search className="absolute left-3 top-3 text-slate-400" size={20} />
                                    <input 
                                        placeholder="Search MR# or Name..." 
                                        className="w-full pl-10 p-2.5 border rounded-lg outline-none focus:border-blue-500"
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <button onClick={() => { setFormData({}); setShowPatientForm(true); }} className="bg-blue-600 text-white px-4 py-2.5 rounded-lg font-medium flex items-center gap-2 hover:bg-blue-700 transition shadow-lg">
                                    <Plus size={20} /> New Patient
                                </button>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                {filteredPatients.length === 0 ? (
                                    <div className="p-8 text-center text-slate-500">
                                        {searchTerm ? 'No patients found matching your search.' : 'No patients registered yet.'}
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead className="bg-slate-50 text-slate-600 text-sm font-semibold border-b border-slate-200">
                                                <tr>
                                                    <th className="p-4">MR Number</th>
                                                    <th className="p-4">Name</th>
                                                    <th className="p-4">Age/Gender</th>
                                                    <th className="p-4">Contact</th>
                                                    <th className="p-4">Registered</th>
                                                    <th className="p-4 text-center">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {filteredPatients.map(p => (
                                                    <tr key={p.id} className="hover:bg-slate-50 group">
                                                        <td className="p-4 font-mono text-sm text-blue-600 font-bold">{p.mrNumber}</td>
                                                        <td className="p-4 font-medium">{p.name}</td>
                                                        <td className="p-4 text-slate-500">{p.age} / {p.gender}</td>
                                                        <td className="p-4 text-slate-500">{p.contact}</td>
                                                        <td className="p-4 text-slate-500 text-sm">
                                                            {p.registeredAt ? new Date(p.registeredAt).toLocaleDateString() : 'N/A'}
                                                        </td>
                                                        <td className="p-4 text-center">
                                                            <AdminControls item={p} type="patient" />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* APPOINTMENTS */}
                    {view === 'appointments' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="font-bold text-slate-700">Scheduled Visits</h3>
                                <button onClick={() => { setFormData({ date: new Date().toISOString().split('T')[0] }); setShowAppointmentForm(true); }} className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-purple-700 transition">
                                    <Plus size={20} /> Book Appointment
                                </button>
                            </div>
                            {appointments.length === 0 ? (
                                <div className="bg-white p-8 rounded-xl text-center text-slate-500">
                                    No appointments scheduled yet.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {appointments.map(a => (
                                        <div key={a.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center group">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-bold">Token #{a.token}</span>
                                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                                        a.status === 'Completed' ? 'bg-green-100 text-green-700' :
                                                        a.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                                                        'bg-yellow-100 text-yellow-700'
                                                    }`}>{a.status}</span>
                                                </div>
                                                <h4 className="font-bold text-slate-800">{a.patientName}</h4>
                                                <p className="text-sm text-slate-500">{a.doctor}</p>
                                                <p className="text-xs text-slate-400">{a.date} {a.time}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <AdminControls item={a} type="appointment" />
                                                <button title="WhatsApp Reminder" className="p-2 bg-green-50 text-green-600 rounded-full hover:bg-green-100">
                                                    <Share2 size={18}/>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* PRESCRIPTIONS */}
                    {view === 'prescriptions' && (
                        <div className="space-y-6">
                            <div className="flex justify-end">
                                <button onClick={() => { setFormData({}); setShowPrescriptionForm(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2">
                                    <FilePlus size={20} /> Write Prescription
                                </button>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                                {prescriptions.length === 0 ? (
                                    <div className="p-8 text-center text-slate-500">
                                        No prescriptions created yet.
                                    </div>
                                ) : (
                                    prescriptions.map(rx => (
                                        <div key={rx.id} className="p-4 border-b border-slate-100 flex justify-between items-center hover:bg-slate-50 group">
                                            <div>
                                                <h4 className="font-bold text-slate-800">{rx.patientName}</h4>
                                                <p className="text-sm text-slate-500">Dr. {rx.doctor} • {rx.date}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <AdminControls item={rx} type="prescription" />
                                                <button onClick={() => printPrescription(rx)} className="flex items-center gap-2 px-3 py-1.5 border rounded hover:bg-slate-100 text-sm">
                                                    <Printer size={16}/> Print PDF
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* PHARMACY */}
                    {view === 'pharmacy' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="font-bold text-slate-700">Medicine Inventory</h3>
                                <button onClick={() => { setFormData({}); setShowInventoryForm(true); }} className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2">
                                    <Plus size={20} /> Add Stock
                                </button>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                {inventory.length === 0 ? (
                                    <div className="p-8 text-center text-slate-500">
                                        No inventory items found.
                                    </div>
                                ) : (
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50 text-slate-600 text-sm font-semibold border-b border-slate-200">
                                            <tr>
                                                <th className="p-4">Medicine Name</th>
                                                <th className="p-4">Type</th>
                                                <th className="p-4">Stock</th>
                                                <th className="p-4">Price</th>
                                                <th className="p-4">Expiry</th>
                                                <th className="p-4 text-center">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {inventory.map(i => (
                                                <tr key={i.id} className="hover:bg-slate-50 group">
                                                    <td className="p-4 font-medium">{i.name}</td>
                                                    <td className="p-4 text-slate-500">{i.type}</td>
                                                    <td className={`p-4 font-bold ${i.stock < 50 ? 'text-red-600' : 'text-green-600'}`}>
                                                        {i.stock} units
                                                    </td>
                                                    <td className="p-4">{formatCurrency(i.price)}</td>
                                                    <td className="p-4 text-sm text-slate-500">{i.expiry || '2026-12-31'}</td>
                                                    <td className="p-4 text-center">
                                                        <AdminControls item={i} type="inventory" />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    )}

                    {/* BILLING */}
                    {view === 'billing' && (
                        <div className="space-y-6">
                            <div className="flex justify-end">
                                <button onClick={() => setShowBillingForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2">
                                    <CreditCard size={20} /> Create Invoice
                                </button>
                            </div>
                            <div className="grid gap-4">
                                {invoices.length === 0 ? (
                                    <div className="bg-white p-8 rounded-xl text-center text-slate-500">
                                        No invoices created yet.
                                    </div>
                                ) : (
                                    invoices.map(inv => (
                                        <div key={inv.id} className="bg-white p-4 rounded-lg border border-slate-200 flex justify-between items-center group">
                                            <div>
                                                <h4 className="font-bold">{inv.patientName}</h4>
                                                <p className="text-sm text-slate-500">{inv.items} • {inv.date}</p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <p className="font-bold text-lg text-blue-600">{formatCurrency(inv.total)}</p>
                                                    <span className={`text-xs px-2 py-0.5 rounded ${
                                                        inv.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                        {inv.status || 'Pending'}
                                                    </span>
                                                </div>
                                                <AdminControls item={inv} type="invoice" />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                </main>
            </div>

            {/* OVERLAY SIDEBAR MOBILE */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-40 md:hidden" 
                    onClick={() => setIsSidebarOpen(false)}
                ></div>
            )}

            {/* MODALS */}
            
            {/* USER FORM */}
            {showUserForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold">
                                {formData.id ? 'Edit User' : 'Add New User'}
                            </h3>
                            <button onClick={() => { setShowUserForm(false); setFormData({}); setFormErrors({}); }} className="text-slate-400">
                                <X size={24}/>
                            </button>
                        </div>
                        <form onSubmit={handleSaveUser} className="space-y-4">
                            <FormField label="Full Name" error={formErrors.name}>
                                <input 
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                                    value={formData.name || ''} 
                                    onChange={e => setFormData({...formData, name: e.target.value})} 
                                    placeholder="Full Name (e.g. Dr. Ali)" 
                                />
                            </FormField>
                            <FormField label="Username" error={formErrors.username}>
                                <input 
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                                    value={formData.username || ''} 
                                    onChange={e => setFormData({...formData, username: e.target.value})} 
                                    placeholder="Username" 
                                />
                            </FormField>
                            <FormField label="Email Address" error={formErrors.email}>
                                <input 
                                    type="email"
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                                    value={formData.email || ''} 
                                    onChange={e => setFormData({...formData, email: e.target.value})} 
                                    placeholder="Email Address" 
                                />
                            </FormField>
                            <FormField label="Password" error={formErrors.password}>
                                <input 
                                    type="password"
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                                    value={formData.password || ''} 
                                    onChange={e => setFormData({...formData, password: e.target.value})} 
                                    placeholder={formData.id ? 'Leave blank to keep current password' : 'Password'} 
                                />
                            </FormField>
                            <FormField label="Role">
                                <select 
                                    className="w-full p-3 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none" 
                                    value={formData.role || 'Staff'} 
                                    onChange={e => setFormData({...formData, role: e.target.value})}
                                >
                                    <option value="Admin">Admin</option>
                                    <option value="Doctor">Doctor</option>
                                    <option value="Pharmacist">Pharmacist</option>
                                    <option value="Staff">Staff</option>
                                </select>
                            </FormField>
                            <div className="flex justify-end pt-4 gap-3">
                                <button 
                                    type="button"
                                    onClick={() => { setShowUserForm(false); setFormData({}); setFormErrors({}); }} 
                                    className="px-6 py-2 border rounded-lg font-medium hover:bg-slate-50 transition"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition"
                                >
                                    {formData.id ? 'Update User' : 'Add User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* PATIENT FORM */}
            {showPatientForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold">
                                {formData.id ? 'Edit Patient' : 'Patient Registration'}
                            </h3>
                            <button onClick={() => { setShowPatientForm(false); setFormData({}); setFormErrors({}); }} className="text-slate-400">
                                <X size={24}/>
                            </button>
                        </div>
                        <form onSubmit={handleSavePatient} className="space-y-4">
                            <FormField label="Patient Full Name" error={formErrors.name}>
                                <input 
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                                    value={formData.name || ''} 
                                    onChange={e => setFormData({...formData, name: e.target.value})} 
                                    placeholder="Patient Full Name" 
                                />
                            </FormField>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField label="Age" error={formErrors.age}>
                                    <input 
                                        type="number" 
                                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                                        value={formData.age || ''} 
                                        onChange={e => setFormData({...formData, age: parseInt(e.target.value) || ''})} 
                                        placeholder="Age" 
                                        min="0"
                                        max="150"
                                    />
                                </FormField>
                                <FormField label="Gender">
                                    <select 
                                        className="w-full p-3 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none" 
                                        value={formData.gender || 'Male'} 
                                        onChange={e => setFormData({...formData, gender: e.target.value})}
                                    >
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </FormField>
                            </div>
                            <FormField label="Contact Number" error={formErrors.contact}>
                                <input 
                                    type="tel" 
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                                    value={formData.contact || ''} 
                                    onChange={e => setFormData({...formData, contact: e.target.value})} 
                                    placeholder="Contact Number" 
                                />
                            </FormField>
                            {formData.mrNumber && (
                                <FormField label="MR Number">
                                    <input 
                                        className="w-full p-3 border rounded-lg bg-slate-50" 
                                        value={formData.mrNumber} 
                                        readOnly 
                                    />
                                </FormField>
                            )}
                            <div className="flex justify-end pt-4 gap-3">
                                <button 
                                    type="button"
                                    onClick={() => { setShowPatientForm(false); setFormData({}); setFormErrors({}); }} 
                                    className="px-6 py-2 border rounded-lg font-medium hover:bg-slate-50 transition"
                                >
                                    Cancel
                                </button>
                                <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition">
                                    {formData.id ? 'Update Patient' : 'Save Record'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* APPOINTMENT FORM */}
            {showAppointmentForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold">Book Appointment</h3>
                            <button onClick={() => { setShowAppointmentForm(false); setFormData({}); setFormErrors({}); }} className="text-slate-400">
                                <X size={24}/>
                            </button>
                        </div>
                        <form onSubmit={handleSaveAppointment} className="space-y-4">
                            <FormField label="Patient" error={formErrors.patientName}>
                                <select 
                                    className="w-full p-3 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none" 
                                    value={formData.patientName || ''} 
                                    onChange={e => setFormData({...formData, patientName: e.target.value})}
                                >
                                    <option value="">Select Patient...</option>
                                    {patients.map(p => (
                                        <option key={p.id} value={p.name}>
                                            {p.name} ({p.mrNumber})
                                        </option>
                                    ))}
                                </select>
                            </FormField>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField label="Date" error={formErrors.date}>
                                    <input 
                                        type="date" 
                                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                                        value={formData.date || ''} 
                                        onChange={e => setFormData({...formData, date: e.target.value})} 
                                    />
                                </FormField>
                                <FormField label="Time">
                                    <input 
                                        type="time" 
                                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                                        value={formData.time || ''} 
                                        onChange={e => setFormData({...formData, time: e.target.value})} 
                                    />
                                </FormField>
                            </div>
                            <FormField label="Doctor" error={formErrors.doctor}>
                                <select 
                                    className="w-full p-3 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none" 
                                    value={formData.doctor || ''} 
                                    onChange={e => setFormData({...formData, doctor: e.target.value})}
                                >
                                    <option value="">Select Doctor...</option>
                                    <option value="Dr. Administrator">Dr. Administrator</option>
                                    <option value="Dr. Sarah Smith">Dr. Sarah Smith</option>
                                    <option value="Dr. John Doe">Dr. John Doe</option>
                                </select>
                            </FormField>
                            {formData.id && (
                                <FormField label="Status">
                                    <select 
                                        className="w-full p-3 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none" 
                                        value={formData.status || 'Pending'} 
                                        onChange={e => setFormData({...formData, status: e.target.value})}
                                    >
                                        <option value="Pending">Pending</option>
                                        <option value="Confirmed">Confirmed</option>
                                        <option value="Completed">Completed</option>
                                        <option value="Cancelled">Cancelled</option>
                                    </select>
                                </FormField>
                            )}
                            <div className="flex justify-end pt-4 gap-3">
                                <button 
                                    type="button"
                                    onClick={() => { setShowAppointmentForm(false); setFormData({}); setFormErrors({}); }} 
                                    className="px-6 py-2 border rounded-lg font-medium hover:bg-slate-50 transition"
                                >
                                    Cancel
                                </button>
                                <button className="bg-purple-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-purple-700 transition">
                                    {formData.id ? 'Update Appointment' : 'Book Token'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* BILLING FORM */}
            {showBillingForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold">Generate Invoice</h3>
                            <button onClick={() => { setShowBillingForm(false); setFormData({}); setFormErrors({}); }} className="text-slate-400">
                                <X size={24}/>
                            </button>
                        </div>
                        <form onSubmit={handleSaveInvoice} className="space-y-4">
                            <FormField label="Patient" error={formErrors.patientName}>
                                <select 
                                    className="w-full p-3 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none" 
                                    value={formData.patientName || ''} 
                                    onChange={e => setFormData({...formData, patientName: e.target.value})}
                                >
                                    <option value="">Select Patient...</option>
                                    {patients.map(p => (
                                        <option key={p.id} value={p.name}>{p.name}</option>
                                    ))}
                                </select>
                            </FormField>
                            <FormField label="Items/Description">
                                <input 
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                                    placeholder="Items (e.g. Consultation, Lab)" 
                                    value={formData.items || ''} 
                                    onChange={e => setFormData({...formData, items: e.target.value})} 
                                />
                            </FormField>
                            <FormField label="Total Amount" error={formErrors.total}>
                                <input 
                                    type="number" 
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                                    placeholder="Total Amount (Rs)" 
                                    value={formData.total || ''} 
                                    onChange={e => setFormData({...formData, total: parseFloat(e.target.value) || ''})} 
                                    min="0"
                                    step="0.01"
                                />
                            </FormField>
                            {formData.id && (
                                <FormField label="Status">
                                    <select 
                                        className="w-full p-3 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none" 
                                        value={formData.status || 'Paid'} 
                                        onChange={e => setFormData({...formData, status: e.target.value})}
                                    >
                                        <option value="Pending">Pending</option>
                                        <option value="Paid">Paid</option>
                                        <option value="Cancelled">Cancelled</option>
                                    </select>
                                </FormField>
                            )}
                            <div className="flex justify-end pt-4 gap-3">
                                <button 
                                    type="button"
                                    onClick={() => { setShowBillingForm(false); setFormData({}); setFormErrors({}); }} 
                                    className="px-6 py-2 border rounded-lg font-medium hover:bg-slate-50 transition"
                                >
                                    Cancel
                                </button>
                                <button className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-700 transition">
                                    {formData.id ? 'Update Invoice' : 'Generate Bill'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};

const root = createRoot(document.getElementById('root'));
root.render(<App />);
