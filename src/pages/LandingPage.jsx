import { Link } from 'react-router-dom'
import { Heart, Activity, Bell, Phone, ArrowRight, Sun, Calendar, Users, Shield, CheckCircle, Clock, Brain, Smile } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { UserBadge, SignInModal } from '../components/SignIn'
import { useState } from 'react'
import './LandingPage.css'

function LandingPage() {
    const { currentUser, isSignedIn } = useAuth()
    const [showSignIn, setShowSignIn] = useState(false)
    const [signInMode, setSignInMode] = useState('parent')

    // Determine where to link based on auth status
    const getStartLink = () => {
        if (!isSignedIn) return null // Will show sign-in modal
        if (currentUser?.role === 'parent') return '/parent'
        return '/family'
    }

    const handleStartClick = (mode) => {
        if (isSignedIn) return // Link will handle it
        setSignInMode(mode)
        setShowSignIn(true)
    }

    return (
        <div className="landing-page">
            {/* Sign-in modal */}
            {showSignIn && (
                <SignInModal 
                    mode={signInMode} 
                    onClose={() => setShowSignIn(false)} 
                />
            )}

            {/* Navigation */}
            <nav className="navbar">
                <div className="container navbar-content">
                    <Link to="/" className="logo">
                        <span className="logo-icon">🌿</span>
                        <span className="logo-text">amble</span>
                    </Link>
                    <div className="nav-links">
                        <a href="#features">Features</a>
                        <a href="#how-it-works">How It Works</a>
                        <a href="#about">About</a>
                    </div>
                    <div className="nav-actions">
                        {isSignedIn ? (
                            <>
                                <Link 
                                    to={currentUser?.role === 'parent' ? '/parent' : '/family'} 
                                    className="btn btn-outline"
                                >
                                    My Dashboard
                                </Link>
                                <UserBadge />
                            </>
                        ) : (
                            <>
                                <button 
                                    className="btn btn-outline" 
                                    onClick={() => handleStartClick('parent')}
                                >
                                    I'm a Parent
                                </button>
                                <button 
                                    className="btn btn-primary" 
                                    onClick={() => handleStartClick('family')}
                                >
                                    Family Member
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero Section with Phone Mockup */}
            <section className="hero">
                <div className="container hero-content">
                    <div className="hero-text">
                        <p className="hero-tag">✨ Your Gentle Wellness Companion</p>
                        <h1 className="hero-title">
                            Stay Active, Stay<br />
                            <span className="highlight">Connected</span>
                        </h1>
                        <p className="hero-subtitle">
                            Amble helps you maintain healthy daily routines while keeping your loved ones
                            connected and at peace. An AI companion that adapts to your lifestyle,
                            not the other way around.
                        </p>
                        <div className="hero-cta">
                            {isSignedIn ? (
                                <Link to={currentUser?.role === 'parent' ? '/parent' : '/family'} className="btn btn-primary btn-lg">
                                    <span>🌱</span> Go to Dashboard
                                </Link>
                            ) : (
                                <>
                                    <button className="btn btn-primary btn-lg" onClick={() => handleStartClick('parent')}>
                                        <span>🌱</span> Get Started
                                    </button>
                                    <button className="btn btn-secondary btn-lg" onClick={() => handleStartClick('family')}>
                                        <span>👨‍👩‍👧</span> For Family
                                    </button>
                                </>
                            )}
                        </div>
                        <div className="hero-stats">
                            <div className="stat">
                                <span className="stat-number">10K+</span>
                                <span className="stat-label">Active Users</span>
                            </div>
                            <div className="stat">
                                <span className="stat-number">95%</span>
                                <span className="stat-label">Routine Adherence</span>
                            </div>
                            <div className="stat">
                                <span className="stat-number">4.9</span>
                                <span className="stat-label">User Rating</span>
                            </div>
                        </div>
                    </div>

                    {/* Phone Mockup */}
                    <div className="hero-phone">
                        <div className="phone-frame">
                            <div className="phone-notch"></div>
                            <div className="phone-screen">
                                <div className="screen-header">
                                    <span className="greeting">Good Morning! ☀️</span>
                                    <span className="time">10:30 AM</span>
                                </div>
                                <div className="screen-card success">
                                    <CheckCircle size={20} />
                                    <span>Morning walk completed ✓</span>
                                </div>
                                <div className="screen-card activity">
                                    <Activity size={20} />
                                    <span>Yoga session at 11 AM</span>
                                </div>
                                <div className="screen-notification">
                                    <span className="notif-icon">🎉</span>
                                    <span>Sarah says: "Great job on your walk, Mom!"</span>
                                </div>
                                <div className="screen-buttons">
                                    <button className="screen-btn routine">📋 Today</button>
                                    <button className="screen-btn connect">💬 Connect</button>
                                </div>
                                <div className="screen-buttons">
                                    <button className="screen-btn wellness">🧘 Wellness</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="features-section">
                <div className="container">
                    <div className="section-header">
                        <span className="section-tag">Features</span>
                        <h2>Built for Your Lifestyle</h2>
                        <p>Simple, thoughtful features designed for people who value their independence and want to stay connected.</p>
                    </div>

                    <div className="features-tabs">
                        <div className="tab-header">
                            <span className="tab">🌿 For You — Simple & Supportive</span>
                        </div>

                        <div className="features-grid">
                            <div className="feature-card">
                                <div className="feature-icon moss">
                                    <Sun size={28} />
                                </div>
                                <h3>Daily Routine Companion</h3>
                                <p>Gentle reminders for walks, medication, meals, and activities that adapt to your natural rhythm.</p>
                                <span className="feature-tag">🌅 Adaptive</span>
                            </div>

                            <div className="feature-card">
                                <div className="feature-icon clay">
                                    <Calendar size={28} />
                                </div>
                                <h3>Activity Discovery</h3>
                                <p>Find local walking groups, book clubs, fitness classes, and community events in your area.</p>
                                <span className="feature-tag">📍 Location Based</span>
                            </div>

                            <div className="feature-card">
                                <div className="feature-icon sage">
                                    <Heart size={28} />
                                </div>
                                <h3>Wellness Check-ins</h3>
                                <p>Track your mood, energy levels, and daily accomplishments. Celebrate small wins every day.</p>
                                <span className="feature-tag">❤️ Self-Care</span>
                            </div>

                            <div className="feature-card">
                                <div className="feature-icon ocean">
                                    <Phone size={28} />
                                </div>
                                <h3>Easy Family Connection</h3>
                                <p>Share moments, send voice messages, and stay connected with one tap. No complicated apps needed.</p>
                                <span className="feature-tag">👨‍👩‍👧 Family Connect</span>
                            </div>
                        </div>
                    </div>

                    <div className="features-tabs">
                        <div className="tab-header">
                            <span className="tab">👨‍👩‍👧 For Family — Peace of Mind</span>
                        </div>

                        <div className="features-grid">
                            <div className="feature-card mini">
                                <Activity size={24} className="mini-icon moss" />
                                <div>
                                    <h4>Activity Insights</h4>
                                    <p>See how your loved one is doing at a glance — activities, wellness, and social engagement</p>
                                </div>
                            </div>
                            <div className="feature-card mini">
                                <Brain size={24} className="mini-icon clay" />
                                <div>
                                    <h4>Smart Detection</h4>
                                    <p>AI notices patterns and gently intervenes when routines slip — before issues arise</p>
                                </div>
                            </div>
                            <div className="feature-card mini">
                                <Bell size={24} className="mini-icon ocean" />
                                <div>
                                    <h4>Intelligent Alerts</h4>
                                    <p>Get notified only when it matters — no noise, just meaningful updates</p>
                                </div>
                            </div>
                            <div className="feature-card mini">
                                <Users size={24} className="mini-icon lavender" />
                                <div>
                                    <h4>Family Coordination</h4>
                                    <p>Coordinate calls and visits with siblings so everyone stays involved</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section id="how-it-works" className="how-section">
                <div className="container">
                    <div className="section-header">
                        <span className="section-tag">How It Works</span>
                        <h2>Getting Started is Simple</h2>
                    </div>

                    <div className="steps-grid">
                        <div className="step-card">
                            <div className="step-number">1</div>
                            <h3>Set Up Your Profile</h3>
                            <p>Tell us about your daily routine, interests, and wellness goals. Amble learns and adapts to you.</p>
                        </div>
                        <div className="step-card">
                            <div className="step-number">2</div>
                            <h3>Connect Your Circle</h3>
                            <p>Invite family members who want to stay connected. They get their own dashboard and updates.</p>
                        </div>
                        <div className="step-card">
                            <div className="step-number">3</div>
                            <h3>Live Your Best Days</h3>
                            <p>Amble gently guides your routines, celebrates achievements, and keeps everyone connected.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Privacy Section */}
            <section id="about" className="privacy-section">
                <div className="container">
                    <div className="privacy-content">
                        <Shield size={48} className="privacy-icon" />
                        <h2>Your Privacy, Your Control</h2>
                        <p>You decide what to share and with whom. Amble believes in supporting independence, not surveillance. Your data is encrypted, private, and never sold. We're here to help, not to watch.</p>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <div className="container">
                    <h2>Ready to Start Your Journey?</h2>
                    <p>Join thousands of people who are living better, more connected lives with Amble</p>
                    <div className="cta-buttons">
                        {isSignedIn ? (
                            <Link to={currentUser?.role === 'parent' ? '/parent' : '/family'} className="btn btn-white btn-lg">
                                Go to Dashboard
                            </Link>
                        ) : (
                            <>
                                <button className="btn btn-white btn-lg" onClick={() => handleStartClick('parent')}>
                                    Try Amble Free
                                </button>
                                <button className="btn btn-outline-white btn-lg" onClick={() => handleStartClick('family')}>
                                    Family Portal
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="footer">
                <div className="container">
                    <div className="footer-content">
                        <div className="footer-brand">
                            <span className="logo-icon">🌿</span>
                            <span className="logo-text">amble</span>
                            <p>Your gentle companion for daily wellness.</p>
                        </div>
                        <div className="footer-links">
                            <a href="#">Privacy Policy</a>
                            <a href="#">Terms of Service</a>
                            <a href="#">Contact Us</a>
                            <a href="#">Help Center</a>
                        </div>
                    </div>
                    <p className="copyright">© 2026 Amble. Designed with care for better living.</p>
                </div>
            </footer>
        </div>
    )
}

export default LandingPage
