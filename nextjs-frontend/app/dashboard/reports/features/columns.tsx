"use client";

import ColumnFilter from "@/components/column-filter";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconDotsVertical, IconDownload } from "@tabler/icons-react";
import { ColumnDef } from "@tanstack/react-table";

interface Product {
  id: number;
  documentId: string;
  name: string;
}

interface SaleProduct {
  product: Product;
  quantity: number;
  price: number;
}

interface Sale {
  id: number;
  documentId: string;
  date: string;
  total: number | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  invoice_number: string;
  discount_amount: number;
  tax_amount: number;
  subtotal: number;
  notes: string;
  products?: SaleProduct[];
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

interface Filters {
  customer_name: string;
  invoice_number: string;
}

const openInvoicePreview = (sale: Sale) => {
  const total = sale.subtotal + sale.tax_amount - sale.discount_amount;

  // Generate line items HTML
  const lineItemsHTML = (sale.products || [])
    .map(
      (item) => `
    <tr>
      <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb;">${item.product.name}</td>
      <td style="text-align: center; padding: 12px 8px; border-bottom: 1px solid #e5e7eb;">${item.quantity}</td>
      <td style="text-align: right; padding: 12px 8px; border-bottom: 1px solid #e5e7eb;">₹${item.price.toLocaleString()}</td>
      <td style="text-align: right; padding: 12px 8px; border-bottom: 1px solid #e5e7eb;">₹${(item.quantity * item.price).toLocaleString()}</td>
    </tr>
  `,
    )
    .join("");

  const invoiceHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invoice ${sale.invoice_number}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: Arial, sans-serif;
          padding: 40px;
          background: #f3f4f6;
          color: #111827;
        }
        .container {
          max-width: 900px;
          margin: 0 auto;
          background: white;
          padding: 60px;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .header { margin-bottom: 40px; text-align: center; }
        .header h1 { font-size: 36px; margin-bottom: 8px; color: #111827; }
        .header p { font-size: 14px; color: #6b7280; }
        .invoice-info { text-align: right; margin-bottom: 40px; }
        .section { margin-bottom: 40px; }
        .section-title {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 16px;
          color: #6b7280;
          text-transform: uppercase;
          border-bottom: 2px solid #111827;
          padding-bottom: 8px;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 120px 1fr;
          gap: 12px;
        }
        .info-label { font-weight: 600; color: #111827; }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 16px;
        }
        th {
          background-color: #f9fafb;
          font-weight: 600;
          font-size: 13px;
          padding: 12px 8px;
          text-align: left;
          border-bottom: 1px solid #d1d5db;
        }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .totals {
          margin-top: 40px;
          float: right;
          width: 320px;
        }
        .totals-row {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid #e5e7eb;
        }
        .totals-row.total {
          font-weight: bold;
          font-size: 20px;
          border-top: 2px solid #111827;
          border-bottom: none;
          padding-top: 16px;
          margin-top: 8px;
        }
        .footer {
          margin-top: 100px;
          text-align: center;
          color: #6b7280;
          font-size: 12px;
          clear: both;
        }
        .download-btn {
          position: fixed;
          top: 20px;
          right: 20px;
          background: #2563eb;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          display: flex;
          align-items: center;
          gap: 8px;
          z-index: 1000;
        }
        .download-btn:hover {
          background: #1d4ed8;
        }
        @media print {
          body { background: white; padding: 0; }
          .container { box-shadow: none; padding: 40px; }
          .download-btn { display: none; }
        }
      </style>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.2/jspdf.umd.min.js"></script>
    </head>
    <body>
      <button class="download-btn" onclick="downloadPDF()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
        Download PDF
      </button>

      <div class="container" id="invoice-content">
        <div class="header">
          <h1>INVOICE</h1>
          <p>Invoice #: ${sale.invoice_number}</p>
        </div>

        <div class="invoice-info">
          <p><strong>Date:</strong> ${new Date(sale.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
        </div>

        <div class="section">
          <div class="section-title">Bill To</div>
          <div class="info-grid">
            <div class="info-label">Customer:</div>
            <div>${sale.customer_name}</div>
            <div class="info-label">Email:</div>
            <div>${sale.customer_email}</div>
            <div class="info-label">Phone:</div>
            <div>${sale.customer_phone}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Items</div>
          <table>
            <thead>
              <tr>
                <th style="width: 50%;">Product</th>
                <th class="text-center" style="width: 15%;">Quantity</th>
                <th class="text-right" style="width: 17.5%;">Price</th>
                <th class="text-right" style="width: 17.5%;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${lineItemsHTML || '<tr><td colspan="4" style="text-align: center; padding: 32px; color: #9ca3af;">No items</td></tr>'}
            </tbody>
          </table>
        </div>

        <div class="totals">
          <div class="totals-row">
            <span>Subtotal:</span>
            <span>₹${sale.subtotal.toLocaleString()}</span>
          </div>
          <div class="totals-row">
            <span>Tax:</span>
            <span>₹${sale.tax_amount.toLocaleString()}</span>
          </div>
          <div class="totals-row">
            <span>Discount:</span>
            <span>-₹${sale.discount_amount.toLocaleString()}</span>
          </div>
          <div class="totals-row total">
            <span>Total:</span>
            <span>₹${total.toLocaleString()}</span>
          </div>
        </div>

        ${
          sale.notes
            ? `
        <div class="section" style="margin-top: 60px; clear: both;">
          <div class="section-title">Notes</div>
          <p style="white-space: pre-wrap;">${sale.notes}</p>
        </div>
        `
            : '<div style="clear: both;"></div>'
        }

        <div class="footer">
          <p>Thank you for your business!</p>
        </div>
      </div>

      <script>
        async function downloadPDF() {
          try {
            const { jsPDF } = window.jspdf;
            const element = document.getElementById('invoice-content');

            const canvas = await html2canvas(element, {
              scale: 2,
              useCORS: true,
              logging: false,
              backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
              orientation: 'portrait',
              unit: 'mm',
              format: 'a4'
            });

            const imgWidth = 210;
            const pageHeight = 297;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
              position = heightLeft - imgHeight;
              pdf.addPage();
              pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
              heightLeft -= pageHeight;
            }

            pdf.save('Invoice-${sale.invoice_number}.pdf');
          } catch (error) {
            console.error('Failed to generate PDF:', error);
            alert('Failed to generate PDF. Please try again.');
          }
        }
      </script>
    </body>
    </html>
  `;

  const previewWindow = window.open("", "_blank");
  if (previewWindow) {
    previewWindow.document.write(invoiceHTML);
    previewWindow.document.close();
  }
};

export const getReportColumns = (
  filters: Filters,
  handleFilterChange: (key: string, value: string) => void,
): ColumnDef<Sale>[] => {
  return [
    {
      accessorKey: "invoice_number",
      header: () => (
        <ColumnFilter
          label="Invoice #"
          placeholder="Filter invoice..."
          value={filters.invoice_number || ""}
          onChange={(val: string) => handleFilterChange("invoice_number", val)}
        />
      ),
      cell: ({ row }) => {
        return (
          <span className="font-mono font-semibold">
            {row.original.invoice_number}
          </span>
        );
      },
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => {
        const date = new Date(row.original.date);
        return date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      },
    },
    {
      accessorKey: "customer_name",
      header: () => (
        <ColumnFilter
          label="Customer"
          placeholder="Filter customer..."
          value={filters.customer_name || ""}
          onChange={(val: string) => handleFilterChange("customer_name", val)}
        />
      ),
      cell: (info) => info.getValue(),
    },
    {
      accessorKey: "customer_email",
      header: "Email",
      cell: ({ row }) => {
        const email = row.original.customer_email;
        return email ? (
          <span className="text-sm">{email}</span>
        ) : (
          <span className="text-muted-foreground">N/A</span>
        );
      },
    },
    {
      accessorKey: "customer_phone",
      header: "Phone",
      cell: ({ row }) => {
        const phone = row.original.customer_phone;
        return phone ? (
          <span className="text-sm">{phone}</span>
        ) : (
          <span className="text-muted-foreground">N/A</span>
        );
      },
    },
    {
      accessorKey: "subtotal",
      header: "Subtotal",
      cell: ({ row }) => {
        return `₹${row.original.subtotal.toLocaleString()}`;
      },
    },
    {
      accessorKey: "tax_amount",
      header: "Tax",
      cell: ({ row }) => {
        return `₹${row.original.tax_amount.toLocaleString()}`;
      },
    },
    {
      accessorKey: "discount_amount",
      header: "Discount",
      cell: ({ row }) => {
        return `₹${row.original.discount_amount.toLocaleString()}`;
      },
    },
    {
      accessorKey: "total",
      header: "Total",
      cell: ({ row }) => {
        const total =
          row.original.subtotal +
          row.original.tax_amount -
          row.original.discount_amount;
        return <span className="font-semibold">₹{total.toLocaleString()}</span>;
      },
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => openInvoicePreview(row.original)}
            title="Download Invoice"
          >
            <IconDownload className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
                size="icon"
              >
                <IconDotsVertical />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32">
              <DropdownMenuItem
                onClick={() => openInvoicePreview(row.original)}
              >
                Download
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];
};
