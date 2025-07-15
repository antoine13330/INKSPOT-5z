import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding database...")

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 12)
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      username: "@admin",
      passwordHash: adminPassword,
      firstName: "Admin",
      lastName: "User",
      role: "ADMIN",
      verified: true,
      status: "ACTIVE",
    },
  })

  // Create pro users with custom themes
  const proPassword = await bcrypt.hash("pro123", 12)
  const pro1 = await prisma.user.upsert({
    where: { email: "pierce@example.com" },
    update: {},
    create: {
      email: "pierce@example.com",
      username: "@pierce",
      passwordHash: proPassword,
      firstName: "Pierce",
      lastName: "Tattoo",
      role: "PRO",
      verified: true,
      status: "ACTIVE",
      businessName: "Pierce Tattoo Studio",
      bio: "Professional tattoo artist specializing in custom designs and traditional art. 15+ years of experience.",
      location: "Paris, France",
      website: "https://pierce-tattoo.com",
      phone: "+33 1 23 45 67 89",
      hourlyRate: 80,
      specialties: ["Traditional Tattoo", "Custom Design", "Black & Grey", "Realism"],
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      coverImage: "https://images.unsplash.com/photo-1565058379802-bbe93b2f703a?w=800&h=300&fit=crop",
      portfolio: [
        "https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?w=400&h=400&fit=crop",
        "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=400&h=400&fit=crop",
        "https://images.unsplash.com/photo-1590736969955-71cc94901144?w=400&h=400&fit=crop",
      ],
      profileTheme: {
        primaryColor: "#dc2626",
        secondaryColor: "#1f2937",
        accentColor: "#fbbf24",
        backgroundColor: "#111827",
        textColor: "#ffffff",
        fontFamily: "Oswald",
      },
      stripeCustomerId: "cus_test_pierce",
      stripeAccountId: "acct_test_pierce",
    },
  })

  const pro2 = await prisma.user.upsert({
    where: { email: "artist@example.com" },
    update: {},
    create: {
      email: "artist@example.com",
      username: "@gourmet_del_arte",
      passwordHash: proPassword,
      firstName: "Gourmet",
      lastName: "Artist",
      role: "PRO",
      verified: false,
      status: "ACTIVE",
      businessName: "Gourmet Art Studio",
      bio: "Digital artist and graphic designer creating stunning visual experiences.",
      location: "Lyon, France",
      website: "https://gourmet-art.com",
      hourlyRate: 60,
      specialties: ["Digital Art", "Logo Design", "Illustration", "Branding"],
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
      coverImage: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&h=300&fit=crop",
      portfolio: [
        "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=400&fit=crop",
        "https://images.unsplash.com/photo-1558655146-d09347e92766?w=400&h=400&fit=crop",
      ],
      profileTheme: {
        primaryColor: "#3b82f6",
        secondaryColor: "#1e293b",
        accentColor: "#10b981",
        backgroundColor: "#0f172a",
        textColor: "#f1f5f9",
        fontFamily: "Poppins",
      },
      stripeCustomerId: "cus_test_gourmet",
      stripeAccountId: "acct_test_gourmet",
    },
  })

  // Create client users
  const clientPassword = await bcrypt.hash("client123", 12)
  const clients = await Promise.all([
    prisma.user.upsert({
      where: { email: "client1@example.com" },
      update: {},
      create: {
        email: "client1@example.com",
        username: "@despoteur_fou",
        passwordHash: clientPassword,
        firstName: "Despoteur",
        lastName: "Fou",
        role: "CLIENT",
        status: "ACTIVE",
        bio: "Digital art enthusiast and tattoo collector",
        location: "Paris, France",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
        stripeCustomerId: "cus_test_client1",
      },
    }),
    prisma.user.upsert({
      where: { email: "client2@example.com" },
      update: {},
      create: {
        email: "client2@example.com",
        username: "@the_homelander",
        passwordHash: clientPassword,
        firstName: "The",
        lastName: "Homelander",
        role: "CLIENT",
        status: "ACTIVE",
        bio: "Superhero enthusiast looking for custom artwork",
        location: "New York, USA",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
        stripeCustomerId: "cus_test_client2",
      },
    }),
    prisma.user.upsert({
      where: { email: "client3@example.com" },
      update: {},\
