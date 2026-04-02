import { AUTH_SERVICE_URL } from '../constants/api';
import { toAppError } from '../utils/errorMessage';

/**
 * ===== AUTH SERVICE API FUNCTIONS =====
 * All functions call real API from: https://auth-service-wq2a.onrender.com
 * Endpoint base: /api/auth-service/auth/
 */

type AnyObj = Record<string, any>;

const safeParseJson = async (response: Response): Promise<AnyObj> => {
  try {
    return (await response.json()) as AnyObj;
  } catch {
    return {};
  }
};

const throwFetchError = (
  status: number,
  errorData: AnyObj,
  fallback: string,
): never => {
  const rawMessage =
    (typeof errorData?.message === 'string' && errorData.message) ||
    (typeof errorData?.error === 'string' && errorData.error) ||
    (typeof errorData?.error?.message === 'string' && errorData.error.message) ||
    fallback;

  throw toAppError({
    status,
    message: rawMessage,
    raw: errorData,
  });
};

// ===== 1. LOGIN =====
export async function login({ email, password }) {
  const payload = { email, password };
  const url = `${AUTH_SERVICE_URL}/api/auth-service/auth/login`;

  try {
    console.log('[authApi.login] Calling:', url, 'with email:', email);
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await safeParseJson(response);
      console.error('[authApi.login] Error:', errorData);
      throwFetchError(response.status, errorData, `Login failed: ${response.status}`);
    }

    const result = await response.json();
    console.debug('[authApi.login] Success:', result);
    return result?.data ?? result;
  } catch (error) {
    console.error('[authApi.login] Error:', error);
    throw error;
  }
}

// ===== 2. REGISTER =====
export async function register({ email, password, fullName, role = 'CUSTOMER' }) {
  const payload = { email, password, fullName, role };
  const url = `${AUTH_SERVICE_URL}/api/auth-service/auth/register`;

  try {
    console.log('[authApi.register] Calling:', url);
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await safeParseJson(response);
      throwFetchError(response.status, errorData, `Register failed: ${response.status}`);
    }

    const result = await response.json();
    console.debug('[authApi.register] Success');
    return result?.data ?? result;
  } catch (error) {
    console.error('[authApi.register] Error:', error);
    throw error;
  }
}

// ===== 3. REFRESH TOKEN =====
export async function refreshToken(refreshToken: string) {
  const payload = { refreshToken };
  const url = `${AUTH_SERVICE_URL}/api/auth-service/auth/refresh`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await safeParseJson(response);
      throwFetchError(response.status, errorData, 'Refresh failed');
    }

    const data = await response.json();
    return data?.data ?? data;
  } catch (error) {
    console.error('[authApi.refreshToken] Error:', error);
    throw error;
  }
}

// ===== 4. LOGOUT =====
export async function logout(token: string) {
  const url = `${AUTH_SERVICE_URL}/api/auth-service/auth/logout`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await safeParseJson(response);
      throwFetchError(response.status, errorData, 'Logout failed');
    }

    const data = await response.json();
    return data?.data ?? data;
  } catch (error) {
    console.error('[authApi.logout] Error:', error);
    throw error;
  }
}

// ===== 5. GET PROFILE =====
export async function getProfile(token: string) {
  const url = `${AUTH_SERVICE_URL}/api/auth-service/auth/profile`;
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await safeParseJson(response);
      throwFetchError(response.status, errorData, 'Get profile failed');
    }

    const data = await response.json();
    return data?.data ?? data;
  } catch (error) {
    console.error('[authApi.getProfile] Error:', error);
    throw error;
  }
}

// ===== 6. VERIFY TOKEN =====
export async function verifyToken(token: string) {
  const url = `${AUTH_SERVICE_URL}/api/auth-service/auth/verify`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) return false;
    console.debug('[authApi.verifyToken] Token is valid');
    return true;
  } catch (error) {
    console.error('[authApi.verifyToken] Error:', error);
    return false;
  }
}

// ===== 7. FORGOT PASSWORD =====
export async function forgotPassword(email: string) {
  const payload = { email };
  const url = `${AUTH_SERVICE_URL}/api/auth-service/password/forgot`;

  try {
    console.log('[authApi.forgotPassword] Calling:', url);
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await safeParseJson(response);
      throwFetchError(response.status, errorData, 'Forgot password failed');
    }

    const data = await response.json();
    return data?.data ?? data;
  } catch (error) {
    console.error('[authApi.forgotPassword] Error:', error);
    throw error;
  }
}

// ===== 8. VERIFY OTP =====
export async function verifyOTP(email: string, otp: string) {
  const payload = { email, otp };
  const url = `${AUTH_SERVICE_URL}/api/auth-service/password/verify-otp`;

  try {
    console.log('[authApi.verifyOTP] Calling:', url);
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await safeParseJson(response);
      throwFetchError(response.status, errorData, 'Verify OTP failed');
    }

    const data = await response.json();
    console.debug('[authApi.verifyOTP] Success');
    return data?.data ?? data;
  } catch (error) {
    console.error('[authApi.verifyOTP] Error:', error);
    throw error;
  }
}

// ===== 9. RESET PASSWORD =====
export async function resetPassword(email: string, resetToken: string, newPassword: string) {
  const payload = { email, resetToken, newPassword };
  const url = `${AUTH_SERVICE_URL}/api/auth-service/password/reset`;

  try {
    console.log('[authApi.resetPassword] Calling:', url);
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await safeParseJson(response);
      throwFetchError(response.status, errorData, 'Reset password failed');
    }

    const data = await response.json();
    console.debug('[authApi.resetPassword] Success');
    return data?.data ?? data;
  } catch (error) {
    console.error('[authApi.resetPassword] Error:', error);
    throw error;
  }
}

// ===== 10. CHANGE PASSWORD =====

export async function changePassword(token: string, oldPassword: string, newPassword: string) {
  const payload = { token, oldPassword, newPassword };
  const url = `${AUTH_SERVICE_URL}/api/auth-service/auth/reset-password`;

  try {
    console.log('[authApi.changePassword] Calling:', url);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await safeParseJson(response);
      throwFetchError(response.status, errorData, 'Change password failed');
    }

    const data = await response.json();
    return data?.data ?? data;
  } catch (error) {
    console.error('[authApi.changePassword] Error:', error);
    throw error;
  }
}

// ===== 11. REGISTER CUSTOMER =====

export async function registerCustomer({ name, email, password, address, phone, role, franchiseId }) {
  const payload = { name, email, password, address, phone, franchiseId };
  const url = `${AUTH_SERVICE_URL}/api/auth-service/auth/register`;

  try {
    console.log('[authApi.registerCustomer] Calling:', url);
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await safeParseJson(response);
      throwFetchError(response.status, errorData, `Register failed: ${response.status}`);
    }

    const result = await response.json();
    console.debug('[authApi.registerCustomer] Success');
    return result?.data ?? result;
  } catch (error) {
    console.error('[authApi.registerCustomer] Error:', error);
    throw error;
  }
}

// ===== 12. SEND REGISTER SUCCESS NOTIFICATION =====
export async function sendRegisterSuccessNotification(email: string, name: string) {
  const payload = { email, name };
  const url = `/api/notification-service/public/send-register-success`;

  try {
    console.log('[authApi.sendRegisterSuccessNotification] Calling:', url);
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await safeParseJson(response);
      console.warn('[authApi.sendRegisterSuccessNotification] Warning:', errorData);
      // Don't throw error - notification failure shouldn't block registration
      return false;
    }

    const data = await response.json();
    console.debug('[authApi.sendRegisterSuccessNotification] Success');
    return true;
  } catch (error) {
    console.error('[authApi.sendRegisterSuccessNotification] Error:', error);
    // Don't throw error - notification failure shouldn't block registration
    return false;
  }
}

// ===== 13. CHECK PHONE UNIQUENESS =====
export async function checkPhoneExists(phone: string) {
  try {
    // This is a local validation - in production, you might want to call a backend endpoint
    // For now, we'll rely on the backend error handling
    if (!phone || phone.length < 10) {
      return false;
    }
    return true;
  } catch (error) {
    console.error('[authApi.checkPhoneExists] Error:', error);
    return false;
  }
}

export default {
  login,
  register,
  registerCustomer,
  checkPhoneExists,
  refreshToken,
  logout,
  getProfile,
  verifyToken,
  forgotPassword,
  verifyOTP,
  resetPassword,
  changePassword,
  sendRegisterSuccessNotification,
};
