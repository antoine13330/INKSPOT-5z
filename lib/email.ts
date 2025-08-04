import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: Number.parseInt(process.env.EMAIL_SERVER_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
})

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string
  subject: string
  html?: string
  text?: string
}) {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
    text,
  }

  await transporter.sendMail(mailOptions)
}

export async function sendMagicLinkEmail(email: string, url: string) {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Sign in to Social Media Pro",
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <h1 style="color: #3b82f6;">Sign in to Social Media Pro</h1>
        <p>Click the button below to sign in to your account:</p>
        <a href="${url}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
          Sign In
        </a>
        <p>If you didn't request this email, you can safely ignore it.</p>
        <p>This link will expire in 24 hours.</p>
      </div>
    `,
  }

  await transporter.sendMail(mailOptions)
}

export async function sendBookingConfirmationEmail(
  email: string,
  booking: {
    title: string
    startTime: Date
    endTime: Date
    proName: string
    clientName: string
    price: number
  },
) {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: `Booking Confirmed: ${booking.title}`,
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <h1 style="color: #10b981;">Booking Confirmed!</h1>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 16px 0;">
          <h2>${booking.title}</h2>
          <p><strong>Professional:</strong> ${booking.proName}</p>
          <p><strong>Client:</strong> ${booking.clientName}</p>
          <p><strong>Date:</strong> ${booking.startTime.toLocaleDateString()}</p>
          <p><strong>Time:</strong> ${booking.startTime.toLocaleTimeString()} - ${booking.endTime.toLocaleTimeString()}</p>
          <p><strong>Price:</strong> €${booking.price}</p>
        </div>
        <p>You will receive a reminder 24 hours before your appointment.</p>
      </div>
    `,
  }

  await transporter.sendMail(mailOptions)
}
