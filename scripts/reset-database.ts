import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import { createStripeCustomer, createStripeAccount } from "../lib/stripe"

const prisma = new PrismaClient()

async function resetDatabase() {
  console.log("🗑️  Starting database reset...")

  try {
    // Delete all data in the correct order (respecting foreign key constraints)
    console.log("Deleting all existing data...")
    
    await prisma.like.deleteMany()
    await prisma.comment.deleteMany()
    await prisma.post.deleteMany()
    await prisma.follow.deleteMany()
    await prisma.verificationToken.deleteMany()
    await prisma.magicLink.deleteMany()
    await prisma.pushSubscription.deleteMany()
    await prisma.searchHistory.deleteMany()
    await prisma.userInteraction.deleteMany()
    await prisma.review.deleteMany()
    await prisma.collaboration.deleteMany()
    await prisma.transaction.deleteMany()
    await prisma.payment.deleteMany()
    await prisma.booking.deleteMany()
    await prisma.message.deleteMany()
    await prisma.conversationMember.deleteMany()
    await prisma.conversation.deleteMany()
    await prisma.notification.deleteMany()
    await prisma.invoice.deleteMany()
    await prisma.user.deleteMany()

    console.log("✅ All data deleted successfully!")

    // Now reseed the database
    console.log("🌱 Starting database reseed...")

    // Create admin user
    const adminPassword = await bcrypt.hash("admin123", 12)
    const admin = await prisma.user.create({
      data: {
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

    // Create pro users with Stripe integration
    const proPassword = await bcrypt.hash("pro123", 12)
    
    // Create Stripe customer and account for pro1
    let pro1StripeCustomerId: string | undefined
    let pro1StripeAccountId: string | undefined
    
    try {
      const stripeCustomer = await createStripeCustomer(
        `temp_${Date.now()}`,
        "pierce@example.com",
        "Pierce Tattoo"
      )
      pro1StripeCustomerId = stripeCustomer.id
      
      const stripeAccount = await createStripeAccount(
        `temp_${Date.now()}`,
        "pierce@example.com",
        'FR'
      )
      pro1StripeAccountId = stripeAccount.id
    } catch (error) {
      console.warn("Failed to create Stripe entities for pro1:", error)
    }

    const pro1 = await prisma.user.create({
      data: {
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
        stripeCustomerId: pro1StripeCustomerId,
        stripeAccountId: pro1StripeAccountId,
      },
    })

    // Update Stripe entities with actual user ID
    if (pro1StripeCustomerId) {
      try {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY!)
        await stripe.customers.update(pro1StripeCustomerId, {
          metadata: { userId: pro1.id },
        })
      } catch (error) {
        console.warn("Failed to update Stripe customer metadata for pro1:", error)
      }
    }

    if (pro1StripeAccountId) {
      try {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY!)
        await stripe.accounts.update(pro1StripeAccountId, {
          metadata: { userId: pro1.id },
        })
      } catch (error) {
        console.warn("Failed to update Stripe account metadata for pro1:", error)
      }
    }

    // Create Stripe customer and account for pro2
    let pro2StripeCustomerId: string | undefined
    let pro2StripeAccountId: string | undefined
    
    try {
      const stripeCustomer = await createStripeCustomer(
        `temp_${Date.now()}`,
        "artist@example.com",
        "Gourmet Artist"
      )
      pro2StripeCustomerId = stripeCustomer.id
      
      const stripeAccount = await createStripeAccount(
        `temp_${Date.now()}`,
        "artist@example.com",
        'FR'
      )
      pro2StripeAccountId = stripeAccount.id
    } catch (error) {
      console.warn("Failed to create Stripe entities for pro2:", error)
    }

    const pro2 = await prisma.user.create({
      data: {
        email: "artist@example.com",
        username: "@gourmet_del_arte",
        passwordHash: proPassword,
        firstName: "Gourmet",
        lastName: "Artist",
        role: "PRO",
        verified: true, // Changed to true for testing
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
        stripeCustomerId: pro2StripeCustomerId,
        stripeAccountId: pro2StripeAccountId,
      },
    })

    // Update Stripe entities with actual user ID
    if (pro2StripeCustomerId) {
      try {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY!)
        await stripe.customers.update(pro2StripeCustomerId, {
          metadata: { userId: pro2.id },
        })
      } catch (error) {
        console.warn("Failed to update Stripe customer metadata for pro2:", error)
      }
    }

    if (pro2StripeAccountId) {
      try {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY!)
        await stripe.accounts.update(pro2StripeAccountId, {
          metadata: { userId: pro2.id },
        })
      } catch (error) {
        console.warn("Failed to update Stripe account metadata for pro2:", error)
      }
    }

    // Create client users with Stripe customers
    const clientPassword = await bcrypt.hash("client123", 12)
    
    const clients = await Promise.all([
      (async () => {
        let stripeCustomerId: string | undefined
        try {
          const stripeCustomer = await createStripeCustomer(
            `temp_${Date.now()}`,
            "client1@example.com",
            "Despoteur Fou"
          )
          stripeCustomerId = stripeCustomer.id
        } catch (error) {
          console.warn("Failed to create Stripe customer for client1:", error)
        }

        const client = await prisma.user.create({
          data: {
            email: "client1@example.com",
            username: "@despoteur_fou",
            passwordHash: clientPassword,
            firstName: "Despoteur",
            lastName: "Fou",
            role: "CLIENT",
            verified: true,
            status: "ACTIVE",
            bio: "Digital art enthusiast and tattoo collector",
            location: "Paris, France",
            avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
            stripeCustomerId,
          },
        })

        if (stripeCustomerId) {
          try {
            const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY!)
            await stripe.customers.update(stripeCustomerId, {
              metadata: { userId: client.id },
            })
          } catch (error) {
            console.warn("Failed to update Stripe customer metadata for client1:", error)
          }
        }

        return client
      })(),
      (async () => {
        let stripeCustomerId: string | undefined
        try {
          const stripeCustomer = await createStripeCustomer(
            `temp_${Date.now()}`,
            "client2@example.com",
            "The Homelander"
          )
          stripeCustomerId = stripeCustomer.id
        } catch (error) {
          console.warn("Failed to create Stripe customer for client2:", error)
        }

        const client = await prisma.user.create({
          data: {
            email: "client2@example.com",
            username: "@the_homelander",
            passwordHash: clientPassword,
            firstName: "The",
            lastName: "Homelander",
            role: "CLIENT",
            verified: true,
            status: "ACTIVE",
            bio: "Superhero enthusiast looking for custom artwork",
            location: "New York, USA",
            avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
            stripeCustomerId,
          },
        })

        if (stripeCustomerId) {
          try {
            const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY!)
            await stripe.customers.update(stripeCustomerId, {
              metadata: { userId: client.id },
            })
          } catch (error) {
            console.warn("Failed to update Stripe customer metadata for client2:", error)
          }
        }

        return client
      })(),
      (async () => {
        let stripeCustomerId: string | undefined
        try {
          const stripeCustomer = await createStripeCustomer(
            `temp_${Date.now()}`,
            "client3@example.com",
            "Art Lover"
          )
          stripeCustomerId = stripeCustomer.id
        } catch (error) {
          console.warn("Failed to create Stripe customer for client3:", error)
        }

        const client = await prisma.user.create({
          data: {
            email: "client3@example.com",
            username: "@art_lover",
            passwordHash: clientPassword,
            firstName: "Art",
            lastName: "Lover",
            role: "CLIENT",
            verified: true,
            status: "ACTIVE",
            bio: "Passionate about supporting local artists and creative projects",
            location: "London, UK",
            avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
            stripeCustomerId,
          },
        })

        if (stripeCustomerId) {
          try {
            const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY!)
            await stripe.customers.update(stripeCustomerId, {
              metadata: { userId: client.id },
            })
          } catch (error) {
            console.warn("Failed to update Stripe customer metadata for client3:", error)
          }
        }

        return client
      })(),
    ])

    // Create sample posts
    const posts = await Promise.all([
      prisma.post.create({
        data: {
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
      prisma.post.create({
        data: {
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
      prisma.post.create({
        data: {
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
    ])

    // Create some likes and follows
    await Promise.all([
      prisma.like.create({
        data: {
          userId: clients[0].id,
          postId: posts[0].id,
        },
      }),
      prisma.follow.create({
        data: {
          followerId: clients[0].id,
          followingId: pro1.id,
        },
      }),
    ])

    console.log("✅ Database reset and reseeded successfully!")
    console.log("\n📊 Created users:")
    console.log(`- Admin: ${admin.email} (password: admin123)`)
    console.log(`- Pro 1: ${pro1.email} (password: pro123)`)
    console.log(`- Pro 2: ${pro2.email} (password: pro123)`)
    console.log(`- Client 1: ${clients[0].email} (password: client123)`)
    console.log(`- Client 2: ${clients[1].email} (password: client123)`)
    console.log(`- Client 3: ${clients[2].email} (password: client123)`)
    console.log(`\n📝 Created ${posts.length} sample posts`)
    console.log("\n💳 Stripe integration:")
    console.log(`- Pro users have both customer and connect accounts`)
    console.log(`- Client users have customer accounts only`)
    console.log(`- Check your Stripe dashboard for new customers/accounts`)

  } catch (error) {
    console.error("❌ Error during database reset:", error)
    throw error
  }
}

resetDatabase()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 