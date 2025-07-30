"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MentionAutocomplete } from "@/components/mention-autocomplete"
import { Users, Plus, X, Check, X as XIcon } from "lucide-react"
import { toast } from "sonner"

interface Pro {
  id: string
  username: string
  firstName?: string
  lastName?: string
  businessName?: string
  avatar?: string
  specialties: string[]
}

interface CollaborationManagerProps {
  postId: string
  onCollaborationAdded?: () => void
}

export function CollaborationManager({ postId, onCollaborationAdded }: CollaborationManagerProps) {
  const [selectedPros, setSelectedPros] = useState<Pro[]>([])
  const [mentionQuery, setMentionQuery] = useState("")
  const [showAutocomplete, setShowAutocomplete] = useState(false)
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const handleMentionInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setMentionQuery(value)
    
    // Show autocomplete when @ is typed
    if (value.includes("@")) {
      const lastAt = value.lastIndexOf("@")
      const query = value.slice(lastAt + 1)
      setMentionQuery(query)
      setShowAutocomplete(true)
    } else {
      setShowAutocomplete(false)
    }
  }

  const handleProSelect = (pro: Pro) => {
    if (selectedPros.find(p => p.id === pro.id)) {
      toast.error("This pro is already selected")
      return
    }
    
    setSelectedPros(prev => [...prev, pro])
    setMentionQuery("")
    setShowAutocomplete(false)
  }

  const removePro = (proId: string) => {
    setSelectedPros(prev => prev.filter(p => p.id !== proId))
  }

  const handleSubmit = async () => {
    if (selectedPros.length === 0) {
      toast.error("Please select at least one pro")
      return
    }

    setLoading(true)
    try {
      const promises = selectedPros.map(pro =>
        fetch("/api/collaborations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            postId,
            proId: pro.id,
            message,
          }),
        })
      )

      await Promise.all(promises)
      toast.success("Collaboration invitations sent!")
      setSelectedPros([])
      setMessage("")
      onCollaborationAdded?.()
    } catch (error) {
      console.error("Error sending collaboration invitations:", error)
      toast.error("Failed to send collaboration invitations")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Users className="w-5 h-5" />
          Invite Collaborators
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mention Input */}
        <div className="relative">
          <Label htmlFor="mentions" className="text-gray-300">
            Mention Pros (@username)
          </Label>
          <div className="relative">
            <Input
              id="mentions"
              placeholder="Type @ to mention pros..."
              value={mentionQuery}
              onChange={handleMentionInput}
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            />
            {showAutocomplete && (
              <MentionAutocomplete
                query={mentionQuery}
                onSelect={handleProSelect}
                onClose={() => setShowAutocomplete(false)}
              />
            )}
          </div>
        </div>

        {/* Selected Pros */}
        {selectedPros.length > 0 && (
          <div className="space-y-2">
            <Label className="text-gray-300">Selected Collaborators:</Label>
            <div className="space-y-2">
              {selectedPros.map((pro) => (
                <div key={pro.id} className="flex items-center justify-between p-2 bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={pro.avatar} />
                      <AvatarFallback className="bg-gray-600 text-white text-xs">
                        {pro.businessName ? pro.businessName.charAt(0) : pro.username.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-white">
                        {pro.businessName || `${pro.firstName || ""} ${pro.lastName || ""}`.trim() || pro.username}
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        @{pro.username}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removePro(pro.id)}
                    className="text-gray-400 hover:text-red-400"
                  >
                    <XIcon className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Message */}
        <div>
          <Label htmlFor="message" className="text-gray-300">
            Message (Optional)
          </Label>
          <Input
            id="message"
            placeholder="Add a message for your collaborators..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
          />
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={loading || selectedPros.length === 0}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Sending invitations...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Send Collaboration Invitations ({selectedPros.length})
            </div>
          )}
        </Button>
      </CardContent>
    </Card>
  )
} 