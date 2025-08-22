"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BottomNavigation } from "@/components/bottom-navigation"
import { Settings, Edit, MapPin, Calendar, LinkIcon } from "lucide-react"

export default function ProfilePage() {
  const [isFollowing, setIsFollowing] = useState(false)

  const userStats = {
    posts: 127,
    followers: 1234,
    following: 567,
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-md mx-auto bg-black min-h-screen">
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-gray-800">
          <h1 className="text-xl font-bold">Profile</h1>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-gray-400"
            // ACCESSIBILITY: Clear settings button label
            aria-label="Open profile settings"
          >
            <Settings className="w-5 h-5" aria-hidden="true" />
          </Button>
        </header>

        {/* Profile Info */}
        <main className="p-6">
          <div className="flex items-center space-x-4 mb-4">
            <Avatar 
              className="w-20 h-20"
              // ACCESSIBILITY: Profile avatar accessibility
              role="img"
              aria-label="@pierce's profile picture"
            >
              <AvatarImage 
                src="/placeholder.svg?height=80&width=80" 
                alt="Profile picture of @pierce, professional tattoo artist"
              />
              <AvatarFallback>@P</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h2 className="text-xl font-bold">@pierce</h2>
                <div 
                  className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center"
                  // ACCESSIBILITY: Verification badge
                  role="img"
                  aria-label="@pierce is a verified account"
                  title="Verified account"
                >
                  <span className="text-white text-xs" aria-hidden="true">✓</span>
                </div>
              </div>
              <p className="text-gray-400 mb-2">Tattoo Artist</p>
              <div 
                className="flex space-x-4 text-sm"
                // ACCESSIBILITY: Stats region
                role="region"
                aria-label="Profile statistics"
              >
                <span aria-label={`${userStats.posts} posts published`}>
                  <strong>{userStats.posts}</strong> Posts
                </span>
                <span aria-label={`${userStats.followers} followers`}>
                  <strong>{userStats.followers}</strong> Followers
                </span>
                <span aria-label={`Following ${userStats.following} people`}>
                  <strong>{userStats.following}</strong> Following
                </span>
              </div>
            </div>
          </div>

          {/* Bio */}
          <section 
            className="mb-4"
            // ACCESSIBILITY: Bio section
            role="region"
            aria-label="Profile bio and information"
          >
            <p className="text-white mb-2">
              Professional tattoo artist specializing in custom designs and traditional art.
            </p>
            <div className="flex items-center space-x-4 text-sm text-gray-400">
              <div className="flex items-center space-x-1">
                <MapPin className="w-4 h-4" aria-hidden="true" />
                <span>Paris, France</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" aria-hidden="true" />
                <time dateTime="2020-12" aria-label="Member since December 2020">
                  Joined Dec 2020
                </time>
              </div>
            </div>
            <div className="flex items-center space-x-1 mt-2 text-sm">
              <LinkIcon className="w-4 h-4 text-gray-400" aria-hidden="true" />
              <a 
                href="#" 
                className="text-blue-400 hover:text-blue-300"
                // ACCESSIBILITY: External link indication
                aria-label="Visit @pierce's website: pierce-tattoo.com (opens in new window)"
                target="_blank"
                rel="noopener noreferrer"
              >
                pierce-tattoo.com
              </a>
            </div>
          </section>

          {/* Action Buttons */}
          <div className="flex space-x-2 mb-6">
            <Button
              onClick={() => setIsFollowing(!isFollowing)}
              className={`flex-1 ${
                isFollowing ? "bg-gray-800 hover:bg-gray-700 text-white" : "bg-blue-600 hover:bg-blue-700"
              }`}
              // ACCESSIBILITY: Clear follow button state
              aria-label={isFollowing ? "Unfollow @pierce" : "Follow @pierce"}
              aria-pressed={isFollowing}
            >
              {isFollowing ? "Following" : "Follow"}
            </Button>
            <Button 
              variant="outline" 
              className="flex-1 border-gray-600 text-white bg-transparent"
              // ACCESSIBILITY: Clear message button purpose
              aria-label="Send a message to @pierce"
            >
              Message
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="border-gray-600 text-white bg-transparent"
              // ACCESSIBILITY: Clear edit button purpose
              aria-label="Edit your profile"
            >
              <Edit className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>
        </main>

        {/* Posts Grid */}
        <section 
          className="px-4"
          // ACCESSIBILITY: Posts section
          role="region"
          aria-label="Profile posts gallery"
        >
          <div 
            className="grid grid-cols-3 gap-1"
            // ACCESSIBILITY: Posts grid
            role="grid"
            aria-label="Grid of profile posts"
          >
            {Array.from({ length: 9 }).map((_, i) => (
              <div 
                key={i} 
                className="aspect-square bg-gray-800 rounded"
                // ACCESSIBILITY: Individual post cell
                role="gridcell"
                aria-label={`Profile post ${i + 1}`}
              >
                <img
                  src={`/placeholder.svg?height=120&width=120&text=Post${i + 1}`}
                  alt={`Post ${i + 1} by @pierce: Professional tattoo work showcase. Click to view full size and details.`}
                  className="w-full h-full object-cover rounded cursor-pointer"
                  // ACCESSIBILITY: Additional context for portfolio images
                  title={`Portfolio post ${i + 1} - Click to view details`}
                  tabIndex={0}
                  role="button"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      // Navigate to post details
                      console.log(`Navigate to post ${i + 1}`)
                    }
                  }}
                />
                {/* ACCESSIBILITY: Hidden description for complex portfolio images */}
                <div className="sr-only">
                  Portfolio post {i + 1}: Professional tattoo work by @pierce. 
                  If this image contains text elements, process videos, or detailed artwork, 
                  additional description may be available by viewing the full post.
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="h-20"></div>
        <BottomNavigation />
      </div>
    </div>
  )
}
