"use client";

import { useState, useEffect } from "react";
import { Search, User, MapPin, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface Artist {
  id: string;
  username: string;
  businessName: string | null;
  displayName: string;
  avatar: string | null;
  specialties: string[];
  location: string | null;
  hourlyRate: number | null;
  _count: {
    posts: number;
    followers: number;
  };
}

interface ArtistSelectorProps {
  selectedArtistId?: string;
  onArtistSelect: (artistId: string) => void;
  onArtistClear: () => void;
}

export function ArtistSelector({ onArtistSelect, onArtistClear }: ArtistSelectorProps) {
  const [query, setQuery] = useState("");
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);

  // Fetch selected artist details if artistId is provided
  useEffect(() => {
    if (selectedArtist) {
      // Artist already selected, no need to fetch
    }
  }, [selectedArtist]);



  const searchArtists = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setArtists([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/artists/search?q=${encodeURIComponent(searchQuery)}&limit=10`);
      if (response.ok) {
        const data = await response.json();
        setArtists(data.artists);
      }
    } catch (error) {
      console.error("Error searching artists:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleArtistSelect = (artist: Artist) => {
    setSelectedArtist(artist);
    onArtistSelect(artist.id);
    setQuery("");
    setArtists([]);
  };

  const handleArtistClear = () => {
    setSelectedArtist(null);
    onArtistClear();
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-gray-300 mb-2 block">
          Link to Artist (Optional)
        </label>
        <p className="text-xs text-gray-500 mb-3">
          Link this post to a specific artist for collaboration or pricing discussions
        </p>
      </div>

      {selectedArtist ? (
        <Card className="bg-gray-700 border-gray-600">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={selectedArtist.avatar || ""} />
                  <AvatarFallback>
                    {selectedArtist.displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-medium text-white">{selectedArtist.displayName}</h4>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    {selectedArtist.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {selectedArtist.location}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      {selectedArtist._count.followers} followers
                    </div>
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleArtistClear}
                className="text-red-400 border-red-400 hover:bg-red-400/10"
              >
                Remove
              </Button>
            </div>
            {selectedArtist.specialties.length > 0 && (
              <div className="mt-3">
                <div className="flex flex-wrap gap-1">
                  {selectedArtist.specialties.slice(0, 3).map((specialty) => (
                    <Badge key={specialty} variant="secondary" className="text-xs">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search for artists..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                searchArtists(e.target.value);
              }}
              className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            />
          </div>

          {loading && (
            <div className="text-center py-4">
              <div className="text-gray-400">Searching...</div>
            </div>
          )}

          {artists.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {artists.map((artist) => (
                <Card
                  key={artist.id}
                  className="bg-gray-700 border-gray-600 hover:bg-gray-600 cursor-pointer transition-colors"
                  onClick={() => handleArtistSelect(artist)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={artist.avatar || ""} />
                        <AvatarFallback>
                          {artist.displayName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-white truncate">
                          {artist.displayName}
                        </h4>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          {artist.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {artist.location}
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {artist._count.posts} posts
                          </div>
                        </div>
                      </div>
                    </div>
                    {artist.specialties.length > 0 && (
                      <div className="mt-2">
                        <div className="flex flex-wrap gap-1">
                          {artist.specialties.slice(0, 2).map((specialty) => (
                            <Badge key={specialty} variant="secondary" className="text-xs">
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 