import { utils as XLSXUtils, writeFile as writeXLSXFile } from 'xlsx';
import jsPDF from 'jspdf';
import { saveAs } from 'file-saver';
import axios from 'axios';

/**
 * Exports data to a CSV file
 * 
 * @param {any[]} data - Array of objects to be exported
 * @param {string} filename - Name of the file without extension
 * @description Converts an array of objects to a CSV file and triggers download
 * @example
 * // Export user data to CSV
 * exportToCSV([{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }], 'users');
 */
export function exportToCSV(data: any[], filename: string) {
  const ws = XLSXUtils.json_to_sheet(data);
  const wb = XLSXUtils.book_new();
  XLSXUtils.book_append_sheet(wb, ws, 'Sheet1');
  writeXLSXFile(wb, `${filename}.csv`, { bookType: 'csv' });
}

/**
 * Exports data to an Excel file (.xlsx)
 * 
 * @param {any[]} data - Array of objects to be exported
 * @param {string} filename - Name of the file without extension
 * @description Converts an array of objects to an Excel file and triggers download
 * @example
 * // Export product data to Excel
 * exportToExcel([{ id: 101, product: 'Laptop' }], 'products');
 */
export function exportToExcel(data: any[], filename: string) {
  const ws = XLSXUtils.json_to_sheet(data);
  const wb = XLSXUtils.book_new();
  XLSXUtils.book_append_sheet(wb, ws, 'Sheet1');
  writeXLSXFile(wb, `${filename}.xlsx`, { bookType: 'xlsx' });
}

/**
 * Exports data to a PDF file
 * 
 * @param {any[]} data - Array of objects to be exported
 * @param {string} filename - Name of the file without extension
 * @description Converts an array of objects to a PDF file with a table and triggers download
 * @example
 * // Export report data to PDF
 * exportToPDF([{ quarter: 'Q1', sales: 10000 }], 'quarterly_report');
 */
export function exportToPDF(data: any[], filename: string) {
  const doc = new jsPDF();
  if (data.length > 0) {
    const columns = Object.keys(data[0]);
    const rows = data.map(row => columns.map(col => String(row[col] || '')));
    
    // Simple table rendering without autoTable plugin
    let yPosition = 20;
    const xPosition = 10;
    const lineHeight = 10;
    const cellWidth = 50;
    
    // Add title
    doc.setFontSize(16);
    doc.text(filename, xPosition, yPosition);
    yPosition += lineHeight * 2;
    
    // Add headers
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    columns.forEach((col, index) => {
      doc.text(col, xPosition + (index * cellWidth), yPosition);
    });
    yPosition += lineHeight;
    
    // Add rows
    doc.setFont('helvetica', 'normal');
    rows.forEach((row) => {
      row.forEach((cell, index) => {
        // Truncate long text
        const text = cell.length > 15 ? cell.substring(0, 15) + '...' : cell;
        doc.text(text, xPosition + (index * cellWidth), yPosition);
      });
      yPosition += lineHeight;
      
      // Add new page if needed
      if (yPosition > 280) {
        doc.addPage();
        yPosition = 20;
      }
    });
  } else {
    doc.text('No data available', 10, 10);
  }
  doc.save(`${filename}.pdf`);
}

/**
 * Exports data using the server API (for large datasets or complex formatting)
 * 
 * @param {('csv'|'excel'|'pdf'|'json')} format - Export file format
 * @param {string} endpoint - API endpoint for the export
 * @param {any} [data] - Optional data to send to the server
 * @param {string} [filename] - Optional filename without extension (defaults to 'export')
 * @returns {Promise<void>} Promise that resolves when the export is complete
 * @throws {Error} If the API request fails
 * @description Makes an API request to export data and handles the file download response
 * @example
 * // Export supplier data via API
 * await exportViaApi('excel', 'suppliers/export', { status: 'active' }, 'active_suppliers');
 */
export async function exportViaApi(format: 'csv' | 'excel' | 'pdf' | 'json', endpoint: string, data?: any, filename?: string) {
  try {
    // Set default filename if not provided
    const baseFilename = filename || 'export';
    
    // Determine the appropriate file extension
    const extension = format === 'excel' ? 'xlsx' : format;
    
    // Make the API request with responseType blob for file download
    const response = await axios({
      url: `/api/export/${endpoint}?format=${format}`,
      method: data ? 'POST' : 'GET',
      data: data || undefined,
      responseType: 'blob',
      headers: {
        'Accept': 'application/octet-stream',
      }
    });
    
    // Create a blob from the response data
    const blob = new Blob([response.data], {
      type: response.headers['content-type']
    });
    
    // Use file-saver to save the blob
    saveAs(blob, `${baseFilename}.${extension}`);
  } catch (_error) {
    console.error('Error exporting via API:', _error);
    throw _error;
  }
} 