"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

import { BottomNavigation } from "@/components/bottom-navigation";
import { MentionAutocomplete } from "@/components/mention-autocomplete";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Upload, 
  X, 
  Tag,
  DollarSign,
  Image as ImageIcon,
  Plus,
  Users,
  FileText
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

interface FormData {
  content: string;
  hashtags: string[];
  images: File[];
  price?: number;
  collaborators: string[];
}

interface Collaborator {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  businessName?: string;
  avatar?: string;
  specialties: string[];
}

export default function CreatePostPage() {
  const { data: session } = useSession();
  const router = useRouter();
  
  const [formData, setFormData] = useState<FormData>({
    content: "",
    hashtags: [],
    images: [],
    price: undefined,
    collaborators: []
  });
  
  const [newTag, setNewTag] = useState("");
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isCollaboration, setIsCollaboration] = useState(false);
  const [selectedCollaborators, setSelectedCollaborators] = useState<Collaborator[]>([]);
  const [mentionQuery, setMentionQuery] = useState("");
  const [showMentionAutocomplete, setShowMentionAutocomplete] = useState(false);
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);

  // Check if user is PRO
  if (!session?.user || session.user.role !== "PRO") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md modern-card">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold text-foreground mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">
              Only PRO users can create posts. Please upgrade your account to continue.
            </p>
            <Button onClick={() => router.push("/")} className="modern-button bg-primary hover:bg-primary/90 text-primary-foreground">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && newTag.trim()) {
      e.preventDefault();
      if (formData.hashtags.length >= 5) {
        toast.error("Maximum 5 tags allowed");
        return;
      }
      if (formData.hashtags.includes(newTag.trim())) {
        toast.error("Tag already exists");
        return;
      }
      setFormData(prev => ({
        ...prev,
        hashtags: [...prev.hashtags, newTag.trim()]
      }));
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      hashtags: prev.hashtags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleImageUpload = (files: FileList | null) => {
    if (!files) return;
    
    const fileArray = Array.from(files);
    if (formData.images.length + fileArray.length > 5) {
      toast.error("Maximum 5 images allowed");
      return;
    }

    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...fileArray]
    }));
    
    // Create previews
    fileArray.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, content: value }));

    // Handle @ mentions
    const lastAt = value.lastIndexOf("@");
    if (lastAt !== -1) {
      const query = value.slice(lastAt + 1);
      setMentionQuery(query);
      setMentionStartIndex(lastAt);
      setShowMentionAutocomplete(true);
    } else {
      setShowMentionAutocomplete(false);
    }
  };

  const handleCollaboratorSelect = (collaborator: Collaborator) => {
    if (selectedCollaborators.find(c => c.id === collaborator.id)) {
      toast.error("This collaborator is already selected");
      return;
    }
    
    setSelectedCollaborators(prev => [...prev, collaborator]);
    setShowMentionAutocomplete(false);
    setMentionQuery("");
    
    // Add mention to content
    const beforeMention = formData.content.slice(0, mentionStartIndex);
    const afterMention = formData.content.slice(mentionStartIndex + mentionQuery.length + 1);
    const newContent = `${beforeMention}@${collaborator.username} ${afterMention}`;
    setFormData(prev => ({ ...prev, content: newContent }));
  };

  const removeCollaborator = (collaboratorId: string) => {
    setSelectedCollaborators(prev => prev.filter(c => c.id !== collaboratorId));
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.content.trim()) {
      toast.error("Content is required");
      return;
    }
    
    if (formData.images.length === 0) {
      toast.error("At least one image is required");
      return;
    }

    const postFormData = new FormData();
    postFormData.append("content", formData.content);
    postFormData.append("hashtags", JSON.stringify(formData.hashtags));
    postFormData.append("isCollaboration", isCollaboration.toString());
    
    formData.images.forEach(image => {
      postFormData.append(`images`, image);
    });

    if (formData.price !== undefined && formData.price !== null) {
      postFormData.append("price", formData.price.toString());
    }

    try {
      const response = await fetch("/api/posts/create", {
        method: "POST",
        body: postFormData,
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Post created successfully!");
        
        // If collaboration is enabled and collaborators are selected, create collaborations
        if (isCollaboration && selectedCollaborators.length > 0) {
          const collaborationPromises = selectedCollaborators.map(collaborator =>
            fetch("/api/collaborations", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                postId: result.post.id,
                proId: collaborator.id,
                message: `You've been invited to collaborate on this post!`,
              }),
            })
          );

          await Promise.all(collaborationPromises);
          toast.success("Collaboration invitations sent!");
        }
        
        router.push("/");
      } else {
        toast.error(result.error || "Failed to create post");
      }
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error("Failed to create post");
    }
  }, [formData, imagePreviews, session, router, isCollaboration, selectedCollaborators]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container mx-auto px-4 py-6 max-w-md">
        <h1 className="text-2xl font-bold text-foreground mb-6 text-center">Create New Post</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Content Section */}
          <Card className="modern-card">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Textarea
                  placeholder="What's on your mind? Use @ to mention collaborators..."
                  value={formData.content}
                  onChange={handleContentChange}
                  className="modern-input min-h-[120px]"
                />
                {showMentionAutocomplete && (
                  <MentionAutocomplete
                    query={mentionQuery}
                    onSelect={handleCollaboratorSelect}
                    onClose={() => setShowMentionAutocomplete(false)}
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Collaboration Toggle */}
          <Card className="modern-card">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Users className="w-5 h-5" />
                Collaboration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="collaboration"
                  checked={isCollaboration}
                  onChange={(e) => setIsCollaboration(e.target.checked)}
                  className="rounded border-border bg-background text-primary focus:ring-primary"
                />
                <Label htmlFor="collaboration" className="text-foreground">
                  This is a collaboration post
                </Label>
              </div>
              {isCollaboration && (
                <p className="text-sm text-muted-foreground mt-2">
                  Use @ in your content to mention and invite collaborators.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Selected Collaborators */}
          {isCollaboration && selectedCollaborators.length > 0 && (
            <Card className="modern-card">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Selected Collaborators ({selectedCollaborators.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {selectedCollaborators.map((collaborator) => (
                    <div key={collaborator.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Avatar className="modern-avatar w-8 h-8">
                          <AvatarImage src={collaborator.avatar} />
                          <AvatarFallback className="bg-background text-xs">
                            {collaborator.businessName ? collaborator.businessName.charAt(0) : collaborator.username.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-foreground">
                            {collaborator.businessName || `${collaborator.firstName || ""} ${collaborator.lastName || ""}`.trim() || collaborator.username}
                          </div>
                          <Badge variant="secondary" className="modern-badge">
                            @{collaborator.username}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeCollaborator(collaborator.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Price Input */}
          <Card className="modern-card">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Price (Optional)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Label htmlFor="price" className="text-foreground">
                Price (€)
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                placeholder="e.g., 150.00"
                value={formData.price === undefined || formData.price === null ? "" : formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value === "" ? undefined : parseFloat(e.target.value) }))}
                className="modern-input mt-2"
              />
              <p className="text-sm text-muted-foreground mt-2">
                Set a price if this post represents an artwork or service for sale.
              </p>
            </CardContent>
          </Card>

          {/* Hashtags Section */}
          <Card className="modern-card">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Tag className="w-5 h-5" />
                Hashtags
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                {formData.hashtags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="modern-badge bg-primary text-primary-foreground flex items-center gap-1">
                    {tag}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => handleRemoveTag(tag)} />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Add a tag (e.g., #digitalart)"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={handleAddTag}
                  className="modern-input"
                />
                <Button type="button" onClick={() => handleAddTag({ key: "Enter", preventDefault: () => {} } as React.KeyboardEvent<HTMLInputElement>)} className="modern-button bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-2">Press Enter to add tags. Max 5 tags.</p>
            </CardContent>
          </Card>

          {/* Image Upload Section */}
          <Card className="modern-card">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Images (Max 5)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center w-full mb-4">
                <Label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-border border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/80">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-3 text-muted-foreground" />
                    <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                    <p className="text-xs text-muted-foreground">SVG, PNG, JPG or GIF (MAX. 5MB per image)</p>
                  </div>
                  <Input id="dropzone-file" type="file" className="hidden" multiple onChange={(e) => handleImageUpload(e.target.files)} accept="image/*" />
                </Label>
              </div>

              {/* Image Previews */}
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <Image src={preview} alt={`Preview ${index}`} width={200} height={200} className="w-full h-auto object-cover rounded-lg" />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemoveImage(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Button type="submit" className="w-full modern-button bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 rounded-lg">
            {isCollaboration && selectedCollaborators.length > 0 
              ? `Create Post & Invite ${selectedCollaborators.length} Collaborator${selectedCollaborators.length > 1 ? 's' : ''}`
              : "Create Post"
            }
          </Button>
        </form>
      </div>
      <BottomNavigation />
    </div>
  )
} 