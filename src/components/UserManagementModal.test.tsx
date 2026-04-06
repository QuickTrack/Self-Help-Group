import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import userModalReducer from '@/lib/store/userModalSlice';
import UserManagementModal from '@/components/UserManagementModal';

const createTestStore = (preloadedState = {}) => {
  return configureStore({
    reducer: {
      userModal: userModalReducer,
    },
    preloadedState,
  });
};

(global as any).fetch = jest.fn();

describe('UserManagementModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global as any).fetch = jest.fn();
  });

  it('renders modal when open', () => {
    const store = createTestStore({
      userModal: { isOpen: true, mode: 'list', selectedUser: null, toast: null },
    });
    render(
      <Provider store={store}>
        <UserManagementModal />
      </Provider>
    );

    expect(screen.getByText('User Management')).toBeInTheDocument();
  });

  it('renders Add User button in list mode', () => {
    const store = createTestStore({
      userModal: { isOpen: true, mode: 'list', selectedUser: null, toast: null },
    });
    render(
      <Provider store={store}>
        <UserManagementModal />
      </Provider>
    );

    expect(screen.getByText('Add User')).toBeInTheDocument();
  });

  it('displays search input and role filter in list mode', () => {
    const store = createTestStore({
      userModal: { isOpen: true, mode: 'list', selectedUser: null, toast: null },
    });
    render(
      <Provider store={store}>
        <UserManagementModal />
      </Provider>
    );

    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
    expect(screen.getByText('Filter by Role')).toBeInTheDocument();
  });

  it('switches to add mode when Add User button is clicked', async () => {
    const store = createTestStore({
      userModal: { isOpen: true, mode: 'list', selectedUser: null, toast: null },
    });
    render(
      <Provider store={store}>
        <UserManagementModal />
      </Provider>
    );

    fireEvent.click(screen.getByText('Add User'));

    await waitFor(() => {
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/role \*/i)).toBeInTheDocument();
    });
  });

  it('validates email field when submitting empty form', async () => {
    const store = createTestStore({
      userModal: { isOpen: true, mode: 'list', selectedUser: null, toast: null },
    });
    render(
      <Provider store={store}>
        <UserManagementModal />
      </Provider>
    );

    fireEvent.click(screen.getByText('Add User'));

    await waitFor(() => {
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    const submitButton = screen.getByText('Create User');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
    });
  });

  it('validates email format', async () => {
    const store = createTestStore({
      userModal: { isOpen: true, mode: 'list', selectedUser: null, toast: null },
    });
    render(
      <Provider store={store}>
        <UserManagementModal />
      </Provider>
    );

    fireEvent.click(screen.getByText('Add User'));

    await waitFor(() => {
      const emailInput = screen.getByLabelText(/email/i);
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    });

    const submitButton = screen.getByText('Create User');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid email format')).toBeInTheDocument();
    });
  });

  it('validates password minimum length', async () => {
    const store = createTestStore({
      userModal: { isOpen: true, mode: 'list', selectedUser: null, toast: null },
    });
    render(
      <Provider store={store}>
        <UserManagementModal />
      </Provider>
    );

    fireEvent.click(screen.getByText('Add User'));

    await waitFor(() => {
      const emailInput = screen.getByLabelText(/email/i);
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    });

    const passwordInput = screen.getByLabelText(/password/i);
    fireEvent.change(passwordInput, { target: { value: 'short' } });

    const submitButton = screen.getByText('Create User');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
    });
  });

  it('calls API to create user on valid form submission', async () => {
    (global as any).fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: { id: '1', email: 'test@example.com', role: 'member' } }),
    });

    const store = createTestStore({
      userModal: { isOpen: true, mode: 'list', selectedUser: null, toast: null },
    });
    render(
      <Provider store={store}>
        <UserManagementModal />
      </Provider>
    );

    fireEvent.click(screen.getByText('Add User'));

    await waitFor(() => {
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    });

    const submitButton = screen.getByText('Create User');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/users', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
          role: 'member',
        }),
      }));
    });
  });

  it('displays users in table when fetched', async () => {
    (global as any).fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        users: [
          { id: '1', email: 'admin@example.com', role: 'admin' },
          { id: '2', email: 'user@example.com', role: 'member' },
        ],
      }),
    });

    const store = createTestStore({
      userModal: { isOpen: true, mode: 'list', selectedUser: null, toast: null },
    });
    render(
      <Provider store={store}>
        <UserManagementModal />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('admin@example.com')).toBeInTheDocument();
      expect(screen.getByText('user@example.com')).toBeInTheDocument();
    });
  });

  it('filters users by search query', async () => {
    (global as any).fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        users: [
          { id: '1', email: 'admin@example.com', role: 'admin' },
          { id: '2', email: 'user@example.com', role: 'member' },
        ],
      }),
    });

    const store = createTestStore({
      userModal: { isOpen: true, mode: 'list', selectedUser: null, toast: null },
    });
    render(
      <Provider store={store}>
        <UserManagementModal />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('admin@example.com')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: 'user' } });

    await waitFor(() => {
      expect(screen.queryByText('admin@example.com')).not.toBeInTheDocument();
      expect(screen.getByText('user@example.com')).toBeInTheDocument();
    });
  });

  it('shows delete confirmation dialog', async () => {
    (global as any).fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        users: [{ id: '1', email: 'test@example.com', role: 'member' }],
      }),
    });

    const store = createTestStore({
      userModal: { isOpen: true, mode: 'list', selectedUser: null, toast: null },
    });
    render(
      <Provider store={store}>
        <UserManagementModal />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button');
    const deleteButton = deleteButtons.find(btn => btn.getAttribute('aria-label') === '');
    if (deleteButton) {
      fireEvent.click(deleteButton);
    }

    await waitFor(() => {
      expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
    });
  });
});