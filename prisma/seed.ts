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
      verified: true,
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
      update: {},
      create: {
        email: "client3@example.com",
        username: "@art_lover",
        passwordHash: clientPassword,
        firstName: "Art",
        lastName: "Lover",
        role: "CLIENT",
        status: "ACTIVE",
        bio: "Passionate about supporting local artists and creative projects",
        location: "London, UK",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
        stripeCustomerId: "cus_test_client3",
      },
    }),
  ])

  // Create sample posts with hashtags for search testing
  const posts = await Promise.all([
    // Posts from Pierce (Tattoo Artist)
    prisma.post.upsert({
      where: { id: "post_pierce_1" },
      update: {},
      create: {
        id: "post_pierce_1",
        content: "Just finished this amazing traditional Japanese sleeve! The client wanted something bold and meaningful. The process took 3 sessions and the result is absolutely stunning. #tattoo #japanese #traditional #sleeve #art",
        hashtags: ["tattoo", "japanese", "traditional", "sleeve", "art"],
        authorId: pro1.id,
        status: "PUBLISHED",
        likesCount: 45,
        commentsCount: 12,
        viewsCount: 234,
        publishedAt: new Date("2024-01-15"),
      },
    }),
    prisma.post.upsert({
      where: { id: "post_pierce_2" },
      update: {},
      create: {
        id: "post_pierce_2",
        content: "Black and grey realism portrait work. This piece represents the client's journey through life. Every detail matters in realism work. #realism #portrait #blackwork #tattoo #art",
        hashtags: ["realism", "portrait", "blackwork", "tattoo", "art"],
        authorId: pro1.id,
        status: "PUBLISHED",
        likesCount: 67,
        commentsCount: 8,
        viewsCount: 456,
        publishedAt: new Date("2024-01-10"),
      },
    }),
    prisma.post.upsert({
      where: { id: "post_pierce_3" },
      update: {},
      create: {
        id: "post_pierce_3",
        content: "Custom geometric design with watercolor elements. This style combines precision with artistic freedom. The client loved the final result! #geometric #watercolor #custom #design #tattoo",
        hashtags: ["geometric", "watercolor", "custom", "design", "tattoo"],
        authorId: pro1.id,
        status: "PUBLISHED",
        likesCount: 89,
        commentsCount: 15,
        viewsCount: 678,
        publishedAt: new Date("2024-01-05"),
      },
    }),

    // Posts from Gourmet (Digital Artist)
    prisma.post.upsert({
      where: { id: "post_gourmet_1" },
      update: {},
      create: {
        id: "post_gourmet_1",
        content: "New logo design for a tech startup. Clean, modern, and memorable. The client wanted something that represents innovation and growth. #logo #design #branding #digital #art",
        hashtags: ["logo", "design", "branding", "digital", "art"],
        authorId: pro2.id,
        status: "PUBLISHED",
        likesCount: 34,
        commentsCount: 6,
        viewsCount: 189,
        publishedAt: new Date("2024-01-12"),
      },
    }),
    prisma.post.upsert({
      where: { id: "post_gourmet_2" },
      update: {},
      create: {
        id: "post_gourmet_2",
        content: "Digital illustration for a children's book. Creating characters that kids will love and remember. This project was so much fun to work on! #illustration #digital #children #book #art",
        hashtags: ["illustration", "digital", "children", "book", "art"],
        authorId: pro2.id,
        status: "PUBLISHED",
        likesCount: 56,
        commentsCount: 9,
        viewsCount: 345,
        publishedAt: new Date("2024-01-08"),
      },
    }),
    prisma.post.upsert({
      where: { id: "post_gourmet_3" },
      update: {},
      create: {
        id: "post_gourmet_3",
        content: "Minimalist poster design for a music festival. Sometimes less is more. The typography and spacing create the perfect balance. #minimalist #poster #typography #design #art",
        hashtags: ["minimalist", "poster", "typography", "design", "art"],
        authorId: pro2.id,
        status: "PUBLISHED",
        likesCount: 78,
        commentsCount: 11,
        viewsCount: 567,
        publishedAt: new Date("2024-01-03"),
      },
    }),

    // Posts from clients
    prisma.post.upsert({
      where: { id: "post_client1_1" },
      update: {},
      create: {
        id: "post_client1_1",
        content: "Got my first tattoo today! Amazing experience with @pierce. The design is exactly what I wanted. Can't wait to show it off! #firsttattoo #experience #pierce #tattoo",
        hashtags: ["firsttattoo", "experience", "pierce", "tattoo"],
        authorId: clients[0].id,
        status: "PUBLISHED",
        likesCount: 23,
        commentsCount: 4,
        viewsCount: 123,
        publishedAt: new Date("2024-01-14"),
      },
    }),
    prisma.post.upsert({
      where: { id: "post_client2_1" },
      update: {},
      create: {
        id: "post_client2_1",
        content: "Looking for an artist to create a custom superhero design. Something unique and powerful. Any recommendations? #superhero #custom #design #art #commission",
        hashtags: ["superhero", "custom", "design", "art", "commission"],
        authorId: clients[1].id,
        status: "PUBLISHED",
        likesCount: 12,
        commentsCount: 7,
        viewsCount: 89,
        publishedAt: new Date("2024-01-13"),
      },
    }),
    prisma.post.upsert({
      where: { id: "post_client3_1" },
      update: {},
      create: {
        id: "post_client3_1",
        content: "Supporting local artists is so important! Just commissioned a beautiful piece from @gourmet_del_arte. The attention to detail is incredible. #supportlocal #art #commission #gourmet",
        hashtags: ["supportlocal", "art", "commission", "gourmet"],
        authorId: clients[2].id,
        status: "PUBLISHED",
        likesCount: 45,
        commentsCount: 3,
        viewsCount: 234,
        publishedAt: new Date("2024-01-11"),
      },
    }),
  ])

  // Create some likes and follows for engagement
  await Promise.all([
    // Likes
    prisma.like.upsert({
      where: { userId_postId: { userId: clients[0].id, postId: "post_pierce_1" } },
      update: {},
      create: {
        userId: clients[0].id,
        postId: "post_pierce_1",
      },
    }),
    prisma.like.upsert({
      where: { userId_postId: { userId: clients[1].id, postId: "post_gourmet_1" } },
      update: {},
      create: {
        userId: clients[1].id,
        postId: "post_gourmet_1",
      },
    }),
    prisma.like.upsert({
      where: { userId_postId: { userId: clients[2].id, postId: "post_pierce_2" } },
      update: {},
      create: {
        userId: clients[2].id,
        postId: "post_pierce_2",
      },
    }),

    // Follows
    prisma.follow.upsert({
      where: { followerId_followingId: { followerId: clients[0].id, followingId: pro1.id } },
      update: {},
      create: {
        followerId: clients[0].id,
        followingId: pro1.id,
      },
    }),
    prisma.follow.upsert({
      where: { followerId_followingId: { followerId: clients[2].id, followingId: pro2.id } },
      update: {},
      create: {
        followerId: clients[2].id,
        followingId: pro2.id,
      },
    }),
  ])

  console.log("✅ Database seeded successfully!")
  console.log("Created users:")
  console.log(`- Admin: ${admin.email}`)
  console.log(`- Pro 1: ${pro1.email}`)
  console.log(`- Pro 2: ${pro2.email}`)
  console.log(`- Clients: ${clients.map(c => c.email).join(", ")}`)
  console.log(`Created ${posts.length} posts with hashtags for search testing`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
