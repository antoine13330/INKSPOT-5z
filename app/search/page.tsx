"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { BottomNavigation } from "@/components/bottom-navigation";
import { Search, Filter, Users, FileText, Calendar, TrendingUp, Heart, Eye } from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

interface User {
  id: string;
  username: string;
  avatar?: string;
  bio?: string;
  location?: string;
  verified: boolean;
  role: string;
  businessName?: string;
  specialties: string[];
  hourlyRate?: number;
  profileViews: number;
  postsCount: number;
  followersCount: number;
  createdAt: string;
}

interface Post {
  id: string;
  content: string;
  images: string[];
  hashtags: string[];
  likesCount: number;
  commentsCount: number;
  viewsCount: number;
  createdAt: string;
  author: {
    id: string;
    username: string;
    avatar?: string;
    verified: boolean;
    role: string;
  };
  liked: boolean;
}

type SearchType = "artists" | "posts";
type SortBy = "date" | "popularity" | "likes" | "name";

export default function SearchPage() {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchType, setSearchType] = useState<SearchType>("artists");
  const [sortBy, setSortBy] = useState<SortBy>("popularity");
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Popular tags for quick selection
  const popularTags = [
    "tattoo", "piercing", "art", "design", "illustration", 
    "portrait", "realistic", "traditional", "japanese", "blackwork",
    "color", "minimalist", "geometric", "watercolor", "neo-traditional"
  ];

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (query: string, tags: string[], type: SearchType, sort: SortBy) => {
      if (!query.trim() && tags.length === 0) {
        setUsers([]);
        setPosts([]);
        return;
      }

      setLoading(true);
      try {
        if (type === "artists") {
          const response = await fetch(
            `/api/users/search?q=${encodeURIComponent(query)}&tags=${tags.join(",")}&sortBy=${sort}`
          );
          if (response.ok) {
            const data = await response.json();
            setUsers(data.users);
          }
        } else {
          const response = await fetch(
            `/api/posts/search?q=${encodeURIComponent(query)}&tags=${tags.join(",")}&sortBy=${sort}`
          );
          if (response.ok) {
            const data = await response.json();
            setPosts(data.posts);
          }
        }

        // Record search history
        if (session?.user?.id && (query.trim() || tags.length > 0)) {
          await fetch("/api/search/history", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              query: query.trim() || tags.join(" "),
              hashtags: tags,
            }),
          });
        }
      } catch (error) {
        console.error("Search error:", error);
        toast.error("Failed to perform search");
      } finally {
        setLoading(false);
      }
    }, 300),
    [session?.user?.id]
  );

  // Effect to trigger search when parameters change
  useEffect(() => {
    debouncedSearch(searchQuery, selectedTags, searchType, sortBy);
  }, [searchQuery, selectedTags, searchType, sortBy, debouncedSearch]);

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleLikePost = async (postId: string) => {
    if (!session?.user?.id) {
      toast.error("Please sign in to like posts");
      return;
    }

    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: "POST",
      });
      
      if (response.ok) {
        setPosts(prev => 
          prev.map(post => 
            post.id === postId 
              ? { ...post, liked: !post.liked, likesCount: post.liked ? post.likesCount - 1 : post.likesCount + 1 }
              : post
          )
        );
      }
    } catch (error) {
      console.error("Error liking post:", error);
      toast.error("Failed to like post");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-md mx-auto bg-black min-h-screen">
        {/* Search Header */}
        <div className="p-4 border-b border-gray-800">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search artists, posts, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white pl-10 rounded-full"
            />
          </div>

                     {/* Search Type Toggle */}
           <div className="flex gap-2 mb-4">
             <Button
               variant={searchType === "artists" ? "default" : "outline"}
               size="sm"
               onClick={() => setSearchType("artists")}
               className={`flex-1 ${
                 searchType === "artists" 
                   ? "bg-blue-600 text-white hover:bg-blue-700" 
                   : "bg-gray-800 text-gray-200 border-gray-600 hover:bg-gray-700"
               }`}
             >
               <Users className="w-4 h-4 mr-2" />
               Artists
             </Button>
             <Button
               variant={searchType === "posts" ? "default" : "outline"}
               size="sm"
               onClick={() => setSearchType("posts")}
               className={`flex-1 ${
                 searchType === "posts" 
                   ? "bg-blue-600 text-white hover:bg-blue-700" 
                   : "bg-gray-800 text-gray-200 border-gray-600 hover:bg-gray-700"
               }`}
             >
               <FileText className="w-4 h-4 mr-2" />
               Posts
             </Button>
           </div>

                     {/* Filter Toggle */}
           <Button
             variant="outline"
             size="sm"
             onClick={() => setShowFilters(!showFilters)}
             className="w-full bg-gray-800 text-gray-200 border-gray-600 hover:bg-gray-700"
           >
             <Filter className="w-4 h-4 mr-2" />
             Filters & Sort
           </Button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="p-4 border-b border-gray-800 bg-gray-900">
            {/* Sort Options */}
            <div className="mb-4">
              <h3 className="text-sm font-medium mb-2">Sort by:</h3>
              <div className="flex gap-2 flex-wrap">
                                 <Button
                   variant={sortBy === "popularity" ? "default" : "outline"}
                   size="sm"
                   onClick={() => setSortBy("popularity")}
                   className={sortBy === "popularity" 
                     ? "bg-blue-600 text-white hover:bg-blue-700" 
                     : "bg-gray-800 text-gray-200 border-gray-600 hover:bg-gray-700"
                   }
                 >
                   <TrendingUp className="w-4 h-4 mr-1" />
                   Popularity
                 </Button>
                 <Button
                   variant={sortBy === "date" ? "default" : "outline"}
                   size="sm"
                   onClick={() => setSortBy("date")}
                   className={sortBy === "date" 
                     ? "bg-blue-600 text-white hover:bg-blue-700" 
                     : "bg-gray-800 text-gray-200 border-gray-600 hover:bg-gray-700"
                   }
                 >
                   <Calendar className="w-4 h-4 mr-1" />
                   Date
                 </Button>
                 {searchType === "posts" && (
                   <Button
                     variant={sortBy === "likes" ? "default" : "outline"}
                     size="sm"
                     onClick={() => setSortBy("likes")}
                     className={sortBy === "likes" 
                       ? "bg-blue-600 text-white hover:bg-blue-700" 
                       : "bg-gray-800 text-gray-200 border-gray-600 hover:bg-gray-700"
                     }
                   >
                     <Heart className="w-4 h-4 mr-1" />
                     Likes
                   </Button>
                 )}
                 {searchType === "artists" && (
                   <Button
                     variant={sortBy === "name" ? "default" : "outline"}
                     size="sm"
                     onClick={() => setSortBy("name")}
                     className={sortBy === "name" 
                       ? "bg-blue-600 text-white hover:bg-blue-700" 
                       : "bg-gray-800 text-gray-200 border-gray-600 hover:bg-gray-700"
                     }
                   >
                     Name
                   </Button>
                 )}
              </div>
            </div>

                         {/* Popular Tags */}
             <div>
               <h3 className="text-sm font-medium mb-2">Popular Tags:</h3>
               <div className="flex gap-2 flex-wrap">
                 {popularTags.map((tag) => (
                   <Badge
                     key={tag}
                     variant={selectedTags.includes(tag) ? "default" : "secondary"}
                     className={`cursor-pointer ${
                       selectedTags.includes(tag) 
                         ? "bg-blue-600 text-white hover:bg-blue-700" 
                         : "bg-gray-700 text-gray-200 hover:bg-gray-600"
                     }`}
                     onClick={() => handleTagToggle(tag)}
                   >
                     #{tag}
                   </Badge>
                 ))}
               </div>
             </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="p-4 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
            <p className="mt-2 text-gray-400">Searching...</p>
          </div>
        )}

        {/* Results */}
        {!loading && (
          <div className="p-4">
            {searchType === "artists" ? (
              // Artists Results
              <div className="space-y-4">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="bg-gray-900 rounded-lg p-4 hover:bg-gray-800 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start space-x-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>{user.username[1]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">@{user.username}</span>
                          {user.verified && (
                            <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs">✓</span>
                            </div>
                          )}
                        </div>
                        {user.businessName && (
                          <p className="text-sm text-gray-300">{user.businessName}</p>
                        )}
                        {user.bio && (
                          <p className="text-sm text-gray-400 mt-1">{user.bio}</p>
                        )}
                        {user.specialties.length > 0 && (
                          <div className="flex gap-1 mt-2 flex-wrap">
                                                     {user.specialties.slice(0, 3).map((specialty) => (
                           <Badge key={specialty} variant="secondary" className="text-xs bg-gray-700 text-gray-200">
                             {specialty}
                           </Badge>
                         ))}
                          </div>
                        )}
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                          <span>{user.postsCount} posts</span>
                          <span>{user.followersCount} followers</span>
                          <span>{user.profileViews} views</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Posts Results
              <div className="space-y-4">
                {posts.map((post) => (
                  <div key={post.id} className="bg-gray-900 rounded-lg p-4">
                    <div className="flex items-start space-x-3 mb-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={post.author.avatar} />
                        <AvatarFallback>{post.author.username[1]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">@{post.author.username}</span>
                          {post.author.verified && (
                            <div className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs">✓</span>
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-gray-400">
                          {formatDate(post.createdAt)}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-sm mb-3">{post.content}</p>
                    
                                         {post.hashtags.length > 0 && (
                       <div className="flex gap-1 mb-3 flex-wrap">
                         {post.hashtags.map((tag) => (
                           <Badge key={tag} variant="secondary" className="text-xs bg-gray-700 text-gray-200">
                             #{tag}
                           </Badge>
                         ))}
                       </div>
                     )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <button
                          onClick={() => handleLikePost(post.id)}
                          className={`flex items-center space-x-1 ${
                            post.liked ? "text-red-500" : "hover:text-red-400"
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${post.liked ? "fill-current" : ""}`} />
                          <span>{post.likesCount}</span>
                        </button>
                        <div className="flex items-center space-x-1">
                          <Eye className="w-4 h-4" />
                          <span>{post.viewsCount}</span>
                        </div>
                        <span>{post.commentsCount} comments</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {users.length === 0 && posts.length === 0 && searchQuery.trim() && !loading && (
              <div className="text-center py-8">
                <p className="text-gray-400">No results found</p>
                <p className="text-sm text-gray-500 mt-2">Try different keywords or tags</p>
              </div>
            )}
          </div>
        )}

        <BottomNavigation />
      </div>
    </div>
  );
}

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
