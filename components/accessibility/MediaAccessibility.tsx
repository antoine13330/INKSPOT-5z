"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Captions, 
  FileText, 
  Volume2, 
  VolumeX, 
  Eye, 
  EyeOff,
  Edit,
  Save,
  Download
} from 'lucide-react'

export interface MediaAccessibilityData {
  captions?: Array<{
    start: number
    end: number
    text: string
  }>
  transcript?: string
  audioDescription?: string
  hasAudio?: boolean
  hasVideo?: boolean
  language?: string
}

interface MediaAccessibilityProps {
  mediaUrl?: string
  mediaType?: 'video' | 'audio' | 'image'
  accessibilityData?: MediaAccessibilityData
  onUpdateAccessibilityData?: (data: MediaAccessibilityData) => void
  showControls?: boolean
  className?: string
}

export function MediaAccessibility({
  mediaUrl,
  mediaType = 'image',
  accessibilityData = {},
  onUpdateAccessibilityData,
  showControls = true,
  className = ''
}: MediaAccessibilityProps) {
  const [showCaptions, setShowCaptions] = useState(true)
  const [showTranscript, setShowTranscript] = useState(false)
  const [showAudioDescription, setShowAudioDescription] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<MediaAccessibilityData>(accessibilityData)

  const handleSaveEdits = () => {
    if (onUpdateAccessibilityData) {
      onUpdateAccessibilityData(editData)
    }
    setIsEditing(false)
  }

  const exportTranscript = () => {
    if (!editData.transcript) return
    
    const blob = new Blob([editData.transcript], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'transcript.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className={`accessibility-media-container ${className}`}>
      {/* ACCESSIBILITY: Controls for captions and transcripts */}
      {showControls && (
        <div className="flex flex-wrap gap-2 mb-3" role="toolbar" aria-label="Accessibility controls">
          {(mediaType === 'video' || mediaType === 'audio') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCaptions(!showCaptions)}
              className={`${showCaptions ? 'bg-blue-600 text-white' : 'border-gray-600 text-gray-300'}`}
              aria-label={`${showCaptions ? 'Hide' : 'Show'} captions`}
              aria-pressed={showCaptions}
            >
              <Captions className="w-4 h-4 mr-1" aria-hidden="true" />
              Captions
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTranscript(!showTranscript)}
            className={`${showTranscript ? 'bg-blue-600 text-white' : 'border-gray-600 text-gray-300'}`}
            aria-label={`${showTranscript ? 'Hide' : 'Show'} transcript`}
            aria-pressed={showTranscript}
          >
            <FileText className="w-4 h-4 mr-1" aria-hidden="true" />
            Transcript
          </Button>

          {accessibilityData.audioDescription && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAudioDescription(!showAudioDescription)}
              className={`${showAudioDescription ? 'bg-blue-600 text-white' : 'border-gray-600 text-gray-300'}`}
              aria-label={`${showAudioDescription ? 'Hide' : 'Show'} audio description`}
              aria-pressed={showAudioDescription}
            >
              <Volume2 className="w-4 h-4 mr-1" aria-hidden="true" />
              Audio Description
            </Button>
          )}

          {onUpdateAccessibilityData && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              className="border-gray-600 text-gray-300"
              aria-label={isEditing ? "Cancel editing accessibility features" : "Edit accessibility features"}
            >
              <Edit className="w-4 h-4 mr-1" aria-hidden="true" />
              {isEditing ? 'Cancel' : 'Edit'}
            </Button>
          )}
        </div>
      )}

      {/* ACCESSIBILITY: Live captions display */}
      {showCaptions && accessibilityData.captions && accessibilityData.captions.length > 0 && (
        <div 
          className="accessibility-captions mb-3"
          role="region"
          aria-label="Live captions"
          aria-live="polite"
        >
          <div className="flex items-center mb-2">
            <Badge variant="secondary" className="bg-gray-800 text-white">
              <Captions className="w-3 h-3 mr-1" aria-hidden="true" />
              Captions
            </Badge>
          </div>
          <div className="space-y-1">
            {accessibilityData.captions.map((caption, index) => (
              <div
                key={index}
                className="text-sm p-2 bg-black/80 rounded border-l-2 border-blue-500"
                role="region"
                aria-label={`Caption: ${caption.text}`}
              >
                <span className="sr-only">Caption {index + 1}: </span>
                {caption.text}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ACCESSIBILITY: Transcript display */}
      {showTranscript && (
        <Card className="mb-3 bg-gray-900 border-gray-700">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-white flex items-center">
                <FileText className="w-4 h-4 mr-2" aria-hidden="true" />
                Transcript
              </CardTitle>
              {accessibilityData.transcript && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={exportTranscript}
                  className="text-gray-400 hover:text-white"
                  aria-label="Download transcript as text file"
                >
                  <Download className="w-4 h-4" aria-hidden="true" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="space-y-3">
                <Textarea
                  value={editData.transcript || ''}
                  onChange={(e) => setEditData({ ...editData, transcript: e.target.value })}
                  placeholder="Enter the complete transcript of the audio/video content..."
                  className="bg-gray-800 border-gray-600 text-white min-h-[100px]"
                  aria-label="Edit transcript content"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveEdits}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Save className="w-4 h-4 mr-1" aria-hidden="true" />
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <div 
                className="accessibility-transcript text-sm text-gray-300"
                role="region"
                aria-label="Content transcript"
              >
                {accessibilityData.transcript || (
                  <div className="text-gray-500 italic">
                    No transcript available yet. 
                    {onUpdateAccessibilityData && " Click Edit to add one."}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ACCESSIBILITY: Audio description display */}
      {showAudioDescription && accessibilityData.audioDescription && (
        <div 
          className="accessibility-audio-description mb-3"
          role="region"
          aria-label="Audio description"
        >
          <div className="flex items-center mb-2">
            <Badge variant="secondary" className="bg-gray-800 text-white">
              <Volume2 className="w-3 h-3 mr-1" aria-hidden="true" />
              Audio Description
            </Badge>
          </div>
          <p className="text-sm">
            <span className="sr-only">Audio description: </span>
            {accessibilityData.audioDescription}
          </p>
        </div>
      )}

      {/* ACCESSIBILITY: Editing interface */}
      {isEditing && onUpdateAccessibilityData && (
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white text-sm">Edit Accessibility Features</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="transcript" className="w-full">
              <TabsList className="bg-gray-800">
                <TabsTrigger value="transcript">Transcript</TabsTrigger>
                <TabsTrigger value="description">Audio Description</TabsTrigger>
                <TabsTrigger value="metadata">Metadata</TabsTrigger>
              </TabsList>
              
              <TabsContent value="transcript" className="mt-4">
                <div className="space-y-3">
                  <label htmlFor="transcript-edit" className="text-sm font-medium text-white">
                    Full Transcript
                  </label>
                  <Textarea
                    id="transcript-edit"
                    value={editData.transcript || ''}
                    onChange={(e) => setEditData({ ...editData, transcript: e.target.value })}
                    placeholder="Provide a complete transcript of all spoken content, including speaker names and important non-speech sounds [applause], [music], etc."
                    className="bg-gray-800 border-gray-600 text-white min-h-[120px]"
                    aria-describedby="transcript-help"
                  />
                  <div id="transcript-help" className="text-xs text-gray-400">
                    Include speaker names, dialogue, and sound effects in brackets like [applause] or [phone ringing]
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="description" className="mt-4">
                <div className="space-y-3">
                  <label htmlFor="audio-description-edit" className="text-sm font-medium text-white">
                    Audio Description
                  </label>
                  <Textarea
                    id="audio-description-edit"
                    value={editData.audioDescription || ''}
                    onChange={(e) => setEditData({ ...editData, audioDescription: e.target.value })}
                    placeholder="Describe visual elements, actions, and scenes that are important for understanding the content..."
                    className="bg-gray-800 border-gray-600 text-white min-h-[100px]"
                    aria-describedby="description-help"
                  />
                  <div id="description-help" className="text-xs text-gray-400">
                    Describe visual actions, scenery, text on screen, and other visual elements
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="metadata" className="mt-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <label className="text-sm font-medium text-white">Content Type:</label>
                    <div className="flex gap-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={editData.hasAudio || false}
                          onChange={(e) => setEditData({ ...editData, hasAudio: e.target.checked })}
                          className="mr-1"
                        />
                        <span className="text-sm text-gray-300">Has Audio</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={editData.hasVideo || false}
                          onChange={(e) => setEditData({ ...editData, hasVideo: e.target.checked })}
                          className="mr-1"
                        />
                        <span className="text-sm text-gray-300">Has Video</span>
                      </label>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="flex gap-2 mt-4">
              <Button
                onClick={handleSaveEdits}
                className="bg-blue-600 hover:bg-blue-700"
                aria-label="Save accessibility changes"
              >
                <Save className="w-4 h-4 mr-1" aria-hidden="true" />
                Save Changes
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsEditing(false)}
                className="border-gray-600 text-gray-300"
                aria-label="Cancel editing"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ACCESSIBILITY: Status indicators for content type */}
      {(accessibilityData.hasAudio || accessibilityData.hasVideo) && (
        <div className="flex gap-2 mt-2" role="region" aria-label="Content accessibility status">
          {accessibilityData.hasAudio && (
            <Badge 
              variant="secondary" 
              className="bg-purple-600 text-white text-xs"
              aria-label="This content contains audio"
            >
              🔊 Audio Content
            </Badge>
          )}
          {accessibilityData.hasVideo && (
            <Badge 
              variant="secondary" 
              className="bg-green-600 text-white text-xs"
              aria-label="This content contains video"
            >
              🎥 Video Content
            </Badge>
          )}
          {accessibilityData.transcript && (
            <Badge 
              variant="secondary" 
              className="bg-blue-600 text-white text-xs"
              aria-label="Transcript available"
            >
              📝 Transcript Available
            </Badge>
          )}
          {accessibilityData.captions && accessibilityData.captions.length > 0 && (
            <Badge 
              variant="secondary" 
              className="bg-orange-600 text-white text-xs"
              aria-label="Captions available"
            >
              💬 Captions Available
            </Badge>
          )}
        </div>
      )}

      {/* ACCESSIBILITY: Quick access buttons for common actions */}
      {!isEditing && (accessibilityData.hasAudio || accessibilityData.hasVideo) && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 mt-3">
          <div className="text-xs text-gray-400 mb-2 font-medium">Accessibility Options:</div>
          <div className="flex flex-wrap gap-2">
            {!accessibilityData.transcript && (
              <div className="text-xs text-yellow-400 flex items-center">
                ⚠️ No transcript available
              </div>
            )}
            {!accessibilityData.captions && mediaType !== 'image' && (
              <div className="text-xs text-yellow-400 flex items-center">
                ⚠️ No captions available
              </div>
            )}
            {accessibilityData.transcript && (
              <button
                onClick={exportTranscript}
                className="text-xs text-blue-400 hover:text-blue-300 underline"
                aria-label="Download transcript as text file"
              >
                📄 Download Transcript
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ACCESSIBILITY: Utility component for visual sound indicators
export function SoundIndicator({ 
  soundType, 
  description,
  className = '' 
}: { 
  soundType: 'notification' | 'message' | 'error' | 'success' | 'ambient'
  description: string
  className?: string 
}) {
  const indicators = {
    notification: '🔔',
    message: '💬',
    error: '❌',
    success: '✅',
    ambient: '🎵'
  }

  return (
    <span 
      className={`accessibility-visual-indicator text-xs ${className}`}
      role="img"
      aria-label={`Sound indicator: ${description}`}
      title={description}
    >
      <span aria-hidden="true">{indicators[soundType]}</span>
      <span className="sr-only">[{description}]</span>
    </span>
  )
}

// ACCESSIBILITY: Utility component for visual alerts that replace audio alerts
export function VisualAlert({
  message,
  type = 'info',
  onDismiss,
  className = ''
}: {
  message: string
  type?: 'info' | 'warning' | 'error' | 'success'
  onDismiss?: () => void
  className?: string
}) {
  const [dismissed, setDismissed] = useState(false)

  const handleDismiss = () => {
    setDismissed(true)
    if (onDismiss) onDismiss()
  }

  if (dismissed) return null

  const typeConfig = {
    info: { icon: '🔔', bgColor: 'bg-blue-600', textColor: 'text-white' },
    warning: { icon: '⚠️', bgColor: 'bg-yellow-600', textColor: 'text-white' },
    error: { icon: '❌', bgColor: 'bg-red-600', textColor: 'text-white' },
    success: { icon: '✅', bgColor: 'bg-green-600', textColor: 'text-white' }
  }

  const config = typeConfig[type]

  return (
    <div 
      className={`
        ${config.bgColor} ${config.textColor} 
        p-3 rounded-lg border-l-4 border-white 
        flex items-center justify-between 
        accessibility-notification-sound-alternative
        ${className}
      `}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div className="flex items-center">
        <span className="mr-2" aria-hidden="true">{config.icon}</span>
        <span>{message}</span>
      </div>
      {onDismiss && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="text-white/80 hover:text-white h-6 w-6 p-0"
          aria-label="Dismiss alert"
        >
          <VolumeX className="w-4 h-4" aria-hidden="true" />
        </Button>
      )}
    </div>
  )
}