import { prisma } from "./prisma"
import { sendEmail } from "./email"

interface InvoiceData {
  invoiceNumber: string
  amount: number
  currency: string
  vatAmount?: number
  description: string
  dueDate: Date
  issuerId: string
  receiverId: string
  bookingId?: string
  paymentId?: string
}

interface InvoiceLineItem {
  description: string
  quantity: number
  unitPrice: number
  total: number
}

export async function generateInvoice(data: InvoiceData): Promise<string> {
  try {
    // Create invoice in database
    const invoice = await prisma.invoice.create({
      data,
      include: {
        issuer: true,
        receiver: true,
        booking: true,
        payment: true,
      },
    })

    // Generate PDF
    const pdfBuffer = await generateInvoicePDF(invoice)

    // Store PDF (you might want to use cloud storage like AWS S3)
    // For now, we'll just return the invoice ID
    
    return invoice.id
  } catch (error) {
    console.error("Error generating invoice:", error)
    throw new Error("Failed to generate invoice")
  }
}

export async function generateInvoicePDF(invoice: unknown): Promise<Buffer> {
  // This is a simplified PDF generation
  // In a real application, you'd use a library like PDFKit or Puppeteer
  
  const htmlContent = generateInvoiceHTML(invoice)
  
  // For now, return a mock PDF buffer
  // In production, you'd use something like:
  // const puppeteer = require('puppeteer')
  // const browser = await puppeteer.launch()
  // const page = await browser.newPage()
  // await page.setContent(htmlContent)
  // const pdfBuffer = await page.pdf({ format: 'A4' })
  // await browser.close()
  
  return Buffer.from(htmlContent, 'utf-8')
}

export function generateInvoiceHTML(invoice: unknown): string {
  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
    }).format(amount)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR').format(new Date(date))
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invoice ${invoice.invoiceNumber}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          color: #333;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 40px;
          border-bottom: 2px solid #007bff;
          padding-bottom: 20px;
        }
        .logo {
          font-size: 28px;
          font-weight: bold;
          color: #007bff;
        }
        .invoice-number {
          font-size: 18px;
          color: #666;
        }
        .details {
          display: flex;
          justify-content: space-between;
          margin-bottom: 40px;
        }
        .from, .to {
          width: 45%;
        }
        .from h3, .to h3 {
          margin-bottom: 10px;
          color: #007bff;
        }
        .invoice-info {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
        }
        .invoice-info h3 {
          margin-top: 0;
          color: #007bff;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        .items-table th,
        .items-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }
        .items-table th {
          background: #007bff;
          color: white;
        }
        .items-table .amount {
          text-align: right;
        }
        .totals {
          width: 300px;
          margin-left: auto;
          border: 1px solid #ddd;
          border-radius: 8px;
          overflow: hidden;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 12px 20px;
        }
        .total-row.subtotal {
          background: #f8f9fa;
        }
        .total-row.vat {
          background: #e9ecef;
        }
        .total-row.final {
          background: #007bff;
          color: white;
          font-weight: bold;
          font-size: 18px;
        }
        .footer {
          margin-top: 50px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          text-align: center;
          color: #666;
          font-size: 14px;
        }
        .payment-info {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 30px;
        }
        .payment-info h3 {
          margin-top: 0;
          color: #856404;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">INKSPOT</div>
        <div class="invoice-number">Invoice #${invoice.invoiceNumber}</div>
      </div>

      <div class="details">
        <div class="from">
          <h3>From:</h3>
          <p><strong>${invoice.issuer.name || invoice.issuer.email}</strong></p>
          <p>${invoice.issuer.email}</p>
          ${invoice.issuer.address ? `<p>${invoice.issuer.address}</p>` : ''}
        </div>
        <div class="to">
          <h3>To:</h3>
          <p><strong>${invoice.receiver.name || invoice.receiver.email}</strong></p>
          <p>${invoice.receiver.email}</p>
          ${invoice.receiver.address ? `<p>${invoice.receiver.address}</p>` : ''}
        </div>
      </div>

      <div class="invoice-info">
        <h3>Invoice Information</h3>
        <div class="info-row">
          <span><strong>Invoice Date:</strong></span>
          <span>${formatDate(invoice.createdAt)}</span>
        </div>
        <div class="info-row">
          <span><strong>Due Date:</strong></span>
          <span>${formatDate(invoice.dueDate)}</span>
        </div>
        ${invoice.booking ? `
        <div class="info-row">
          <span><strong>Service:</strong></span>
          <span>${invoice.booking.title}</span>
        </div>
        ` : ''}
      </div>

      <table class="items-table">
        <thead>
          <tr>
            <th>Description</th>
            <th>Quantity</th>
            <th>Unit Price</th>
            <th class="amount">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${invoice.description}</td>
            <td>1</td>
            <td class="amount">${formatCurrency(invoice.amount, invoice.currency)}</td>
            <td class="amount">${formatCurrency(invoice.amount, invoice.currency)}</td>
          </tr>
        </tbody>
      </table>

      <div class="totals">
        <div class="total-row subtotal">
          <span>Subtotal:</span>
          <span>${formatCurrency(invoice.amount - (invoice.vatAmount || 0), invoice.currency)}</span>
        </div>
        ${invoice.vatAmount ? `
        <div class="total-row vat">
          <span>VAT (20%):</span>
          <span>${formatCurrency(invoice.vatAmount, invoice.currency)}</span>
        </div>
        ` : ''}
        <div class="total-row final">
          <span>Total:</span>
          <span>${formatCurrency(invoice.amount, invoice.currency)}</span>
        </div>
      </div>

      ${!invoice.paidAt ? `
      <div class="payment-info">
        <h3>Payment Information</h3>
        <p><strong>Payment Due:</strong> ${formatDate(invoice.dueDate)}</p>
        <p>Please pay this invoice by the due date to avoid any service interruptions.</p>
      </div>
      ` : `
      <div class="payment-info" style="background: #d1edff; border-color: #0ea5e9;">
        <h3 style="color: #0369a1;">Payment Received</h3>
        <p>This invoice was paid on ${formatDate(invoice.paidAt)}. Thank you!</p>
      </div>
      `}

      <div class="footer">
        <p>Thank you for using INKSPOT!</p>
        <p>For questions about this invoice, please contact support@inkspot.com</p>
      </div>
    </body>
    </html>
  `
}

export async function sendInvoiceEmail(invoiceId: string): Promise<void> {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        issuer: true,
        receiver: true,
        booking: true,
      },
    })

    if (!invoice) {
      throw new Error("Invoice not found")
    }

    const pdfBuffer = await generateInvoicePDF(invoice)

    await sendEmail({
      to: invoice.receiver.email,
      subject: `Invoice ${invoice.invoiceNumber} from ${invoice.issuer.name || 'INKSPOT'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>New Invoice from ${invoice.issuer.name || 'INKSPOT'}</h2>
          
          <p>Hello ${invoice.receiver.name || 'there'},</p>
          
          <p>You have received a new invoice:</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Invoice Number:</strong> ${invoice.invoiceNumber}</p>
            <p><strong>Amount:</strong> €${invoice.amount}</p>
            <p><strong>Due Date:</strong> ${new Intl.DateTimeFormat('en-US').format(new Date(invoice.dueDate))}</p>
            <p><strong>Description:</strong> ${invoice.description}</p>
          </div>
          
          <p>Please find the detailed invoice attached as a PDF.</p>
          
          <p>You can also view and pay this invoice online by logging into your INKSPOT account.</p>
          
          <p>Thank you!</p>
          
          <p>Best regards,<br>The INKSPOT Team</p>
        </div>
      `,
      attachments: [
        {
          filename: `invoice-${invoice.invoiceNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    })

    console.log(`Invoice ${invoice.invoiceNumber} sent to ${invoice.receiver.email}`)
  } catch (error) {
    console.error("Error sending invoice email:", error)
    throw new Error("Failed to send invoice email")
  }
}

export async function markInvoiceAsPaid(invoiceId: string, paymentId?: string): Promise<void> {
  try {
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        paidAt: new Date(),
        paymentId,
      },
    })

    // Get invoice details for notification
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        issuer: true,
        receiver: true,
      },
    })

    if (invoice) {
      // Notify the issuer that payment was received
      await prisma.notification.create({
        data: {
          title: "Invoice Paid",
          message: `Invoice ${invoice.invoiceNumber} has been paid`,
          type: "PAYMENT",
          userId: invoice.issuerId,
          data: {
            invoiceId: invoice.id,
            amount: invoice.amount,
            type: "invoice_paid",
          },
        },
      })
    }
  } catch (error) {
    console.error("Error marking invoice as paid:", error)
    throw new Error("Failed to mark invoice as paid")
  }
}

export async function getInvoicesByUser(userId: string, type: "issued" | "received" = "received") {
  const field = type === "issued" ? "issuerId" : "receiverId"
  
  return await prisma.invoice.findMany({
    where: {
      [field]: userId,
    },
    include: {
      issuer: true,
      receiver: true,
      booking: true,
      payment: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  })
}