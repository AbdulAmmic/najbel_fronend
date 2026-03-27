import {
    LayoutDashboard,
    Users,
    Calendar,
    FileText,
    Activity,
    Pill,
    Stethoscope,
    Settings,
    Shield,
    Bed,
    Layers,
    DollarSign,
    FileBarChart,
    HelpCircle,
    Database,
    Truck,
    Building,
    ClipboardList,
    UserPlus,
    Microscope,
    Scan,
    Archive,
    CreditCard,
    ShoppingCart,
    ShoppingBag,
    Box,
    UserCircle,
    Home,
    FlaskConical
} from "lucide-react";


export type SidebarItem = {
    icon: any;
    label: string;
    path: string;
    badge?: number;
    subItems?: { label: string; path: string }[];
};

const COMMON_ITEMS: SidebarItem[] = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
];

export const ROLE_NAVIGATION: Record<string, SidebarItem[]> = {
    "super_admin": [
        { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard/super-admin" },
        { icon: Building, label: "Hospitals", path: "/dashboard/admin/hospitals" },
        { icon: CreditCard, label: "Subscriptions", path: "/dashboard/admin/subscriptions" },
        { icon: Box, label: "Modules", path: "/dashboard/admin/modules" },
        { icon: Users, label: "Global Users", path: "/dashboard/admin/users" },
        { icon: Database, label: "Backups", path: "/dashboard/admin/backups" },
        { icon: Settings, label: "Settings", path: "/dashboard/settings" },
    ],
    "admin": [ // Hospital Admin
        { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard/admin" },
        { icon: Users, label: "User Management", path: "/dashboard/admin/users" },
        { icon: Calendar, label: "Appointments", path: "/dashboard/schedule/appointments" },
        {
            icon: DollarSign,
            label: "Billing & Finance",
            path: "/dashboard/billing",
            subItems: [
                { label: "Overview", path: "/dashboard/billing" },
                { label: "Invoices", path: "/dashboard/billing/invoices" }
            ]
        },
        { icon: ShoppingBag, label: "Pharmacy Orders", path: "/dashboard/pharmacy/orders" },
        { 
            icon: Building, 
            label: "Facility Management", 
            path: "/dashboard/admin/management",
            subItems: [
                { label: "Departments", path: "/dashboard/admin/management?tab=departments" },
                { label: "Wards", path: "/dashboard/admin/management?tab=wards" },
                { label: "Rooms", path: "/dashboard/admin/management?tab=rooms" },
                { label: "Beds", path: "/dashboard/admin/management?tab=beds" }
            ]
        },
        { icon: Box, label: "Inventory", path: "/dashboard/inventory" },
        { icon: FileBarChart, label: "Reports", path: "/dashboard/reports" },
        {
            icon: FlaskConical,
            label: "Laboratory",
            path: "/dashboard/laboratory/lab-tests",
            subItems: [
                { label: "Lab Test Catalog", path: "/dashboard/laboratory/lab-tests" },
                { label: "Lab Requests",     path: "/dashboard/laboratory/requests" },
                { label: "Lab Reports",      path: "/dashboard/laboratory/reports" },
            ]
        },
        { icon: Settings, label: "Settings", path: "/dashboard/settings" },
    ],
    "doctor": [
        { icon: LayoutDashboard, label: "Doctor Console", path: "/dashboard/Doctor" },
        { icon: Calendar, label: "My Appointments", path: "/dashboard/Doctor/appointments" },
        { icon: Users, label: "My Patients", path: "/dashboard/Doctor/patients" },
        { icon: Users, label: "Patient Queue", path: "/dashboard/Doctor/queue" },
        { icon: Stethoscope, label: "Consultations", path: "/dashboard/consultations" },
        { icon: FileText, label: "EMR / Records", path: "/dashboard/records" },
        { icon: Pill, label: "Prescriptions", path: "/dashboard/Doctor/prescriptions" },
        { icon: Microscope, label: "Lab Requests", path: "/dashboard/laboratory/requests" },
        { icon: Scan, label: "Radiology", path: "/dashboard/radiology/requests" },
        { icon: Activity, label: "Telemedicine", path: "/dashboard/telemedicine" },
    ],
    "nurse": [ // Nurse
        { icon: LayoutDashboard, label: "Station Dashboard", path: "/dashboard/nurse" },
        { icon: Users, label: "Patient Queue", path: "/dashboard/nurse/queue" },
        { icon: Activity, label: "Vitals", path: "/dashboard/vitals" },
        { icon: ClipboardList, label: "Nursing Notes", path: "/dashboard/nurse/notes" },
        { icon: Bed, label: "Ward Management", path: "/dashboard/beds" },
        { icon: Pill, label: "Medication", path: "/dashboard/nurse/medications" },
    ],
    "receptionist": [ // Front Desk
        { icon: LayoutDashboard, label: "Front Desk", path: "/dashboard/reception" },
        { icon: UserPlus, label: "Register Patient", path: "/dashboard/reception/register" },
        { icon: Users, label: "Patient List", path: "/dashboard/patients" },
        { icon: Calendar, label: "Appointments", path: "/dashboard/schedule" },
        { icon: Layers, label: "Queue", path: "/dashboard/reception/queue" },
        { icon: DollarSign, label: "Billing (Basic)", path: "/dashboard/billing/pos" },
    ],
    "lab_tech": [ // Laboratory
        { icon: Microscope, label: "Lab Dashboard", path: "/dashboard/laboratory" },
        { icon: ClipboardList, label: "Test Requests", path: "/dashboard/laboratory/requests" },
        { icon: Activity, label: "Results Entry", path: "/dashboard/laboratory/results" },
        { icon: FileText, label: "Reports", path: "/dashboard/laboratory/reports" },
    ],
    "radiologist": [ // Radiology
        { icon: Scan, label: "Ris Dashboard", path: "/dashboard/radiology" },
        { icon: ClipboardList, label: "Imaging Requests", path: "/dashboard/radiology/requests" },
        { icon: FileText, label: "Reports", path: "/dashboard/radiology/reports" },
        { icon: Archive, label: "Archive", path: "/dashboard/radiology/archive" },
    ],
    "pharmacist": [ // Pharmacy
        { icon: Pill, label: "Pharmacy Dash", path: "/dashboard/pharmacy" },
        { icon: ShoppingBag, label: "Order Fulfilment", path: "/dashboard/pharmacy/orders" },
        { icon: FileText, label: "Prescriptions", path: "/dashboard/pharmacy/prescriptions" },
        { icon: Box, label: "Drug Inventory", path: "/dashboard/pharmacy/inventory" },
        { icon: ShoppingCart, label: "Dispensing", path: "/dashboard/pharmacy/dispense" },
        { icon: Truck, label: "Suppliers", path: "/dashboard/pharmacy/suppliers" },
    ],
    "accountant": [ // Finance
        { icon: DollarSign, label: "Finance Dash", path: "/dashboard/billing" },
        { icon: FileText, label: "Invoice Ledger", path: "/dashboard/billing/invoices" },
        { icon: Shield, label: "HMO Claims", path: "/dashboard/billing/insurance" },
        { icon: FileBarChart, label: "Financial Reports", path: "/dashboard/billing/reports" },
    ],
    "store_officer": [ // Inventory
        { icon: Box, label: "Inventory Dash", path: "/dashboard/inventory" },
        { icon: Layers, label: "Stock Items", path: "/dashboard/inventory/items" },
        { icon: ShoppingCart, label: "Procurement", path: "/dashboard/inventory/procurement" },
        { icon: Truck, label: "Suppliers", path: "/dashboard/inventory/suppliers" },
    ],
    "patient": [ // Patient Portal
        { icon: Home, label: "My Health", path: "/dashboard/patient" },
        { icon: Calendar, label: "Appointments", path: "/dashboard/patient/appointments" },
        { icon: FileText, label: "Medical Records", path: "/dashboard/patient/records" },
        { icon: Pill, label: "Prescriptions", path: "/dashboard/patient/medications" },
        { icon: DollarSign, label: "Billing", path: "/dashboard/patient/billing" },
    ]
};

export const BOTTOM_ITEMS: SidebarItem[] = [
    { icon: Settings, label: "Settings", path: "/dashboard/settings" },
    { icon: HelpCircle, label: "Help & Support", path: "/dashboard/help" }
];
