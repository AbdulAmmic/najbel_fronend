import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';

const getBaseUrl = () => {
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        // Connect directly to the backend port 8000 to avoid common proxy/rewrite header stripping issues in dev
        return `http://${hostname}:8000/api/v1`;
    }
    return 'http://localhost:8000/api/v1';
};

const API_URL = getBaseUrl();

const api: AxiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add interceptor for JWT
api.interceptors.request.use(
    (config: any) => {
        // Skip token for login
        if (config.url?.includes('auth/login')) {
            return config;
        }

        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token.trim()}`;
        } else if (typeof window !== 'undefined' && !config.url?.includes('auth/login')) {
            console.warn(`API: No token found for request to: ${config.url}`);
        }
        return config;
    },
    (error: AxiosError) => {
        return Promise.reject(error);
    }
);

export const auth = {
    login: async (email: string, password: string) => {
        const params = new URLSearchParams();
        params.append('username', email);
        params.append('password', password);
        const response = await api.post('auth/login', params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        return response.data;
    },
    register: async (userData: any) => {
        const response = await api.post('users/', userData);
        return response.data;
    },
    getMe: async () => {
        const response = await api.get('users/me');
        return response.data;
    },
    forgotPassword: async (email: string) => {
        const response = await api.post('auth/forgot-password', { email });
        return response.data;
    },
    verifyOtp: async (email: string, otp: string) => {
        const response = await api.post('auth/verify-otp', { email, otp });
        return response.data;
    },
    resetPassword: async (email: string, otp: string, new_password: string) => {
        const response = await api.post('auth/reset-password', { email, otp, new_password });
        return response.data;
    }
};

export const patientService = {
    getAll: async () => {
        const response = await api.get('patients/');
        return response.data;
    },
    getById: async (id: number) => {
        const response = await api.get(`patients/${id}`);
        return response.data;
    }
};

export const users = {
    getAll: async () => {
        const response = await api.get('users/');
        return response.data;
    },
    updatePin: async (pin: string) => {
        const response = await api.put('users/me/pin', { pin });
        return response.data;
    },
    getById: async (id: number) => {
        const response = await api.get(`users/${id}`);
        return response.data;
    },
    update: async (id: number, data: any) => {
        const response = await api.put(`users/${id}`, data);
        return response.data;
    },
    delete: async (id: number) => {
        const response = await api.delete(`users/${id}`);
        return response.data;
    }
};

export const appointments = {
    getAll: async () => {
        const response = await api.get('appointments/my-appointments');
        return response.data;
    },
    create: async (data: any) => {
        const response = await api.post('appointments/', data);
        return response.data;
    },
    update: async (id: number, data: any) => {
        const response = await api.put(`appointments/${id}/`, data);
        return response.data;
    },
    getById: async (id: number) => {
        const response = await api.get(`appointments/${id}/`);
        return response.data;
    },
    updateStatus: async (id: number, status: string) => {
        const response = await api.put(`appointments/${id}/`, { status });
        return response.data;
    },
    reschedule: async (id: number, data: { new_time: string, note: string }) => {
        const response = await api.post(`appointments/${id}/reschedule`, data);
        return response.data;
    },
    cancel: async (id: number, data: { note: string }) => {
        const response = await api.post(`appointments/${id}/cancel`, data);
        return response.data;
    },
    confirm: async (id: number, data: { note: string }) => {
        const response = await api.post(`appointments/${id}/confirm`, data);
        return response.data;
    },
    acceptReschedule: async (id: number) => {
        const response = await api.post(`appointments/${id}/accept-reschedule`);
        return response.data;
    }
};

export const attendance = {
    checkIn: async () => {
        const response = await api.post('attendance/check-in/');
        return response.data;
    },
    checkOut: async () => {
        const response = await api.post('attendance/check-out/');
        return response.data;
    },
    getHistory: async () => {
        const response = await api.get('attendance/my-history/');
        return response.data;
    }
}

export const dashboard = {
    getStats: async () => {
        const response = await api.get('dashboard/stats');
        return response.data;
    },
    getAlerts: async () => {
        const response = await api.get('alerts/');
        return response.data;
    }
}

export const vitals = {
    getAll: async () => {
        const response = await api.get('vitals/');
        return response.data;
    },
    create: async (data: any) => {
        const response = await api.post('vitals/', data);
        return response.data;
    }
}

export const prescriptions = {
    getAll: async () => {
        const response = await api.get('prescriptions/');
        return response.data;
    },
    getById: async (id: number) => {
        const response = await api.get(`prescriptions/${id}/`);
        return response.data;
    },
    create: async (data: any) => {
        const response = await api.post('prescriptions/', data);
        return response.data;
    },
    update: async (id: number, data: any) => {
        const response = await api.put(`prescriptions/${id}/`, data);
        return response.data;
    }
}

export const consultations = {
    getById: async (id: number) => {
        const response = await api.get(`consultations/${id}/`);
        return response.data;
    },
    getByAppointment: async (appointmentId: number) => {
        const response = await api.get(`consultations/appointment/${appointmentId}/`);
        return response.data;
    },
    getMyHistory: async () => {
        const response = await api.get('consultations/history/my/');
        return response.data;
    },
    create: async (data: any) => {
        const response = await api.post('consultations/', data);
        return response.data;
    }
}

export const medicalRecords = {
    getAll: async () => {
        const response = await api.get('medical-records/');
        return response.data;
    },
    getById: async (id: number) => {
        const response = await api.get(`medical-records/${id}/`);
        return response.data;
    },
    create: async (data: any) => {
        const response = await api.post('medical-records/', data);
        return response.data;
    }
}

export const radiology = {
    getAll: async () => {
        const response = await api.get('radiology/');
        return response.data;
    },
    getById: async (id: number) => {
        const response = await api.get(`radiology/${id}/`);
        return response.data;
    }
}

export const referrals = {
    getAll: async () => {
        const response = await api.get('referrals/');
        return response.data;
    },
    getMyHistory: async () => {
        const response = await api.get('referrals/my-history/');
        return response.data;
    },
    create: async (data: any) => {
        const response = await api.post('referrals/', data);
        return response.data;
    }
}

export const departments = {
    getAll: async () => {
        const response = await api.get('departments/');
        return response.data;
    },
    create: async (data: any) => {
        const response = await api.post('departments/', data);
        return response.data;
    },
    update: async (id: number, data: any) => {
        const response = await api.put(`departments/${id}`, data);
        return response.data;
    },
    delete: async (id: number) => {
        const response = await api.delete(`departments/${id}`);
        return response.data;
    }
}

export const rooms = {
    getAll: async () => {
        const response = await api.get('rooms/');
        return response.data;
    },
    create: async (data: any) => {
        const response = await api.post('rooms/', data);
        return response.data;
    },
    update: async (id: number, data: any) => {
        const response = await api.put(`rooms/${id}`, data);
        return response.data;
    },
    delete: async (id: number) => {
        const response = await api.delete(`rooms/${id}`);
        return response.data;
    }
}

export const chat = {
    getHistory: async (consultationId: number) => {
        const response = await api.get(`chat/chats/history/${consultationId}/`);
        return response.data;
    }
}

export const notifications = {
    getAll: async () => {
        const response = await api.get('notifications/');
        return response.data;
    },
    markAsRead: async (id: number) => {
        const response = await api.put(`notifications/${id}/read/`);
        return response.data;
    },
    markAllAsRead: async () => {
        const response = await api.put('notifications/read-all/');
        return response.data;
    }
}

export const shifts = {
    getAll: async () => {
        const response = await api.get('shifts/');
        return response.data;
    },
    getMyShifts: async () => {
        const response = await api.get('shifts/my/');
        return response.data;
    },
    assign: async (data: any) => {
        const response = await api.post('shifts/', data);
        return response.data;
    },
    delete: async (id: number) => {
        const response = await api.delete(`shifts/${id}/`);
        return response.data;
    }
}

export const alerts = {
    getAll: async () => {
        const response = await api.get('alerts/');
        return response.data;
    }
}

export const labs = {
    getAll: async () => {
        const response = await api.get('labs/');
        return response.data;
    },
    create: async (data: any) => {
        const response = await api.post('labs/', data);
        return response.data;
    },
    updateStatus: async (id: number, status: string, results?: any) => {
        const response = await api.put(`labs/${id}/`, { status, results });
        return response.data;
    }
}

export const wards = {
    getAll: async () => {
        const response = await api.get('wards/');
        return response.data;
    },
    create: async (data: any) => {
        const response = await api.post('wards/', data);
        return response.data;
    },
    update: async (id: number, data: any) => {
        const response = await api.put(`wards/${id}`, data);
        return response.data;
    },
    delete: async (id: number) => {
        const response = await api.delete(`wards/${id}`);
        return response.data;
    }
}

export const beds = {
    getAll: async () => {
        const response = await api.get('beds/');
        return response.data;
    },
    admit: async (bedId: number, patientId: number) => {
        const response = await api.post(`beds/${bedId}/admit?patient_id=${patientId}`);
        return response.data;
    },
    discharge: async (bedId: number) => {
        const response = await api.post(`beds/${bedId}/discharge`);
        return response.data;
    },
    create: async (data: any) => {
        const response = await api.post('beds/', data);
        return response.data;
    },
    updateStatus: async (id: number, status: string) => {
        const response = await api.put(`beds/${id}/status?status=${status}`);
        return response.data;
    },
    delete: async (id: number) => {
        const response = await api.delete(`beds/${id}`);
        return response.data;
    }
}

export const patients = {
    getAll: async () => {
        const response = await api.get('patients/');
        return response.data;
    },
    getById: async (id: number) => {
        const response = await api.get(`patients/${id}/`);
        return response.data;
    },
    getDashboard: async () => {
        const response = await api.get('dashboard-patients/stats');
        return response.data;
    }
}

export const billing = {
    getInvoices: async () => {
        const response = await api.get('billing/invoices/');
        return response.data;
    },
    createInvoice: async (data: any) => {
        const response = await api.post('billing/invoices/', data);
        return response.data;
    },
    payInvoice: async (id: number, method: string, wallet_pin?: string) => {
        let url = `billing/invoices/${id}/pay/?payment_method=${method}`;
        if (wallet_pin) {
            url += `&wallet_pin=${wallet_pin}`;
        }
        const response = await api.put(url);
        return response.data;
    },
    getWallet: async () => {
        const response = await api.get('billing/wallet/');
        return response.data;
    },
    topupWallet: async (amount: number) => {
        const response = await api.post(`billing/wallet/topup/?amount=${amount}`);
        return response.data;
    },
    fundWallet: async (patientId: number, amount: number, method: string = 'cash', bankId?: number) => {
        let url = `billing/wallet/${patientId}/fund/?amount=${amount}&payment_method=${method}`;
        if (bankId) url += `&bank_id=${bankId}`;
        const response = await api.post(url);
        return response.data;
    },
    getBanks: async () => {
        const response = await api.get('billing/banks/');
        return response.data;
    },
    addBank: async (bankData: any) => {
        const response = await api.post('billing/banks/', bankData);
        return response.data;
    },
    deleteBank: async (id: number) => {
        const response = await api.delete(`billing/banks/${id}/`);
        return response.data;
    },
    requestOverdraft: async (patientId: number) => {
        const response = await api.post(`billing/wallet/${patientId}/overdraft/request`);
        return response.data;
    },
    confirmOverdraft: async (patientId: number, otpCode: string) => {
        const response = await api.post(`billing/wallet/${patientId}/overdraft/confirm?otp_code=${otpCode}`);
        return response.data;
    },
    getServiceTemplates: async () => {
        const response = await api.get('billing/service-templates');
        return response.data;
    },
    addServiceTemplate: async (data: any) => {
        const response = await api.post('billing/service-templates', data);
        return response.data;
    },
    deleteServiceTemplate: async (id: number) => {
        const response = await api.delete(`billing/service-templates/${id}`);
        return response.data;
    }
}

export const pharmacy = {
    getAllOrders: async () => {
        const response = await api.get('pharmacy/orders/all/');
        return response.data;
    },
    updateOrderStatus: async (id: number, status: string) => {
        const response = await api.put(`pharmacy/orders/${id}/status/?status=${status}`);
        return response.data;
    }
}

export const subscribeToNotifications = (onMessage: (data: any) => void) => {
    if (typeof window === 'undefined') return null;
    const hostname = window.location.hostname;
    // Use the explicit backend port 8000 for WebSockets, as Next.js rewrites don't handle WS proxies by default
    const wsUrl = `ws://${hostname}:8000/api/v1/ws`;

    console.log(`Connecting to notification WebSocket: ${wsUrl}`);
    const socket = new WebSocket(wsUrl);

    socket.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            onMessage(data);
        } catch (e) {
            onMessage(event.data);
        }
    };

    socket.onerror = (error) => {
        console.error('WebSocket connection failed:', wsUrl, error);
    };

    return socket;
};


export const labCatalog = {
    getAll: async () => {
        const response = await api.get('lab-catalog/');
        return response.data;
    },
    create: async (data: any) => {
        const response = await api.post('lab-catalog/', data);
        return response.data;
    },
    update: async (id: number, data: any) => {
        const response = await api.put(`lab-catalog/${id}`, data);
        return response.data;
    },
    delete: async (id: number) => {
        const response = await api.delete(`lab-catalog/${id}`);
        return response.data;
    },
};

export default api;
