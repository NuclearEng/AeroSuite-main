import React from 'react';
import { render, screen, fireEvent, waitFor, RenderResult } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import AIAnalysisPage from './AIAnalysisPage';
import axios from 'axios';
import { SnackbarProvider } from 'notistack';

jest.mock('axios');

const renderWithProviders = (ui: React.ReactElement): RenderResult =>
  render(<SnackbarProvider>{ui}</SnackbarProvider>);

expect.extend(toHaveNoViolations);

describe('AIAnalysisPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders upload and paste options', () => {
    renderWithProviders(<AIAnalysisPage />);
    expect(screen.getByLabelText(/Upload (JSON|CSV) File/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Paste Data/i)).toBeInTheDocument();
  });

  it('shows error on invalid JSON', () => {
    renderWithProviders(<AIAnalysisPage />);
    fireEvent.change(screen.getByLabelText(/Paste Data/i), { target: { value: 'not-json' } });
    fireEvent.click(screen.getByText(/Analyze/i));
    expect(screen.getByText(/Error parsing JSON/i)).toBeInTheDocument();
  });

  it('shows error on API failure', async () => {
    (axios.post as jest.Mock).mockRejectedValueOnce({ response: { data: { message: 'Server error' } } });
    renderWithProviders(<AIAnalysisPage />);
    fireEvent.change(screen.getByLabelText(/Paste Data/i), { target: { value: '[{"value":1}]' } });
    fireEvent.click(screen.getByText(/Analyze/i));
    await waitFor(() => {
      expect(screen.getByText(/Analysis failed/i)).toBeInTheDocument();
    });
  });

  it('shows success on valid analysis', async () => {
    (axios.post as jest.Mock).mockResolvedValueOnce({ data: { analysis: { summary: { value: { min: 1, max: 2, mean: 1.5 } } } } });
    renderWithProviders(<AIAnalysisPage />);
    fireEvent.change(screen.getByLabelText(/Paste Data/i), { target: { value: '[{"value":1},{"value":2}]' } });
    fireEvent.click(screen.getByText(/Analyze/i));
    await waitFor(() => {
      expect(screen.getByText(/Analysis completed successfully/i)).toBeInTheDocument();
      expect(screen.getByText(/Min: 1/)).toBeInTheDocument();
      expect(screen.getByText(/Max: 2/)).toBeInTheDocument();
      expect(screen.getByText(/Mean: 1.5/)).toBeInTheDocument();
    });
  });

  it('shows error on empty input', () => {
    renderWithProviders(<AIAnalysisPage />);
    fireEvent.change(screen.getByLabelText(/Paste Data/i), { target: { value: '   ' } });
    fireEvent.click(screen.getByText(/Analyze/i));
    expect(screen.getByText(/Input cannot be empty or whitespace/i)).toBeInTheDocument();
  });

  it('shows error on invalid structure', () => {
    renderWithProviders(<AIAnalysisPage />);
    fireEvent.change(screen.getByLabelText(/Paste Data/i), { target: { value: '"just a string"' } });
    fireEvent.click(screen.getByText(/Analyze/i));
    expect(screen.getByText(/Input data must be an array of objects/i)).toBeInTheDocument();
  });

  it('shows error on large file upload', () => {
    const file = new File([new ArrayBuffer(6 * 1024 * 1024)], 'large.json', { type: 'application/json' });
    renderWithProviders(<AIAnalysisPage />);
    const uploadBtn = screen.getByLabelText(/Upload JSON File/i);
    const fileInput = uploadBtn.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });
    expect(screen.getByText(/File is too large/i)).toBeInTheDocument();
  });

  it('shows error on file read failure', () => {
    const file = new File(['bad'], 'bad.json', { type: 'application/json' });
    const originalFileReader = window.FileReader;
    
    // Use a simpler approach to mock FileReader
    window.FileReader = jest.fn().mockImplementation(() => {
      return {
        readAsText: jest.fn().mockImplementation(function(this: any) {
          // Simulate error event
          setTimeout(() => {
            if (this.onerror) this.onerror(new Error('Mock file read error'));
          }, 0);
        }),
        onload: null,
        onerror: null
      };
    }) as unknown as typeof FileReader;
    
    renderWithProviders(<AIAnalysisPage />);
    const uploadBtn = screen.getByLabelText(/Upload JSON File/i);
    const fileInput = uploadBtn.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });
    expect(screen.getByText(/Failed to read file/i)).toBeInTheDocument();
    
    // Restore the original FileReader
    window.FileReader = originalFileReader;
  });

  it('resets state on input method/format change', () => {
    renderWithProviders(<AIAnalysisPage />);
    fireEvent.change(screen.getByLabelText(/Paste Data/i), { target: { value: '[{"value":1}]' } });
    fireEvent.click(screen.getByText(/Analyze/i));
    fireEvent.mouseDown(screen.getByLabelText(/Input Method/i));
    fireEvent.click(screen.getByText(/Upload File/i));
    expect(screen.queryByText(/Analysis completed successfully/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Min:/i)).not.toBeInTheDocument();
  });

  it('has no basic accessibility violations', async () => {
    const { container } = renderWithProviders(<AIAnalysisPage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
}); 