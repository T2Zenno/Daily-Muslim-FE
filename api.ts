const API_BASE = 'http://127.0.0.1:8000/api';

interface ApiResponse<T> {
  data?: T;
  message?: string;
  errors?: any;
}

class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

function getToken(): string | null {
  return localStorage.getItem('api_token');
}

function setToken(token: string | null) {
  if (token) {
    localStorage.setItem('api_token', token);
  } else {
    localStorage.removeItem('api_token');
  }
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    let message = errorData.message;
    if (!message) {
      // Check if it's Laravel validation errors
      const keys = Object.keys(errorData);
      if (keys.length > 0 && Array.isArray(errorData[keys[0]])) {
        message = errorData[keys[0]][0];
      }
    }
    throw new ApiError(message || 'API Error', response.status);
  }

  return response.json();
}

// Auth
export interface User {
  id: number;
  name: string;
  email: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export async function register(name: string, email: string, password: string, password_confirmation: string): Promise<AuthResponse> {
  const response = await apiRequest<AuthResponse>('/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, password_confirmation }),
  });
  setToken(response.token);
  return response;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await apiRequest<AuthResponse>('/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setToken(response.token);
  return response;
}

export async function logout(): Promise<void> {
  await apiRequest('/logout', { method: 'POST' });
  setToken(null);
}

export async function getUser(): Promise<User> {
  return apiRequest<User>('/user');
}

// Habits
export interface HabitApi {
  id: number;
  names: { [key: string]: string };
  type: 'wajib' | 'sunnah';
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'special';
  category: string | null;
  schedule: any; // Adjust based on backend
  notes: string | null;
  active: boolean;
  streak: { current: number; longest: number };
  target_streak: number | null;
  created_at: string;
  updated_at: string;
  completions?: CompletionApi[];
}

export async function getHabits(): Promise<HabitApi[]> {
  return apiRequest<HabitApi[]>('/habits');
}

export async function createHabit(habit: Omit<HabitApi, 'id' | 'created_at' | 'updated_at' | 'completions'>): Promise<HabitApi> {
  return apiRequest<HabitApi>('/habits', {
    method: 'POST',
    body: JSON.stringify(habit),
  });
}

export async function updateHabit(id: number, habit: Partial<HabitApi>): Promise<HabitApi> {
  return apiRequest<HabitApi>(`/habits/${id}`, {
    method: 'PUT',
    body: JSON.stringify(habit),
  });
}

export async function deleteHabit(id: number): Promise<void> {
  await apiRequest(`/habits/${id}`, { method: 'DELETE' });
}

// Completions
export interface CompletionApi {
  id: number;
  user_id: number;
  habit_id: number;
  date: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export async function getCompletions(): Promise<CompletionApi[]> {
  return apiRequest<CompletionApi[]>('/completions');
}

export interface ToggleResponse {
  completion: CompletionApi;
  habit: HabitApi;
}

export async function toggleCompletion(habitId: number, date?: string): Promise<ToggleResponse> {
  return apiRequest<ToggleResponse>(`/completions/${habitId}/toggle`, {
    method: 'POST',
    body: JSON.stringify({ date }),
  });
}



// Data
export async function exportData(): Promise<any> {
  return apiRequest('/data/export');
}

export async function importData(data: any): Promise<void> {
  await apiRequest('/data/import', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
