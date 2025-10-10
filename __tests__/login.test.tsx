// __tests__/login.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Login from '../pages/login';
import '@testing-library/jest-dom';

// Mock the useRouter hook
const mockRouterPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
}));

// Mock global fetch
global.fetch = jest.fn() as jest.Mock;

describe('Login Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
    localStorage.clear();

    // Mock localStorage functions
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});
    jest.spyOn(window, 'dispatchEvent').mockImplementation(() => true);
  });

  afterEach(() => {
    jest.spyOn(Storage.prototype, 'setItem').mockRestore();
    jest.spyOn(window, 'dispatchEvent').mockRestore();
  });

  it('1. should render the login form correctly', () => {
    render(<Login />);
    
    expect(screen.getByPlaceholderText('กรอก User ID ของคุณ')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('กรอกรหัสผ่านของคุณ')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'เข้าสู่ระบบ' })).toBeInTheDocument();
  });

  it('2. should show an error message for an empty User ID on submit', async () => {
    render(<Login />);
    const loginButton = screen.getByRole('button', { name: 'เข้าสู่ระบบ' });
    
    fireEvent.click(loginButton);
    
    await waitFor(() => {
      expect(screen.getByText('กรุณากรอก User ID')).toBeInTheDocument();
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('3. should show an error message for an empty password', async () => {
    render(<Login />);
    const userIdInput = screen.getByPlaceholderText('กรอก User ID ของคุณ');
    const loginButton = screen.getByRole('button', { name: 'เข้าสู่ระบบ' });
    
    fireEvent.change(userIdInput, { target: { value: 'testuser' } });
    fireEvent.click(loginButton);
    
    await waitFor(() => {
      expect(screen.getByText('กรุณากรอกรหัสผ่าน')).toBeInTheDocument();
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('4. should handle a successful login and redirect', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ userId: 'testuser', name: 'Test User' }),
    });

    render(<Login />);
    
    fireEvent.change(screen.getByPlaceholderText('กรอก User ID ของคุณ'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByPlaceholderText('กรอกรหัสผ่านของคุณ'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'เข้าสู่ระบบ' }));
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    expect(localStorage.setItem).toHaveBeenCalledWith('loggedInUser', 'testuser');
    expect(localStorage.setItem).toHaveBeenCalledWith('userName', 'Test User');
    expect(window.dispatchEvent).toHaveBeenCalledWith(expect.any(CustomEvent));
    expect(mockRouterPush).toHaveBeenCalledWith('/dashboard');
  });

  it('5. should handle a failed login and display an error message', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'User ID หรือ Password ไม่ถูกต้อง' }),
    });

    render(<Login />);
    
    fireEvent.change(screen.getByPlaceholderText('กรอก User ID ของคุณ'), { target: { value: 'wronguser' } });
    fireEvent.change(screen.getByPlaceholderText('กรอกรหัสผ่านของคุณ'), { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByRole('button', { name: 'เข้าสู่ระบบ' }));
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByText('User ID หรือ Password ไม่ถูกต้อง')).toBeInTheDocument();
    expect(mockRouterPush).not.toHaveBeenCalled();
  });

  it('6. should toggle password visibility', () => {
    render(<Login />);
    const passwordInput = screen.getByPlaceholderText('กรอกรหัสผ่านของคุณ') as HTMLInputElement;
    const toggleButton = screen.getByRole('button', { name: 'แสดงรหัสผ่าน' });

    expect(passwordInput.type).toBe('password');
    expect(toggleButton).toHaveAccessibleName('แสดงรหัสผ่าน');

    fireEvent.click(toggleButton);
    expect(passwordInput.type).toBe('text');
    expect(screen.getByRole('button', { name: 'ซ่อนรหัสผ่าน' })).toBeInTheDocument();
  });
});