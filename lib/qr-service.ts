"use client";

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// 85.6mm x 54mm at 300 DPI
const CARD_WIDTH_PX = 1011;
const CARD_HEIGHT_PX = 638;

const captureElement = async (element: HTMLElement): Promise<string | null> => {
  try {
    const canvas = await html2canvas(element, {
      scale: 3, // Increase scale for higher resolution
      useCORS: true,
      backgroundColor: null,
    });
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Error capturing element:', error);
    return null;
  }
};

export const downloadCredentialAsPNG = async (element: HTMLElement | null, fileName: string) => {
  if (!element) return;
  const dataUrl = await captureElement(element);
  if (!dataUrl) return;

  const link = document.createElement('a');
  link.download = `${fileName}.png`;
  link.href = dataUrl;
  link.click();
};

export const downloadCredentialAsPDF = async (element: HTMLElement | null, fileName:string) => {
  if (!element) return;
  const dataUrl = await captureElement(element);
  if (!dataUrl) return;

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [85.6, 54],
  });

  pdf.addImage(dataUrl, 'PNG', 0, 0, 85.6, 54);
  pdf.save(`${fileName}.pdf`);
};

export const printCredential = async (element: HTMLElement | null) => {
  if (!element) return;
  const dataUrl = await captureElement(element);
  if (!dataUrl) return;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(`
      <html>
        <head>
          <title>Imprimir Credencial</title>
          <style>
            @page { size: 85.6mm 54mm; margin: 0; }
            body { margin: 0; }
            img { width: 100%; height: 100%; }
          </style>
        </head>
        <body>
          <img src="${dataUrl}" />
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 250);
  }
};
