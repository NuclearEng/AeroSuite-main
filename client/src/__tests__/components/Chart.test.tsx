import React from 'react';
import { render, screen } from '@testing-library/react';
import { renderWithProviders } from '../test-utils';
import Chart from '../../components/common/Chart';

// Mock the Chart.js library
jest.mock('react-chartjs-2', () => ({
  Line: (props) => <canvas data-testid="line-chart" data-props={JSON.stringify(props)} />,
  Bar: (props) => <canvas data-testid="bar-chart" data-props={JSON.stringify(props)} />,
  Pie: (props) => <canvas data-testid="pie-chart" data-props={JSON.stringify(props)} />,
  Doughnut: (props) => <canvas data-testid="doughnut-chart" data-props={JSON.stringify(props)} />,
  Radar: (props) => <canvas data-testid="radar-chart" data-props={JSON.stringify(props)} />,
}));

describe('Chart Component', () => {
  const lineChartData = {
    labels: ['January', 'February', 'March', 'April', 'May'],
    datasets: [
      {
        label: 'Sales',
        data: [65, 59, 80, 81, 56],
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ],
  };

  const barChartData = {
    labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple'],
    datasets: [
      {
        label: 'Colors',
        data: [12, 19, 3, 5, 2],
        backgroundColor: [
          'rgba(255, 99, 132, 0.2)',
          'rgba(54, 162, 235, 0.2)',
          'rgba(255, 206, 86, 0.2)',
          'rgba(75, 192, 192, 0.2)',
          'rgba(153, 102, 255, 0.2)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const pieChartData = {
    labels: ['Red', 'Blue', 'Yellow'],
    datasets: [
      {
        label: 'Dataset 1',
        data: [300, 50, 100],
        backgroundColor: [
          'rgb(255, 99, 132)',
          'rgb(54, 162, 235)',
          'rgb(255, 205, 86)',
        ],
      },
    ],
  };

  test('renders line chart correctly', () => {
    renderWithProviders(
      <Chart
        type="line"
        data={lineChartData}
        title="Sales Chart"
        height={300}
      />
    );
    
    // Check that chart title is rendered
    expect(screen.getByText('Sales Chart')).toBeInTheDocument();
    
    // Check that line chart is rendered
    const chart = screen.getByTestId('line-chart');
    expect(chart).toBeInTheDocument();
    
    // Check that data is passed correctly
    const chartProps = JSON.parse(chart.getAttribute('data-props') || '{}');
    expect(chartProps.data).toEqual(lineChartData);
  });

  test('renders bar chart correctly', () => {
    renderWithProviders(
      <Chart
        type="bar"
        data={barChartData}
        title="Colors Chart"
        height={300}
      />
    );
    
    // Check that chart title is rendered
    expect(screen.getByText('Colors Chart')).toBeInTheDocument();
    
    // Check that bar chart is rendered
    const chart = screen.getByTestId('bar-chart');
    expect(chart).toBeInTheDocument();
    
    // Check that data is passed correctly
    const chartProps = JSON.parse(chart.getAttribute('data-props') || '{}');
    expect(chartProps.data).toEqual(barChartData);
  });

  test('renders pie chart correctly', () => {
    renderWithProviders(
      <Chart
        type="pie"
        data={pieChartData}
        title="Distribution Chart"
        height={300}
      />
    );
    
    // Check that chart title is rendered
    expect(screen.getByText('Distribution Chart')).toBeInTheDocument();
    
    // Check that pie chart is rendered
    const chart = screen.getByTestId('pie-chart');
    expect(chart).toBeInTheDocument();
    
    // Check that data is passed correctly
    const chartProps = JSON.parse(chart.getAttribute('data-props') || '{}');
    expect(chartProps.data).toEqual(pieChartData);
  });

  test('renders doughnut chart correctly', () => {
    renderWithProviders(
      <Chart
        type="doughnut"
        data={pieChartData}
        title="Doughnut Chart"
        height={300}
      />
    );
    
    // Check that chart title is rendered
    expect(screen.getByText('Doughnut Chart')).toBeInTheDocument();
    
    // Check that doughnut chart is rendered
    const chart = screen.getByTestId('doughnut-chart');
    expect(chart).toBeInTheDocument();
  });

  test('renders radar chart correctly', () => {
    const radarChartData = {
      labels: ['Eating', 'Drinking', 'Sleeping', 'Working', 'Coding'],
      datasets: [
        {
          label: 'Person 1',
          data: [65, 59, 90, 81, 76],
          fill: true,
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          borderColor: 'rgb(255, 99, 132)',
        },
      ],
    };
    
    renderWithProviders(
      <Chart
        type="radar"
        data={radarChartData}
        title="Radar Chart"
        height={300}
      />
    );
    
    // Check that chart title is rendered
    expect(screen.getByText('Radar Chart')).toBeInTheDocument();
    
    // Check that radar chart is rendered
    const chart = screen.getByTestId('radar-chart');
    expect(chart).toBeInTheDocument();
  });

  test('renders chart with custom options', () => {
    const customOptions = {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        tooltip: {
          mode: 'index',
          intersect: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    };
    
    renderWithProviders(
      <Chart
        type="line"
        data={lineChartData}
        options={customOptions}
        title="Custom Options Chart"
        height={300}
      />
    );
    
    // Check that chart is rendered
    const chart = screen.getByTestId('line-chart');
    expect(chart).toBeInTheDocument();
    
    // Check that options are passed correctly
    const chartProps = JSON.parse(chart.getAttribute('data-props') || '{}');
    expect(chartProps.options).toEqual(customOptions);
  });

  test('renders chart with custom height', () => {
    renderWithProviders(
      <Chart
        type="line"
        data={lineChartData}
        title="Custom Height Chart"
        height={500}
      />
    );
    
    // Check that chart container has correct height
    const chartContainer = screen.getByText('Custom Height Chart').parentElement;
    expect(chartContainer).toHaveStyle('height: 500px');
  });

  test('renders chart without title', () => {
    renderWithProviders(
      <Chart
        type="line"
        data={lineChartData}
        height={300}
      />
    );
    
    // Check that there's no title element
    const titleElements = document.querySelectorAll('h6');
    const hasTitle = Array.from(titleElements).some(el => el.textContent?.trim() !== '');
    expect(hasTitle).toBeFalsy();
  });

  test('applies custom styles', () => {
    const { container } = renderWithProviders(
      <Chart
        type="line"
        data={lineChartData}
        title="Styled Chart"
        height={300}
        sx={{ backgroundColor: 'rgb(240, 240, 240)', borderRadius: '8px' }}
      />
    );
    
    // Check that custom styles are applied
    const chartCard = container.firstChild;
    expect(chartCard).toHaveStyle('background-color: rgb(240, 240, 240)');
    expect(chartCard).toHaveStyle('border-radius: 8px');
  });
}); 