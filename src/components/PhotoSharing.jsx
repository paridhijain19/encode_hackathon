/**
 * Photo Sharing Component for Amble
 * 
 * Allows family members to share photos with elderly users.
 * Features:
 * - Photo upload and gallery
 * - Photo sharing between family members
 * - Simple slideshow view for elderly users
 */

import { useState, useEffect, useRef } from 'react'
import {
    Image, Upload, X, ChevronLeft, ChevronRight, Heart,
    Download, Share2, Trash2, Play, Pause, Grid, Maximize
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import './PhotoSharing.css'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// ============================================================
// Main Photo Sharing Component
// ============================================================

export default function PhotoSharing({ elderUserId = 'parent_user' }) {
    const { currentUser } = useAuth()
    const [photos, setPhotos] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedPhoto, setSelectedPhoto] = useState(null)
    const [isSlideshow, setIsSlideshow] = useState(false)
    const [slideshowIndex, setSlideshowIndex] = useState(0)
    const [uploadProgress, setUploadProgress] = useState(null)
    const fileInputRef = useRef(null)

    // Load photos on mount
    useEffect(() => {
        loadPhotos()
    }, [elderUserId])

    // Slideshow timer
    useEffect(() => {
        if (!isSlideshow) return
        
        const timer = setInterval(() => {
            setSlideshowIndex(prev => (prev + 1) % photos.length)
        }, 5000)

        return () => clearInterval(timer)
    }, [isSlideshow, photos.length])

    const loadPhotos = async () => {
        setIsLoading(true)
        try {
            const response = await fetch(`${API_BASE}/api/photos/${elderUserId}`)
            if (response.ok) {
                const data = await response.json()
                setPhotos(data.photos || [])
            }
        } catch (error) {
            console.error('Failed to load photos:', error)
            // Use sample data for demo
            setPhotos(getSamplePhotos())
        }
        setIsLoading(false)
    }

    const handleUpload = async (event) => {
        const files = event.target.files
        if (!files?.length) return

        setUploadProgress(0)

        for (let i = 0; i < files.length; i++) {
            const file = files[i]
            
            // Create preview URL
            const previewUrl = URL.createObjectURL(file)
            
            // In a real app, upload to server/Supabase storage
            // For demo, add to local state
            const newPhoto = {
                id: Date.now() + i,
                url: previewUrl,
                thumbnail: previewUrl,
                caption: file.name.replace(/\.[^/.]+$/, ''),
                uploadedBy: currentUser?.name || 'Family',
                uploadedAt: new Date().toISOString(),
                likes: 0,
                isLiked: false
            }

            setPhotos(prev => [newPhoto, ...prev])
            setUploadProgress(((i + 1) / files.length) * 100)
        }

        setTimeout(() => setUploadProgress(null), 1000)
        
        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const handleDelete = async (photoId) => {
        if (!confirm('Delete this photo?')) return
        
        setPhotos(prev => prev.filter(p => p.id !== photoId))
        setSelectedPhoto(null)
    }

    const handleLike = (photoId) => {
        setPhotos(prev => prev.map(p => {
            if (p.id === photoId) {
                return {
                    ...p,
                    isLiked: !p.isLiked,
                    likes: p.isLiked ? p.likes - 1 : p.likes + 1
                }
            }
            return p
        }))
    }

    const startSlideshow = () => {
        setSlideshowIndex(0)
        setIsSlideshow(true)
    }

    const stopSlideshow = () => {
        setIsSlideshow(false)
    }

    return (
        <div className="photo-sharing">
            {/* Header */}
            <div className="photo-header">
                <h2><Image size={24} /> Family Photos</h2>
                <div className="photo-actions">
                    {photos.length > 0 && (
                        <button className="slideshow-btn" onClick={startSlideshow}>
                            <Play size={18} /> Slideshow
                        </button>
                    )}
                    <label className="upload-btn">
                        <Upload size={18} /> Upload
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleUpload}
                            hidden
                        />
                    </label>
                </div>
            </div>

            {/* Upload progress */}
            {uploadProgress !== null && (
                <div className="upload-progress">
                    <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                    <span>Uploading... {Math.round(uploadProgress)}%</span>
                </div>
            )}

            {/* Photo Grid */}
            {isLoading ? (
                <div className="loading-state">
                    <p>Loading photos...</p>
                </div>
            ) : photos.length === 0 ? (
                <div className="empty-state">
                    <Image size={48} />
                    <h3>No photos yet</h3>
                    <p>Share photos with your family by uploading them here</p>
                    <label className="upload-btn-large">
                        <Upload size={20} /> Upload Photos
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleUpload}
                            hidden
                        />
                    </label>
                </div>
            ) : (
                <div className="photo-grid">
                    {photos.map((photo, idx) => (
                        <div 
                            key={photo.id} 
                            className="photo-card"
                            onClick={() => setSelectedPhoto(photo)}
                        >
                            <img src={photo.thumbnail || photo.url} alt={photo.caption} />
                            <div className="photo-overlay">
                                <span className="photo-caption">{photo.caption}</span>
                                {photo.likes > 0 && (
                                    <span className="photo-likes">
                                        <Heart size={14} fill={photo.isLiked ? 'currentColor' : 'none'} />
                                        {photo.likes}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Photo Viewer Modal */}
            {selectedPhoto && !isSlideshow && (
                <PhotoViewer
                    photo={selectedPhoto}
                    photos={photos}
                    onClose={() => setSelectedPhoto(null)}
                    onDelete={handleDelete}
                    onLike={handleLike}
                    onNavigate={(photo) => setSelectedPhoto(photo)}
                />
            )}

            {/* Slideshow Mode */}
            {isSlideshow && photos.length > 0 && (
                <Slideshow
                    photos={photos}
                    currentIndex={slideshowIndex}
                    onIndexChange={setSlideshowIndex}
                    onClose={stopSlideshow}
                />
            )}
        </div>
    )
}

// ============================================================
// Photo Viewer Modal
// ============================================================

function PhotoViewer({ photo, photos, onClose, onDelete, onLike, onNavigate }) {
    const currentIndex = photos.findIndex(p => p.id === photo.id)
    
    const goToPrev = () => {
        if (currentIndex > 0) {
            onNavigate(photos[currentIndex - 1])
        }
    }

    const goToNext = () => {
        if (currentIndex < photos.length - 1) {
            onNavigate(photos[currentIndex + 1])
        }
    }

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose()
            if (e.key === 'ArrowLeft') goToPrev()
            if (e.key === 'ArrowRight') goToNext()
        }
        
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [currentIndex])

    return (
        <div className="photo-viewer-overlay" onClick={onClose}>
            <div className="photo-viewer" onClick={e => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose}>
                    <X size={24} />
                </button>

                <div className="viewer-main">
                    {currentIndex > 0 && (
                        <button className="nav-btn prev" onClick={goToPrev}>
                            <ChevronLeft size={32} />
                        </button>
                    )}

                    <img src={photo.url} alt={photo.caption} />

                    {currentIndex < photos.length - 1 && (
                        <button className="nav-btn next" onClick={goToNext}>
                            <ChevronRight size={32} />
                        </button>
                    )}
                </div>

                <div className="viewer-footer">
                    <div className="photo-info">
                        <h3>{photo.caption}</h3>
                        <p>
                            Shared by {photo.uploadedBy} • 
                            {new Date(photo.uploadedAt).toLocaleDateString()}
                        </p>
                    </div>
                    <div className="viewer-actions">
                        <button 
                            className={`action-btn ${photo.isLiked ? 'liked' : ''}`}
                            onClick={() => onLike(photo.id)}
                        >
                            <Heart size={20} fill={photo.isLiked ? 'currentColor' : 'none'} />
                        </button>
                        <button className="action-btn">
                            <Download size={20} />
                        </button>
                        <button className="action-btn">
                            <Share2 size={20} />
                        </button>
                        <button 
                            className="action-btn delete"
                            onClick={() => onDelete(photo.id)}
                        >
                            <Trash2 size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ============================================================
// Slideshow Component
// ============================================================

function Slideshow({ photos, currentIndex, onIndexChange, onClose }) {
    const [isPaused, setIsPaused] = useState(false)

    const goToPrev = () => {
        onIndexChange(currentIndex === 0 ? photos.length - 1 : currentIndex - 1)
    }

    const goToNext = () => {
        onIndexChange((currentIndex + 1) % photos.length)
    }

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose()
            if (e.key === 'ArrowLeft') goToPrev()
            if (e.key === 'ArrowRight') goToNext()
            if (e.key === ' ') setIsPaused(p => !p)
        }
        
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [currentIndex])

    const currentPhoto = photos[currentIndex]

    return (
        <div className="slideshow-overlay">
            <div className="slideshow-controls">
                <button onClick={onClose}>
                    <X size={24} />
                </button>
                <span>{currentIndex + 1} / {photos.length}</span>
                <button onClick={() => setIsPaused(p => !p)}>
                    {isPaused ? <Play size={24} /> : <Pause size={24} />}
                </button>
            </div>

            <div className="slideshow-content">
                <button className="nav-btn prev" onClick={goToPrev}>
                    <ChevronLeft size={48} />
                </button>

                <div className="slideshow-image">
                    <img src={currentPhoto.url} alt={currentPhoto.caption} />
                    <div className="slideshow-caption">
                        <h2>{currentPhoto.caption}</h2>
                        <p>From {currentPhoto.uploadedBy}</p>
                    </div>
                </div>

                <button className="nav-btn next" onClick={goToNext}>
                    <ChevronRight size={48} />
                </button>
            </div>

            <div className="slideshow-thumbnails">
                {photos.map((photo, idx) => (
                    <button
                        key={photo.id}
                        className={`thumbnail ${idx === currentIndex ? 'active' : ''}`}
                        onClick={() => onIndexChange(idx)}
                    >
                        <img src={photo.thumbnail || photo.url} alt="" />
                    </button>
                ))}
            </div>
        </div>
    )
}

// ============================================================
// Photo Widget for Dashboard
// ============================================================

export function PhotoWidget({ photos = [], onViewAll }) {
    const recentPhotos = photos.slice(0, 4)

    return (
        <div className="photo-widget">
            <div className="widget-header">
                <h3><Image size={18} /> Recent Photos</h3>
                {onViewAll && (
                    <button onClick={onViewAll}>View All</button>
                )}
            </div>
            
            {recentPhotos.length === 0 ? (
                <p className="empty-text">No photos shared yet</p>
            ) : (
                <div className="widget-grid">
                    {recentPhotos.map(photo => (
                        <div key={photo.id} className="widget-photo">
                            <img src={photo.thumbnail || photo.url} alt={photo.caption} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

// ============================================================
// Sample Data for Demo
// ============================================================

function getSamplePhotos() {
    return [
        {
            id: 1,
            url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
            thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
            caption: 'Family Dinner',
            uploadedBy: 'Sarah',
            uploadedAt: new Date(Date.now() - 86400000).toISOString(),
            likes: 3,
            isLiked: true
        },
        {
            id: 2,
            url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800',
            thumbnail: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=200',
            caption: 'Weekend Picnic',
            uploadedBy: 'Mike',
            uploadedAt: new Date(Date.now() - 172800000).toISOString(),
            likes: 5,
            isLiked: false
        },
        {
            id: 3,
            url: 'https://images.unsplash.com/photo-1516733968668-dbdce39c4651?w=800',
            thumbnail: 'https://images.unsplash.com/photo-1516733968668-dbdce39c4651?w=200',
            caption: 'Birthday Celebration',
            uploadedBy: 'Emma',
            uploadedAt: new Date(Date.now() - 259200000).toISOString(),
            likes: 8,
            isLiked: true
        },
        {
            id: 4,
            url: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800',
            thumbnail: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=200',
            caption: 'Garden Walk',
            uploadedBy: 'Sarah',
            uploadedAt: new Date(Date.now() - 345600000).toISOString(),
            likes: 2,
            isLiked: false
        }
    ]
}
