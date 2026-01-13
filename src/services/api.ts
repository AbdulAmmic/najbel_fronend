import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';

const API_URL = 'http://localhost:8000/api/v1';

const api: AxiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add interceptor for JWT
api.interceptors.request.use(
    (config: any) => {
        // Check if we have a token (assuming localStorage for now)
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
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
        const response = await api.post('/auth/login', params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        return response.data;
    },
    register: async (userData: any) => {
        const response = await api.post('/users/', userData);
        return response.data;
    },
    getMe: async () => {
        const response = await api.get('/users/me');
        return response.data;
    }
};

export const appointments = {
    getAll: async () => {
        const response = await api.get('/appointments/my-appointments');
        return response.data;
    },
    create: async (data: any) => {
        const response = await api.post('/appointments/', data);
        return response.data;
    },
    update: async (id: number, data: any) => {
        const response = await api.put(`/appointments/${id}`, data);
        return response.data;
    },
    getById: async (id: number) => {
        const response = await api.get(`/appointments/${id}`);
        return response.data;
    },
};

export const attendance = {
    checkIn: async () => {
        const response = await api.post('/attendance/check-in');
        return response.data;
    },
    checkOut: async () => {
        const response = await api.post('/attendance/check-out');
        return response.data;
    },
    getHistory: async () => {
        const response = await api.get('/attendance/my-history');
        return response.data;
    }
}

export const dashboard = {
    getStats: async () => {
        const response = await api.get('/dashboard/stats');
        return response.data;
    }
}

export const patients = {
    getAll: async () => {
        const response = await api.get('/dashboard/patients');
        return response.data;
    },
    getMyPatients: async () => {
        const response = await api.get('/users/patients/my');
        return response.data;
    }
}

export const prescriptions = {
    getAll: async () => {
        const response = await api.get('/prescriptions/');
        return response.data;
    },
    getById: async (id: number) => {
        const response = await api.get(`/prescriptions/${id}`);
        return response.data;
    },
    create: async (data: any) => {
        const response = await api.post('/prescriptions/', data);
        return response.data;
    }
}

export const medicalRecords = {
    getAll: async () => {
        const response = await api.get('/medical-records/');
        return response.data;
    },
    getById: async (id: number) => {
        const response = await api.get(`/medical-records/${id}`);
        return response.data;
    },
    create: async (data: any) => {
        const response = await api.post('/medical-records/', data);
        return response.data;
    }
}

export const vitals = {
    getAll: async () => {
        const response = await api.get('/vitals/');
        return response.data;
    },
    create: async (data: any) => {
        const response = await api.post('/vitals/', data);
        return response.data;
    }
}

export const labs = {
    getAll: async () => {
        const response = await api.get('/labs/');
        return response.data;
    },
    create: async (data: any) => {
        const response = await api.post('/labs/', data);
        return response.data;
    },
    update: async (id: number, data: any) => {
        const response = await api.put(`/labs/${id}`, data);
        return response.data;
    }
}

export const consultations = {
    create: async (data: any) => {
        const response = await api.post('/consultations/', data);
        return response.data;
    },
    getById: async (id: number) => {
        const response = await api.get(`/consultations/${id}`);
        return response.data;
    },
    getMyHistory: async () => {
        const response = await api.get('/consultations/history/my');
        return response.data;
    }
}


export const billing = {
    getInvoices: async () => {
        const response = await api.get('/billing/invoices');
        return response.data;
    },
    getMyInvoices: async () => {
        const response = await api.get('/billing/invoices/my');
        return response.data;
    },
    createInvoice: async (data: any) => {
        const response = await api.post('/billing/invoices', data);
        return response.data;
    },
    payInvoice: async (id: number, paymentMethod: string) => {
        const response = await api.put(`/billing/invoices/${id}/pay?payment_method=${paymentMethod}`);
        return response.data;
    },
    getWallet: async () => {
        const response = await api.get('/billing/wallet');
        return response.data;
    },
    topupWallet: async (data: any) => {
        const response = await api.post('/billing/wallet/topup', data);
        return response.data;
    },
    getTransactions: async () => {
        const response = await api.get('/billing/transactions/my');
        return response.data;
    }
}

export const pharmacy = {
    getInventory: async () => {
        const response = await api.get('/pharmacy/inventory');
        return response.data;
    }
}

export const subscribeToNotifications = (onMessage: (msg: string) => void) => {
    if (typeof window === 'undefined') return null;
    const socket = new WebSocket('ws://localhost:8000/api/v1/ws');

    socket.onopen = () => {
        console.log('Connected to notification service');
    };

    socket.onmessage = (event) => {
        onMessage(event.data);
    };

    return socket;
}

export default api;
