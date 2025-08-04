"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Input, Button, Avatar, Badge, LoadingState, EmptyState } from "@/components/ui/base-components";
import { BottomNavigation } from "@/components/bottom-navigation";
import { Search, Filter, Users, FileText, Calendar, TrendingUp, Heart, Eye } from "lucide-react";
import { cn, debounce } from "@/lib/utils";
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
    <div className="min-h-screen bg-background pb-20">
      <div className="container mx-auto px-4 py-6 max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Recherche</h1>
            <p className="text-muted-foreground text-sm">Trouvez des artistes et des posts</p>
          </div>
        </div>

        {/* Search Header */}
        <div className="mb-6">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Rechercher des artistes, posts, ou tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Search Type Toggle */}
          <div className="flex gap-2 mb-4">
            <Button
              variant={searchType === "artists" ? "default" : "outline"}
              size="sm"
              onClick={() => setSearchType("artists")}
              className="flex-1"
            >
              <Users className="w-4 h-4 mr-2" />
              Artistes
            </Button>
            <Button
              variant={searchType === "posts" ? "default" : "outline"}
              size="sm"
              onClick={() => setSearchType("posts")}
              className="flex-1"
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
            className="w-full"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtres & Tri
          </Button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="card mb-6">
            {/* Sort Options */}
            <div className="mb-4">
              <h3 className="text-sm font-medium mb-2">Trier par :</h3>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={sortBy === "popularity" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSortBy("popularity")}
                >
                  <TrendingUp className="w-4 h-4 mr-1" />
                  Popularité
                </Button>
                <Button
                  variant={sortBy === "date" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSortBy("date")}
                >
                  <Calendar className="w-4 h-4 mr-1" />
                  Date
                </Button>
                {searchType === "posts" && (
                  <Button
                    variant={sortBy === "likes" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSortBy("likes")}
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
                  >
                    Nom
                  </Button>
                )}
              </div>
            </div>

            {/* Popular Tags */}
            <div>
              <h3 className="text-sm font-medium mb-2">Tags populaires :</h3>
              <div className="flex gap-2 flex-wrap">
                {popularTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? "default" : "secondary"}
                    className="cursor-pointer"
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
          <LoadingState message="Recherche en cours..." />
        )}

        {/* Results */}
        {!loading && (
          <div>
            {searchType === "artists" ? (
              // Artists Results
              <div className="space-y-4">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="card hover:bg-surface-elevated transition-colors cursor-pointer"
                  >
                    <div className="flex items-start space-x-3">
                      <Avatar
                        src={user.avatar}
                        alt={user.username}
                        fallback={user.username[0]}
                        size="lg"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-foreground">@{user.username}</span>
                          {user.verified && (
                            <Badge variant="default" size="sm">✓</Badge>
                          )}
                        </div>
                        {user.businessName && (
                          <p className="text-sm text-secondary">{user.businessName}</p>
                        )}
                        {user.bio && (
                          <p className="text-sm text-muted-foreground mt-1">{user.bio}</p>
                        )}
                        {user.specialties.length > 0 && (
                          <div className="flex gap-1 mt-2 flex-wrap">
                            {user.specialties.slice(0, 3).map((specialty) => (
                              <Badge key={specialty} variant="secondary" size="sm">
                                {specialty}
                              </Badge>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                          <span>{user.postsCount} posts</span>
                          <span>{user.followersCount} followers</span>
                          <span>{user.profileViews} vues</span>
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
                  <div key={post.id} className="card">
                    <div className="flex items-start space-x-3 mb-3">
                      <Avatar
                        src={post.author.avatar}
                        alt={post.author.username}
                        fallback={post.author.username[0]}
                        size="md"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-foreground">@{post.author.username}</span>
                          {post.author.verified && (
                            <Badge variant="default" size="sm">✓</Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(post.createdAt)}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-sm mb-3 text-foreground">{post.content}</p>
                    
                    {post.hashtags.length > 0 && (
                      <div className="flex gap-1 mb-3 flex-wrap">
                        {post.hashtags.map((tag) => (
                          <Badge key={tag} variant="secondary" size="sm">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <button
                          onClick={() => handleLikePost(post.id)}
                          className={cn(
                            "flex items-center space-x-1 transition-colors",
                            post.liked ? "text-red-500" : "hover:text-red-400"
                          )}
                        >
                          <Heart className={cn("w-4 h-4", post.liked && "fill-current")} />
                          <span>{post.likesCount}</span>
                        </button>
                        <div className="flex items-center space-x-1">
                          <Eye className="w-4 h-4" />
                          <span>{post.viewsCount}</span>
                        </div>
                        <span>{post.commentsCount} commentaires</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {users.length === 0 && posts.length === 0 && searchQuery.trim() && !loading && (
              <EmptyState
                icon={Search}
                title="Aucun résultat trouvé"
                description="Essayez des mots-clés ou tags différents"
              />
            )}
          </div>
        )}
      </div>
      <BottomNavigation />
    </div>
  );
}
