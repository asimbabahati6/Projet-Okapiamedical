import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle, PageBreak, Header, Footer, PageNumber } from 'docx';

export interface DocumentSection {
  title: string;
  content?: string | string[];
  type?: 'text' | 'table' | 'list';
  placeholder?: string;
  tableData?: {
    headers: string[];
    rows: string[][];
  };
}

export interface MedicalDocumentData {
  title: string;
  patientName?: string;
  patientNumber?: string;
  documentDate?: string;
  sections: DocumentSection[];
  footerText?: string;
}

const OKAPIA_BLUE = '#0F4A77';
const HEADER_HEIGHT = 40;
const FOOTER_HEIGHT = 15;
const PAGE_MARGIN = 25.4;

function addHeaderToPDF(doc: jsPDF, pageNumber: number, totalPages: number) {
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(20);
  doc.setTextColor(OKAPIA_BLUE);
  doc.setFont('helvetica', 'bold');
  doc.text('OKAPIA MEDICAL', pageWidth / 2, 20, { align: 'center' });

  doc.setLineWidth(0.5);
  doc.setDrawColor(OKAPIA_BLUE);
  doc.line(PAGE_MARGIN, HEADER_HEIGHT - 5, pageWidth - PAGE_MARGIN, HEADER_HEIGHT - 5);
}

function addFooterToPDF(doc: jsPDF, pageNumber: number, totalPages: number, footerText?: string) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');

  doc.text(
    `Page ${pageNumber} sur ${totalPages}`,
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  );

  const defaultFooterText = footerText || 'Document Confidentiel - Usage Médical Uniquement - OKAPIA MEDICAL';
  doc.text(
    defaultFooterText,
    pageWidth / 2,
    pageHeight - 5,
    { align: 'center' }
  );
}

export function exportMedicalDocumentToPDF(data: MedicalDocumentData): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = HEADER_HEIGHT + 10;

  addHeaderToPDF(doc, 1, 1);

  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text(data.title, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;

  if (data.patientName || data.patientNumber || data.documentDate) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);

    if (data.patientName) {
      doc.text(`Patient: ${data.patientName}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 5;
    }
    if (data.patientNumber) {
      doc.text(`N° Patient: ${data.patientNumber}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 5;
    }
    if (data.documentDate) {
      doc.text(`Date: ${data.documentDate}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 5;
    }
  }

  yPosition += 10;

  data.sections.forEach((section, index) => {
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      const currentPage = doc.getCurrentPageInfo().pageNumber;
      addHeaderToPDF(doc, currentPage, currentPage);
      yPosition = HEADER_HEIGHT + 10;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(OKAPIA_BLUE);
    doc.text(section.title, PAGE_MARGIN, yPosition);
    yPosition += 7;

    if (section.type === 'table' && section.tableData) {
      autoTable(doc, {
        startY: yPosition,
        head: [section.tableData.headers],
        body: section.tableData.rows,
        theme: 'striped',
        styles: {
          fontSize: 9,
          cellPadding: 3,
          font: 'helvetica'
        },
        headStyles: {
          fillColor: [15, 74, 119],
          textColor: 255,
          fontStyle: 'bold'
        },
        margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
        didDrawPage: (data) => {
          const currentPage = doc.getCurrentPageInfo().pageNumber;
          if (currentPage > 1) {
            addHeaderToPDF(doc, currentPage, currentPage);
          }
        }
      });
      yPosition = (doc as any).lastAutoTable.finalY + 10;
    } else if (section.type === 'list' && Array.isArray(section.content)) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);

      section.content.forEach((item) => {
        if (yPosition > pageHeight - 40) {
          doc.addPage();
          const currentPage = doc.getCurrentPageInfo().pageNumber;
          addHeaderToPDF(doc, currentPage, currentPage);
          yPosition = HEADER_HEIGHT + 10;
        }
        const lines = doc.splitTextToSize(`• ${item}`, pageWidth - (PAGE_MARGIN * 2));
        doc.text(lines, PAGE_MARGIN + 5, yPosition);
        yPosition += lines.length * 5;
      });
      yPosition += 5;
    } else {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);

      const content = Array.isArray(section.content) ? section.content.join('\n') : section.content;
      const lines = doc.splitTextToSize(content, pageWidth - (PAGE_MARGIN * 2));

      lines.forEach((line: string) => {
        if (yPosition > pageHeight - 40) {
          doc.addPage();
          const currentPage = doc.getCurrentPageInfo().pageNumber;
          addHeaderToPDF(doc, currentPage, currentPage);
          yPosition = HEADER_HEIGHT + 10;
        }
        doc.text(line, PAGE_MARGIN, yPosition);
        yPosition += 5;
      });
      yPosition += 5;
    }
  });

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooterToPDF(doc, i, totalPages, data.footerText);
  }

  const fileName = `${data.title.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}

export async function exportMedicalDocumentToWord(data: MedicalDocumentData): Promise<void> {
  const sections: any[] = [];

  const headerParagraphs = [
    new Paragraph({
      children: [
        new TextRun({
          text: 'OKAPIA MEDICAL',
          bold: true,
          size: 32,
          color: OKAPIA_BLUE.replace('#', ''),
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      border: {
        bottom: {
          color: OKAPIA_BLUE.replace('#', ''),
          space: 1,
          style: BorderStyle.SINGLE,
          size: 6,
        },
      },
      spacing: { after: 400 },
    }),
  ];

  const titleParagraphs = [
    new Paragraph({
      children: [
        new TextRun({
          text: data.title,
          bold: true,
          size: 28,
        }),
      ],
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
  ];

  const metadataParagraphs: Paragraph[] = [];
  if (data.patientName) {
    metadataParagraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Patient: ${data.patientName}`,
            size: 20,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
      })
    );
  }
  if (data.patientNumber) {
    metadataParagraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `N° Patient: ${data.patientNumber}`,
            size: 20,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
      })
    );
  }
  if (data.documentDate) {
    metadataParagraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Date: ${data.documentDate}`,
            size: 20,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 },
      })
    );
  }

  const contentParagraphs: Paragraph[] = [];

  data.sections.forEach((section) => {
    contentParagraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: section.title,
            bold: true,
            size: 24,
            color: OKAPIA_BLUE.replace('#', ''),
          }),
        ],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 200 },
      })
    );

    if (section.type === 'table' && section.tableData) {
      const tableRows = [
        new TableRow({
          children: section.tableData.headers.map(
            (header) =>
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: header,
                        bold: true,
                        color: 'FFFFFF',
                      }),
                    ],
                  }),
                ],
                shading: {
                  fill: OKAPIA_BLUE.replace('#', ''),
                },
              })
          ),
        }),
        ...section.tableData.rows.map(
          (row) =>
            new TableRow({
              children: row.map(
                (cell) =>
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [new TextRun(cell)],
                      }),
                    ],
                  })
              ),
            })
        ),
      ];

      contentParagraphs.push(
        new Paragraph({
          children: [],
          spacing: { after: 200 },
        })
      );

      sections.push({
        properties: {
          page: {
            margin: {
              top: 720,
              right: 720,
              bottom: 720,
              left: 720,
            },
          },
        },
        headers: {
          default: new Header({
            children: headerParagraphs,
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Page ',
                    size: 16,
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 16,
                  }),
                  new TextRun({
                    text: ' sur ',
                    size: 16,
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    size: 16,
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: data.footerText || 'Document Confidentiel - Usage Médical Uniquement - OKAPIA MEDICAL',
                    size: 14,
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
        },
        children: [...titleParagraphs, ...metadataParagraphs, ...contentParagraphs.slice(0, contentParagraphs.indexOf(contentParagraphs[contentParagraphs.length - 1]) + 1)],
      });

      return;
    } else if (section.type === 'list' && Array.isArray(section.content)) {
      section.content.forEach((item) => {
        contentParagraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `• ${item}`,
                size: 22,
              }),
            ],
            spacing: { after: 100 },
            indent: { left: 360 },
          })
        );
      });
    } else {
      const content = Array.isArray(section.content) ? section.content.join('\n\n') : section.content;
      const paragraphs = content.split('\n').filter(p => p.trim());

      paragraphs.forEach((para) => {
        contentParagraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: para,
                size: 22,
              }),
            ],
            spacing: { after: 150 },
          })
        );
      });
    }
  });

  if (sections.length === 0) {
    sections.push({
      properties: {
        page: {
          margin: {
            top: 720,
            right: 720,
            bottom: 720,
            left: 720,
          },
        },
      },
      headers: {
        default: new Header({
          children: headerParagraphs,
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: 'Page ',
                  size: 16,
                }),
                new TextRun({
                  children: [PageNumber.CURRENT],
                  size: 16,
                }),
                new TextRun({
                  text: ' sur ',
                  size: 16,
                }),
                new TextRun({
                  children: [PageNumber.TOTAL_PAGES],
                  size: 16,
                }),
              ],
              alignment: AlignmentType.CENTER,
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: data.footerText || 'Document Confidentiel - Usage Médical Uniquement - OKAPIA MEDICAL',
                  size: 14,
                }),
              ],
              alignment: AlignmentType.CENTER,
            }),
          ],
        }),
      },
      children: [...titleParagraphs, ...metadataParagraphs, ...contentParagraphs],
    });
  }

  const doc = new Document({
    sections,
  });

  const blob = await Packer.toBlob(doc);
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${data.title.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.docx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
