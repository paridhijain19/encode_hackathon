/**
 * Smart Home Integration Component for Amble
 * 
 * Displays and controls smart home devices.
 * Shows device status with simple toggle controls.
 */

import { useState, useEffect } from 'react'
import {
    Lightbulb, Thermometer, Lock, DoorOpen, Camera,
    Speaker, Tv, Fan, Power, Shield, Wifi, WifiOff,
    Plus, Settings, ToggleLeft, ToggleRight
} from 'lucide-react'
import './SmartHome.css'

// ============================================================
// Sample Smart Home Devices
// ============================================================

const getSampleDevices = () => [
    {
        id: 1,
        name: 'Living Room Lights',
        type: 'light',
        room: 'Living Room',
        status: 'on',
        brightness: 80,
        connected: true
    },
    {
        id: 2,
        name: 'Front Door Lock',
        type: 'lock',
        room: 'Entryway',
        status: 'locked',
        connected: true
    },
    {
        id: 3,
        name: 'Thermostat',
        type: 'thermostat',
        room: 'Hallway',
        status: 'on',
        temperature: 72,
        targetTemp: 70,
        mode: 'cool',
        connected: true
    },
    {
        id: 4,
        name: 'Bedroom Camera',
        type: 'camera',
        room: 'Bedroom',
        status: 'on',
        recording: true,
        connected: true
    },
    {
        id: 5,
        name: 'Kitchen Speaker',
        type: 'speaker',
        room: 'Kitchen',
        status: 'off',
        volume: 50,
        connected: true
    },
    {
        id: 6,
        name: 'Smart TV',
        type: 'tv',
        room: 'Living Room',
        status: 'off',
        connected: true
    },
    {
        id: 7,
        name: 'Ceiling Fan',
        type: 'fan',
        room: 'Bedroom',
        status: 'on',
        speed: 'medium',
        connected: true
    },
    {
        id: 8,
        name: 'Security System',
        type: 'security',
        room: 'Whole Home',
        status: 'armed',
        mode: 'home',
        connected: true
    }
]

// ============================================================
// Device Icons
// ============================================================

const getDeviceIcon = (type, size = 24) => {
    const icons = {
        light: <Lightbulb size={size} />,
        lock: <Lock size={size} />,
        thermostat: <Thermometer size={size} />,
        camera: <Camera size={size} />,
        speaker: <Speaker size={size} />,
        tv: <Tv size={size} />,
        fan: <Fan size={size} />,
        security: <Shield size={size} />,
        door: <DoorOpen size={size} />
    }
    return icons[type] || <Power size={size} />
}

// ============================================================
// Main Smart Home Component
// ============================================================

export default function SmartHome() {
    const [devices, setDevices] = useState([])
    const [selectedRoom, setSelectedRoom] = useState('all')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Simulate loading devices
        setTimeout(() => {
            setDevices(getSampleDevices())
            setLoading(false)
        }, 1000)
    }, [])

    // Get unique rooms
    const rooms = ['all', ...new Set(devices.map(d => d.room))]

    // Filter devices by room
    const filteredDevices = selectedRoom === 'all'
        ? devices
        : devices.filter(d => d.room === selectedRoom)

    const toggleDevice = (deviceId) => {
        setDevices(devices.map(device => {
            if (device.id === deviceId) {
                let newStatus
                switch (device.type) {
                    case 'lock':
                        newStatus = device.status === 'locked' ? 'unlocked' : 'locked'
                        break
                    case 'security':
                        newStatus = device.status === 'armed' ? 'disarmed' : 'armed'
                        break
                    default:
                        newStatus = device.status === 'on' ? 'off' : 'on'
                }
                return { ...device, status: newStatus }
            }
            return device
        }))
    }

    const getStatusClass = (device) => {
        switch (device.type) {
            case 'lock':
                return device.status === 'locked' ? 'secure' : 'warning'
            case 'security':
                return device.status === 'armed' ? 'secure' : 'warning'
            default:
                return device.status === 'on' ? 'active' : 'inactive'
        }
    }

    const getStatusText = (device) => {
        switch (device.type) {
            case 'lock':
                return device.status === 'locked' ? 'Locked' : 'Unlocked'
            case 'security':
                return device.status === 'armed' ? 'Armed' : 'Disarmed'
            case 'thermostat':
                return `${device.temperature}°F → ${device.targetTemp}°F`
            case 'fan':
                return device.status === 'on' ? `On - ${device.speed}` : 'Off'
            default:
                return device.status === 'on' ? 'On' : 'Off'
        }
    }

    if (loading) {
        return (
            <div className="smart-home loading">
                <div className="loading-spinner"></div>
                <p>Connecting to smart home...</p>
            </div>
        )
    }

    return (
        <div className="smart-home">
            {/* Header */}
            <div className="smart-home-header">
                <h2>🏠 Smart Home</h2>
                <button className="add-device-btn">
                    <Plus size={18} />
                    Add Device
                </button>
            </div>

            {/* Room Filter */}
            <div className="room-filter">
                {rooms.map(room => (
                    <button
                        key={room}
                        className={`room-btn ${selectedRoom === room ? 'active' : ''}`}
                        onClick={() => setSelectedRoom(room)}
                    >
                        {room === 'all' ? 'All Rooms' : room}
                    </button>
                ))}
            </div>

            {/* Quick Status */}
            <div className="quick-status">
                <div className="status-card">
                    <Lock size={20} />
                    <span>
                        {devices.filter(d => d.type === 'lock' && d.status === 'locked').length}/
                        {devices.filter(d => d.type === 'lock').length} Locked
                    </span>
                </div>
                <div className="status-card">
                    <Lightbulb size={20} />
                    <span>
                        {devices.filter(d => d.type === 'light' && d.status === 'on').length} Lights On
                    </span>
                </div>
                <div className="status-card">
                    <Thermometer size={20} />
                    <span>
                        {devices.find(d => d.type === 'thermostat')?.temperature || '--'}°F
                    </span>
                </div>
            </div>

            {/* Devices Grid */}
            <div className="devices-grid">
                {filteredDevices.map(device => (
                    <div 
                        key={device.id}
                        className={`device-card ${getStatusClass(device)}`}
                        onClick={() => toggleDevice(device.id)}
                    >
                        <div className="device-header">
                            <div className={`device-icon ${device.status}`}>
                                {getDeviceIcon(device.type)}
                            </div>
                            {device.connected ? (
                                <Wifi size={14} className="connection-icon connected" />
                            ) : (
                                <WifiOff size={14} className="connection-icon disconnected" />
                            )}
                        </div>
                        
                        <div className="device-info">
                            <h4>{device.name}</h4>
                            <span className="device-room">{device.room}</span>
                        </div>

                        <div className="device-status">
                            <span className={`status-text ${getStatusClass(device)}`}>
                                {getStatusText(device)}
                            </span>
                            <div className="toggle-icon">
                                {device.status === 'on' || device.status === 'locked' || device.status === 'armed' ? (
                                    <ToggleRight size={24} className="on" />
                                ) : (
                                    <ToggleLeft size={24} className="off" />
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
                <h3>Quick Actions</h3>
                <div className="actions-grid">
                    <button className="action-btn" onClick={() => {
                        setDevices(devices.map(d => 
                            d.type === 'lock' ? { ...d, status: 'locked' } : d
                        ))
                    }}>
                        <Lock size={20} />
                        Lock All
                    </button>
                    <button className="action-btn" onClick={() => {
                        setDevices(devices.map(d => 
                            d.type === 'light' ? { ...d, status: 'off' } : d
                        ))
                    }}>
                        <Lightbulb size={20} />
                        All Lights Off
                    </button>
                    <button className="action-btn" onClick={() => {
                        setDevices(devices.map(d => 
                            d.type === 'security' ? { ...d, status: 'armed', mode: 'away' } : d
                        ))
                    }}>
                        <Shield size={20} />
                        Away Mode
                    </button>
                    <button className="action-btn" onClick={() => {
                        setDevices(devices.map(d => 
                            d.type === 'security' ? { ...d, status: 'armed', mode: 'home' } : d
                        ))
                    }}>
                        <Shield size={20} />
                        Home Mode
                    </button>
                </div>
            </div>
        </div>
    )
}

// ============================================================
// Smart Home Widget (Compact)
// ============================================================

export function SmartHomeWidget() {
    const [devices, setDevices] = useState([])
    
    useEffect(() => {
        setDevices(getSampleDevices())
    }, [])

    const getStatusSummary = () => {
        const locks = devices.filter(d => d.type === 'lock')
        const lockedCount = locks.filter(d => d.status === 'locked').length
        const allLocked = lockedCount === locks.length

        const lightsOn = devices.filter(d => d.type === 'light' && d.status === 'on').length
        
        const thermostat = devices.find(d => d.type === 'thermostat')
        
        const security = devices.find(d => d.type === 'security')

        return { allLocked, lockedCount, locks: locks.length, lightsOn, thermostat, security }
    }

    const status = getStatusSummary()

    return (
        <div className="smart-home-widget">
            <div className="widget-header">
                <h3>🏠 Smart Home</h3>
            </div>
            
            <div className="widget-content">
                <div className={`status-item ${status.allLocked ? 'secure' : 'warning'}`}>
                    <Lock size={18} />
                    <span>{status.lockedCount}/{status.locks} Doors Locked</span>
                </div>
                
                <div className="status-item">
                    <Lightbulb size={18} />
                    <span>{status.lightsOn} Lights On</span>
                </div>
                
                <div className="status-item">
                    <Thermometer size={18} />
                    <span>{status.thermostat?.temperature || '--'}°F inside</span>
                </div>

                <div className={`status-item ${status.security?.status === 'armed' ? 'secure' : 'warning'}`}>
                    <Shield size={18} />
                    <span>Security: {status.security?.status || 'Unknown'}</span>
                </div>
            </div>
        </div>
    )
}
