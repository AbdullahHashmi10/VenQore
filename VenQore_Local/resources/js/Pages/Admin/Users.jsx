import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import { Head, useForm, router, usePage } from '@inertiajs/react'; // usePage added
import MidnightNebula from '@/Components/MidnightNebula';
import {
    Users,
    Plus,
    Search,
    Edit3,
    Trash2,
    Shield,
    Mail,
    Clock,
    CheckCircle,
    XCircle,
    UserPlus,
    X,
    Check,
    ShoppingCart,
    Package,
    BarChart2,
    DollarSign,
    Settings,
    FileText,
    Truck,
    UserCheck,
    Eye,
    Lock,
    Crown,
    Star,
    LogIn,
    LogOut,
    Calendar,
    ChevronRight,
    Timer,
    Activity,
    User,
    BadgeCheck,
    Zap
} from 'lucide-react';

// Pre-defined roles with their permissions
const ROLES = {
    platform_admin: {
        name: 'Platform Owner',
        description: 'Full system access',
        icon: Crown,
        color: 'from-amber-400 to-orange-600',
        badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
        permissions: ['all']
    },
    admin: {
        name: 'Admin',
        description: 'Management access',
        icon: Shield,
        color: 'from-violet-500 to-purple-600',
        badgeColor: 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400',
        permissions: ['pos', 'sales', 'inventory', 'purchases', 'customers', 'reports', 'finance', 'users', 'settings', 'audit', 'discounts']
    },
    manager: {
        name: 'Manager',
        description: 'Operations manager',
        icon: Star,
        color: 'from-blue-500 to-cyan-600',
        badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
        permissions: ['pos', 'sales', 'inventory', 'purchases', 'customers', 'reports', 'finance', 'discounts']
    },
    cashier: {
        name: 'Cashier',
        description: 'POS & Sales only',
        icon: ShoppingCart,
        color: 'from-emerald-500 to-teal-600',
        badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
        permissions: ['pos', 'sales', 'customers', 'discounts']
    },
    inventory_staff: {
        name: 'Inventory Staff',
        description: 'Stock management',
        icon: Package,
        color: 'from-orange-500 to-red-600',
        badgeColor: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400',
        permissions: ['inventory', 'purchases']
    },
    accountant: {
        name: 'Accountant',
        description: 'Financial reporting',
        icon: DollarSign,
        color: 'from-green-500 to-emerald-600',
        badgeColor: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400',
        permissions: ['reports', 'finance', 'sales_view']
    },
    support: {
        name: 'Support Specialist',
        description: 'Troubleshooting & Help',
        icon: BadgeCheck,
        color: 'from-pink-500 to-rose-600',
        badgeColor: 'bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-400',
        permissions: ['customers', 'sales_view', 'settings']
    },
    custom: {
        name: 'Custom Role',
        description: 'Specific permissions',
        icon: Settings,
        color: 'from-slate-500 to-slate-600',
        badgeColor: 'bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-400',
        permissions: []
    }
};

// Available permissions/modules
const PERMISSIONS = {
    pos: { name: 'POS Terminal', description: 'Access point of sale', icon: ShoppingCart },
    sales: { name: 'Sales Management', description: 'View sales & invoices', icon: FileText },
    sales_view: { name: 'View Sales Only', description: 'Read-only sales access', icon: Eye },
    inventory: { name: 'Inventory', description: 'Product & stock management', icon: Package },
    purchases: { name: 'Purchasing', description: 'Supplier & PO management', icon: Truck },
    customers: { name: 'CRM', description: 'Customer management', icon: Users },
    reports: { name: 'Reports', description: 'Business analytics', icon: BarChart2 },
    finance: { name: 'Accounting', description: 'Financial statements', icon: DollarSign },
    audit: { name: 'Audit Logs', description: 'View system logs', icon: Activity },
    discounts: { name: 'Discounts', description: 'Manage promotions', icon: Zap },
    users: { name: 'Team Access', description: 'Manage users & roles', icon: UserCheck },
    settings: { name: 'Settings', description: 'System configuration', icon: Settings }
};

export default function AdminUsers({ users = [], attendance = [] }) {
    const { store } = usePage().props;
    const [activeTab, setActiveTab] = useState('users');
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [selectedRole, setSelectedRole] = useState('cashier');
    const [customPermissions, setCustomPermissions] = useState([]);
    const [selectedAttendanceUser, setSelectedAttendanceUser] = useState(null);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: '', email: '', password: '', passcode: '', role: 'cashier', permissions: [],
    });

    const filteredUsers = useMemo(() => users.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    ), [users, searchQuery]);

    // Handlers
    const handleRoleChange = (role) => {
        setSelectedRole(role);
        setData('role', role);
        if (role !== 'custom') {
            setCustomPermissions([]);
            setData('permissions', ROLES[role].permissions);
        }
    };

    const togglePermission = (perm) => {
        const newPerms = customPermissions.includes(perm)
            ? customPermissions.filter(p => p !== perm)
            : [...customPermissions, perm];
        setCustomPermissions(newPerms);
        setData('permissions', newPerms);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingUser) {
            put(route('store.admin.users.update', { store_slug: store?.slug, user: editingUser.id }), {
                onSuccess: () => closeModal()
            });
        } else {
            post(route('store.admin.users.store', { store_slug: store?.slug }), {
                onSuccess: () => closeModal()
            });
        }
    };

    const handleEdit = (user) => {
        setEditingUser(user);
        setSelectedRole(user.role || 'cashier');
        setCustomPermissions(user.permissions || []);
        setData({
            name: user.name,
            email: user.email,
            password: '',
            passcode: user.passcode || '',
            role: user.role || 'cashier',
            permissions: user.permissions || []
        });
        setShowAddModal(true);
    };

    const handleDelete = (user) => { setUserToDelete(user); setShowDeleteModal(true); };
    const confirmDelete = () => {
        if (userToDelete) {
            router.delete(route('store.admin.users.destroy', { store_slug: store?.slug, user: userToDelete.id }), {
                onSuccess: () => { setShowDeleteModal(false); setUserToDelete(null); }
            });
        }
    };
    const closeModal = () => { setShowAddModal(false); setEditingUser(null); setSelectedRole('cashier'); setCustomPermissions([]); reset(); };
    const getRoleInfo = (role) => ROLES[role] || ROLES.cashier;
    const formatDate = (date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    return (
        <OneGlanceLayout title="Team & Access Control" mode="admin">
            <Head title="Team Management" />

            <div className="h-full flex flex-col gap-6 max-w-[1600px] mx-auto">

                {/* Header & Controls */}
                <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 shrink-0">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <Users className="text-indigo-500" />
                            Team Management
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Manage user roles, access, and monitor activity</p>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64 group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
                            />
                        </div>

                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0">
                            {[{ id: 'users', icon: Users, label: 'Members' }, { id: 'attendance', icon: Clock, label: 'Attendance' }].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${activeTab === tab.id
                                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                        }`}
                                >
                                    <tab.icon size={14} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {activeTab === 'users' && (
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95"
                            >
                                <Plus size={18} />
                                <span className="hidden sm:inline">Add Member</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
                    <StatCard
                        title="Total Members"
                        value={users.length}
                        icon={<Users size={20} className="text-white" />}
                        color="bg-indigo-500"
                    />
                    <StatCard
                        title="Active Now"
                        value={Math.floor(users.length * 0.8)} // Mock active count
                        icon={<Zap size={20} className="text-white" />}
                        color="bg-emerald-500"
                        subtext="Simulated Activity"
                    />
                    <StatCard
                        title="Admins"
                        value={users.filter(u => u.role === 'admin' || u.role === 'platform_admin').length}
                        icon={<Crown size={20} className="text-white" />}
                        color="bg-amber-500"
                    />
                    <StatCard
                        title="Cashiers"
                        value={users.filter(u => u.role === 'cashier').length}
                        icon={<ShoppingCart size={20} className="text-white" />}
                        color="bg-rose-500"
                    />
                </div>

                {/* Main Content Area */}
                {activeTab === 'users' ? (
                    <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-0">
                        <div className="flex-1 overflow-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 dark:bg-slate-800/50 sticky top-0 z-10 backdrop-blur-md">
                                    <tr className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                                        <th className="px-6 py-4">Staff Member</th>
                                        <th className="px-6 py-4">Role & Access</th>
                                        <th className="px-6 py-4">Contact</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Joined</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {filteredUsers.length > 0 ? filteredUsers.map((user) => {
                                        const role = getRoleInfo(user.role);
                                        const RoleIcon = role.icon;
                                        return (
                                            <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${role.color} flex items-center justify-center text-white font-bold shadow-md ring-2 ring-white dark:ring-slate-800`}>
                                                            {user.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{user.name}</p>
                                                            <p className="text-xs text-slate-400 font-mono">ID: {String(user.id).substring(0, 8)}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col items-start gap-1">
                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${role.badgeColor}`}>
                                                            <RoleIcon size={10} />
                                                            {role.name}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 pl-1">
                                                            {role.permissions.includes('all') ? 'Full Access' : `${role.permissions.length} Permissions`}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                                        <Mail size={14} className="text-slate-300" />
                                                        {user.email}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium border border-emerald-100 dark:border-emerald-500/20">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                                        Active
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-500">
                                                    {formatDate(user.created_at)}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => handleEdit(user)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors" title="Edit User">
                                                            <Edit3 size={16} />
                                                        </button>
                                                        {user.role !== 'platform_admin' && (
                                                            <button onClick={() => handleDelete(user)} className="p-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg text-slate-400 hover:text-rose-600 transition-colors" title="Delete User">
                                                                <Trash2 size={16} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    }) : (
                                        <tr>
                                            <td colSpan="6" className="py-20 text-center">
                                                <div className="flex flex-col items-center justify-center text-slate-400 opacity-60">
                                                    <Search size={48} className="mb-4 stroke-1" />
                                                    <p className="text-lg font-medium">No members found</p>
                                                    <p className="text-sm">Try adjusting your search query</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    /* ATTENDANCE TAB (Re-styled) */
                    <div className="flex-1 flex gap-6 min-h-0">
                        {/* Sidebar List */}
                        <div className="w-80 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden shrink-0">
                            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                                <h3 className="font-bold text-slate-700 dark:text-slate-200">Staff List</h3>
                                <p className="text-xs text-slate-500">Select to view logs</p>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                {filteredUsers.map((user) => {
                                    const roleInfo = getRoleInfo(user.role);
                                    const isActive = selectedAttendanceUser?.id === user.id;
                                    return (
                                        <button
                                            key={user.id}
                                            onClick={() => setSelectedAttendanceUser(user)}
                                            className={`w-full flex items-center gap-3 p-3 transition-all border-b border-slate-50 dark:border-slate-800 last:border-0 ${isActive
                                                ? 'bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-l-indigo-500 pl-2'
                                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border-l-4 border-l-transparent pl-2'
                                                }`}
                                        >
                                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${roleInfo.color} flex items-center justify-center text-white font-bold text-xs shadow-sm`}>
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0 text-left">
                                                <p className={`font-semibold text-sm truncate ${isActive ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}>{user.name}</p>
                                                <p className="text-[10px] text-slate-400 truncate uppercase">{roleInfo.name}</p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Details View */}
                        <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden relative">
                            {selectedAttendanceUser ? (
                                <div className="flex flex-col h-full">
                                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${getRoleInfo(selectedAttendanceUser.role).color} flex items-center justify-center text-white font-bold text-2xl shadow-lg`}>
                                                {selectedAttendanceUser.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{selectedAttendanceUser.name}</h2>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-sm text-slate-500">{selectedAttendanceUser.email}</span>
                                                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                    <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold uppercase bg-emerald-100 dark:bg-emerald-500/20 px-2 py-0.5 rounded-full">
                                                        <Activity size={10} /> Active
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Attendance content placeholder */}
                                    <div className="flex-1 p-8 flex flex-col items-center justify-center text-slate-400 opacity-50">
                                        <Calendar size={64} className="mb-4 stroke-1" />
                                        <p>Attendance Logs would appear here...</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-slate-300 dark:text-slate-600">
                                    <UserCheck size={80} className="mb-6 stroke-[0.5]" />
                                    <h3 className="text-lg font-medium">Select a team member</h3>
                                    <p className="text-sm">View attendance records and logs</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

            </div>

            {/* Add/Edit Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-[90rem] border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-300 flex flex-col max-h-[95vh]">

                        {/* Header - Spacious */}
                        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/80 dark:bg-slate-900/50 backdrop-blur-xl shrink-0">
                            <div className="flex items-center gap-4">
                                <h3 className="font-black text-2xl text-slate-800 dark:text-white tracking-tight">
                                    {editingUser ? 'Edit Member' : 'New Member'}
                                </h3>
                                <span className="h-6 w-px bg-slate-300 dark:bg-slate-700 mx-1"></span>
                                <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                                    {editingUser ? 'Update Details' : 'Onboard Staff'}
                                </span>
                            </div>
                            <button onClick={closeModal} className="p-3 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-400 hover:text-red-500"><X size={24} /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 grid grid-cols-12 gap-8 h-full overflow-hidden">

                            {/* Left Col: User Info & Roles (Width: 5/12) */}
                            <div className="col-span-12 lg:col-span-5 flex flex-col gap-8 h-full overflow-y-auto custom-scrollbar pr-2">

                                {/* 1. Personal Details - Spacious 2x2 Grid */}
                                <div className="bg-slate-50 dark:bg-slate-950/30 p-6 rounded-3xl border border-slate-100 dark:border-slate-800/50">
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                                        <User size={14} /> Credentials
                                    </h4>
                                    <div className="grid grid-cols-2 gap-5">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase block pl-1">Name</label>
                                            <input type="text" value={data.name} onChange={e => setData('name', e.target.value)}
                                                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                                                placeholder="Full Name" required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase block pl-1">Email</label>
                                            <input type="email" value={data.email} onChange={e => setData('email', e.target.value)}
                                                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                                                placeholder="Email Address" required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase block pl-1">Password</label>
                                            <input type="password" value={data.password} onChange={e => setData('password', e.target.value)}
                                                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                                                placeholder={editingUser ? "Unchanged" : "Required"} required={!editingUser}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase block pl-1">Passcode</label>
                                            <input type="text" value={data.passcode} onChange={e => setData('passcode', e.target.value)} maxLength={6}
                                                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold font-mono tracking-widest focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-center"
                                                placeholder="PIN"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* 2. Role Selection - Spacious Grid */}
                                <div className="flex-1 flex flex-col min-h-0">
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center justify-between">
                                        <span className="flex items-center gap-2"><Crown size={14} /> Assign Role</span>
                                        <span className="text-indigo-500 text-sm">{ROLES[selectedRole].name}</span>
                                    </h4>

                                    <div className="grid grid-cols-2 gap-3 flex-1 content-start">
                                        {Object.entries(ROLES).map(([key, role]) => (
                                            <label key={key} className={`flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${selectedRole === key
                                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-500/20 transform scale-[1.02]'
                                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-400 opacity-90 hover:opacity-100 hover:shadow-md'
                                                }`}>
                                                <input type="radio" name="role" value={key} checked={selectedRole === key} onChange={e => handleRoleChange(e.target.value)} className="sr-only" />
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedRole === key ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800'} shrink-0`}>
                                                    <role.icon size={18} className={selectedRole === key ? 'text-white' : 'text-slate-500'} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold truncate leading-tight">{role.name}</p>
                                                    <p className={`text-[10px] truncate opacity-80 mt-0.5 ${selectedRole === key ? 'text-indigo-100' : 'text-slate-400'}`}>{role.description}</p>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Right Col: Permissions (Width: 7/12) */}
                            <div className="col-span-12 lg:col-span-7 flex flex-col h-full overflow-hidden">
                                <div className="flex items-center justify-between mb-5 shrink-0">
                                    <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                        <Shield size={14} /> Access Permissions
                                    </h4>
                                    {selectedRole !== 'custom' && (
                                        <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg">
                                            <Lock size={12} /> Read-only preset
                                        </span>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 flex-1 overflow-y-auto custom-scrollbar content-start pr-2">
                                    {Object.entries(PERMISSIONS).map(([key, perm]) => {
                                        const isChecked = data.permissions.includes(key) || data.permissions.includes('all');
                                        const isDisabled = selectedRole !== 'custom';

                                        return (
                                            <div key={key}
                                                onClick={() => !isDisabled && togglePermission(key)}
                                                className={`relative p-4 rounded-2xl border transition-all duration-200 select-none group h-[88px] flex flex-col justify-center ${isDisabled ? 'cursor-default' : 'cursor-pointer active:scale-95'
                                                    } ${isChecked
                                                        ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500/50 dark:border-emerald-500/30'
                                                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                                                    }`}
                                            >
                                                <div className="flex items-start gap-4">
                                                    <div className={`p-2.5 rounded-xl shrink-0 transition-colors ${isChecked ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                                        <perm.icon size={20} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-start">
                                                            <p className={`text-sm font-bold truncate ${isChecked ? 'text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-500'}`}>{perm.name}</p>
                                                            {isChecked && selectedRole === 'custom' && <Check size={16} className="text-emerald-500 shrink-0 ml-2" />}
                                                        </div>
                                                        <p className="text-[11px] text-slate-400 leading-snug mt-1 line-clamp-2">{perm.description}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                                    <p className="text-xs text-slate-400 font-medium">
                                        <span className="text-indigo-500 font-bold">{data.permissions.includes('all') ? 'Full System Access' : `${data.permissions.length} Modules`}</span> granted
                                    </p>
                                    <div className="flex gap-4">
                                        <button type="button" onClick={closeModal} className="px-6 py-3 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-sm font-bold transition-colors">
                                            Cancel
                                        </button>
                                        <button type="submit" className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-xl shadow-indigo-500/20 transform active:scale-95 transition-all flex items-center gap-2">
                                            <CheckCircle size={18} />
                                            {editingUser ? 'Update Member' : 'Save Member'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center border border-slate-200 dark:border-slate-800">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600"><Trash2 size={24} /></div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Delete Member?</h3>
                        <p className="text-sm text-slate-500 mb-6">Are you sure you want to delete <strong>{userToDelete?.name}</strong>? This cannot be undone.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl font-bold text-sm">Cancel</button>
                            <button onClick={confirmDelete} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-red-500/20">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </OneGlanceLayout>
    );
}

// --- Helper Component ---
function StatCard({ title, value, icon, color, isCurrency = false, subtext }) {
    return (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
            <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{title}</p>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white">
                    {value || 0}
                </h3>
                {subtext && <p className="text-[10px] text-slate-400 mt-1">{subtext}</p>}
            </div>
            <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform`}>
                {icon}
            </div>
        </div>
    );
}
