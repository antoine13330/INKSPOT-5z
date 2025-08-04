import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function verifyDatabase() {
  console.log("🔍 Verifying database state...")

  try {
    // Check users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        verified: true,
        stripeCustomerId: true,
        stripeAccountId: true,
      },
      orderBy: { email: 'asc' }
    })

    console.log(`\n👥 Users (${users.length} total):`)
    users.forEach(user => {
      const stripeInfo = user.stripeCustomerId 
        ? `✅ Customer: ${user.stripeCustomerId.slice(0, 8)}...` 
        : "❌ No Stripe Customer"
      
      const connectInfo = user.stripeAccountId 
        ? `✅ Connect: ${user.stripeAccountId.slice(0, 8)}...` 
        : user.role === "PRO" ? "❌ No Stripe Connect" : ""

      console.log(`  - ${user.email} (${user.role}) - ${stripeInfo} ${connectInfo}`)
    })

    // Check posts
    const posts = await prisma.post.findMany({
      select: {
        id: true,
        content: true,
        authorId: true,
        hashtags: true,
        likesCount: true,
      }
    })

    console.log(`\n📝 Posts (${posts.length} total):`)
    posts.forEach(post => {
      console.log(`  - ${post.content.slice(0, 50)}... (${post.hashtags.length} hashtags, ${post.likesCount} likes)`)
    })

    // Check likes
    const likes = await prisma.like.count()
    console.log(`\n❤️  Likes: ${likes} total`)

    // Check follows
    const follows = await prisma.follow.count()
    console.log(`👥 Follows: ${follows} total`)

    // Summary
    console.log(`\n📊 Summary:`)
    console.log(`  - Users: ${users.length}`)
    console.log(`  - Posts: ${posts.length}`)
    console.log(`  - Likes: ${likes}`)
    console.log(`  - Follows: ${follows}`)
    
    const verifiedUsers = users.filter(u => u.verified).length
    const stripeCustomers = users.filter(u => u.stripeCustomerId).length
    const stripeConnect = users.filter(u => u.stripeAccountId).length
    
    console.log(`  - Verified users: ${verifiedUsers}/${users.length}`)
    console.log(`  - Stripe customers: ${stripeCustomers}/${users.length}`)
    console.log(`  - Stripe connect accounts: ${stripeConnect}/${users.filter(u => u.role === "PRO").length} PRO users`)

    console.log("\n✅ Database verification complete!")

  } catch (error) {
    console.error("❌ Error during verification:", error)
    throw error
  }
}

verifyDatabase()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 