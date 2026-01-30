const API_BASE_URL = 'http://localhost:5000/api';

// Orders API
export const ordersAPI = {
    // Get all orders
    getAll: async () => {
        const response = await fetch(`${API_BASE_URL}/orders`);
        if (!response.ok) throw new Error('Failed to fetch orders');
        return response.json();
    },

    // Get civil orders only
    getCivil: async (date = null) => {
        let url = `${API_BASE_URL}/orders/civil`;
        if (date) {
            url += `?date=${date}`;
        }
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch civil orders');
        return response.json();
    },

    // Get single order
    getById: async (id) => {
        const response = await fetch(`${API_BASE_URL}/orders/${id}`);
        if (!response.ok) throw new Error('Failed to fetch order');
        return response.json();
    },

    // Create new order
    create: async (orderData) => {
        const response = await fetch(`${API_BASE_URL}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to create order');
        return data;
    },

    // Update order status
    updateStatus: async (id, status) => {
        const response = await fetch(`${API_BASE_URL}/orders/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        if (!response.ok) throw new Error('Failed to update status');
        return response.json();
    },

    // Update entire order
    update: async (id, orderData) => {
        const response = await fetch(`${API_BASE_URL}/orders/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });
        if (!response.ok) throw new Error('Failed to update order');
        return response.json();
    },

    // Delete order
    delete: async (id) => {
        const response = await fetch(`${API_BASE_URL}/orders/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete order');
        return response.json();
    },

    // Generate next order ID
    getNextId: async () => {
        const response = await fetch(`${API_BASE_URL}/orders/generate/next-id`);
        if (!response.ok) throw new Error('Failed to generate order ID');
        return response.json();
    }
};

// Companies API
export const companiesAPI = {
    // Get all companies
    getAll: async () => {
        const response = await fetch(`${API_BASE_URL}/companies`);
        if (!response.ok) throw new Error('Failed to fetch companies');
        return response.json();
    },

    // Get single company
    getById: async (id) => {
        const response = await fetch(`${API_BASE_URL}/companies/${id}`);
        if (!response.ok) throw new Error('Failed to fetch company');
        return response.json();
    },

    // Create new company
    create: async (companyData) => {
        const response = await fetch(`${API_BASE_URL}/companies`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(companyData)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to create company');
        return data;
    },

    // Update company
    update: async (id, companyData) => {
        const response = await fetch(`${API_BASE_URL}/companies/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(companyData)
        });
        if (!response.ok) throw new Error('Failed to update company');
        return response.json();
    },

    // Delete company
    delete: async (id) => {
        const response = await fetch(`${API_BASE_URL}/companies/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete company');
        return response.json();
    },

    // Get company statistics
    getStats: async (id) => {
        const response = await fetch(`${API_BASE_URL}/companies/${id}/stats`);
        if (!response.ok) throw new Error('Failed to fetch company stats');
        return response.json();
    }
};

// Company Employees API
export const employeesAPI = {
    // Get employees for a company
    getByCompany: async (companyId) => {
        const response = await fetch(`${API_BASE_URL}/employees/company/${companyId}`);
        if (!response.ok) throw new Error('Failed to fetch employees');
        return response.json();
    },

    // Get single employee
    getById: async (id) => {
        const response = await fetch(`${API_BASE_URL}/employees/${id}`);
        if (!response.ok) throw new Error('Failed to fetch employee');
        return response.json();
    },

    // Create new employee order
    create: async (employeeData) => {
        const response = await fetch(`${API_BASE_URL}/employees`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(employeeData)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to create employee order');
        return data;
    },

    // Update employee status
    updateStatus: async (id, status) => {
        const response = await fetch(`${API_BASE_URL}/employees/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        if (!response.ok) throw new Error('Failed to update status');
        return response.json();
    },

    // Update employee
    update: async (id, employeeData) => {
        const response = await fetch(`${API_BASE_URL}/employees/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(employeeData)
        });
        if (!response.ok) throw new Error('Failed to update employee');
        return response.json();
    },

    // Delete employee
    delete: async (id) => {
        const response = await fetch(`${API_BASE_URL}/employees/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete employee');
        return response.json();
    },

    // Generate next order ID for company
    getNextId: async (companyId) => {
        const response = await fetch(`${API_BASE_URL}/employees/company/${companyId}/next-id`);
        if (!response.ok) throw new Error('Failed to generate order ID');
        return response.json();
    },

    // Get position types
    getPositions: async () => {
        const response = await fetch(`${API_BASE_URL}/employees/positions/list`);
        if (!response.ok) throw new Error('Failed to fetch positions');
        return response.json();
    }
};

export default { ordersAPI, companiesAPI, employeesAPI };
