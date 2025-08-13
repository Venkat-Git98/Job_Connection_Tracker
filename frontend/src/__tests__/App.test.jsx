import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import App from '../App';

// Mock the API service
vi.mock('../services/api', () => ({
  apiService: {
    getConnections: vi.fn().mockResolvedValue({ data: { connections: [] } }),
    getJobs: vi.fn().mockResolvedValue({ data: { jobs: [] } }),
    getOutreach: vi.fn().mockResolvedValue({ data: { companies: [] } }),
    getConnectionStats: vi.fn().mockResolvedValue({ data: { stats: {} } }),
    getOutreachSummary: vi.fn().mockResolvedValue({ data: { summary: [] } })
  }
}));

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('App Component', () => {
  it('renders without crashing', () => {
    renderWithRouter(<App />);
    expect(screen.getByText('LinkedIn Job Tracker')).toBeInTheDocument();
  });

  it('displays navigation tabs', () => {
    renderWithRouter(<App />);
    expect(screen.getByText('LinkedIn Connections')).toBeInTheDocument();
    expect(screen.getByText('Jobs Applied')).toBeInTheDocument();
    expect(screen.getByText('Companies & People')).toBeInTheDocument();
  });

  it('shows API status link', () => {
    renderWithRouter(<App />);
    const apiStatusLink = screen.getByText('API Status');
    expect(apiStatusLink).toBeInTheDocument();
    expect(apiStatusLink.getAttribute('href')).toBe('http://localhost:3001/health');
  });
});