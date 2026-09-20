export interface PortfolioServerState {
  avatarUrl?: string | null;
  photos?: any[] | null;
  updatedAt?: number | null;
}

const ADMIN_TOKEN_KEY = 'pa_admin_token_v1';

export function getStoredAdminToken(): string | null {
  try {
    return localStorage.getItem(ADMIN_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredAdminToken(token: string | null) {
  try {
    if (token) {
      localStorage.setItem(ADMIN_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
    }
  } catch {
    // ignore
  }
}

export async function loginAdmin(password: string): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      setStoredAdminToken(data.token);
      return { success: true, token: data.token };
    }
    return { success: false, error: data.error || 'Mật khẩu không đúng!' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Không thể kết nối máy chủ' };
  }
}

export async function checkAdminStatus(): Promise<{ isAdmin: boolean; role: 'admin' | 'viewer' }> {
  try {
    const token = getStoredAdminToken();
    if (!token) return { isAdmin: false, role: 'viewer' };

    const res = await fetch('/api/auth/status', {
      headers: { 'x-admin-token': token },
    });
    if (!res.ok) return { isAdmin: false, role: 'viewer' };
    const data = await res.json();
    if (!data.isAdmin) {
      setStoredAdminToken(null);
    }
    return data;
  } catch {
    return { isAdmin: false, role: 'viewer' };
  }
}

export async function logoutAdmin(): Promise<void> {
  try {
    const token = getStoredAdminToken();
    if (token) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'x-admin-token': token },
      });
    }
  } finally {
    setStoredAdminToken(null);
  }
}

export async function changeAdminPassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
  try {
    const token = getStoredAdminToken();
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': token || '',
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      return { success: true };
    }
    return { success: false, error: data.error || 'Không thể đổi mật khẩu' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Lỗi mạng khi đổi mật khẩu' };
  }
}

export async function fetchPortfolioState(): Promise<PortfolioServerState> {
  try {
    const res = await fetch('/api/portfolio');
    if (!res.ok) throw new Error('Network error');
    const data = await res.json();
    return data;
  } catch (err) {
    console.warn('Could not fetch server portfolio state, using local:', err);
    return {};
  }
}

export async function saveServerAvatar(avatarUrlOrBase64: string): Promise<{ success: boolean; avatarUrl?: string; error?: string }> {
  try {
    const token = getStoredAdminToken();
    const res = await fetch('/api/portfolio/avatar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': token || '',
      },
      body: JSON.stringify({ avatarUrl: avatarUrlOrBase64 }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Bạn không có quyền chỉnh sửa!' };
    }
    return { success: true, avatarUrl: data.avatarUrl };
  } catch (err: any) {
    console.error('Failed to save avatar to server:', err);
    return { success: false, error: err.message };
  }
}

export async function saveServerPhotos(photos: any[]): Promise<{ success: boolean; error?: string }> {
  try {
    const token = getStoredAdminToken();
    const res = await fetch('/api/portfolio/photos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': token || '',
      },
      body: JSON.stringify({ photos }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Chỉ Admin mới có quyền chỉnh sửa!' };
    }
    return { success: true };
  } catch (err: any) {
    console.error('Failed to save photos to server:', err);
    return { success: false, error: err.message };
  }
}

export async function resetServerAvatar(): Promise<boolean> {
  try {
    const token = getStoredAdminToken();
    const res = await fetch('/api/portfolio/reset-avatar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': token || '',
      },
    });
    return res.ok;
  } catch (err) {
    console.error('Failed to reset avatar on server:', err);
    return false;
  }
}

