import React from 'react';
import { screen, render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Login from '../pages/auth/Login';
import ModalsAndFormsTester from '../pages/ModalsAndFormsTester';

function renderWithRoute(ui: React.ReactElement, path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/auth/login" element={<Login />} />
        <Route path="/modals-and-forms" element={<ModalsAndFormsTester />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('Modals and Forms smoke tests', () => {
  it('renders login form inputs', () => {
    renderWithRoute(<Login />, '/auth/login');
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('opens delete confirmation modal from tester page', () => {
    renderWithRoute(<ModalsAndFormsTester />, '/modals-and-forms');
    const openBtn = screen.getByTestId('open-delete-modal');
    fireEvent.click(openBtn);
    expect(screen.getByText(/confirm delete/i)).toBeInTheDocument();
  });
});