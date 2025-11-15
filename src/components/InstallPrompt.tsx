import { useState, useEffect } from 'react'
import './InstallPrompt.css'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Check if running on iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    setIsIOS(iOS)

    // Check if app is already installed (standalone mode)
    const standalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    setIsStandalone(standalone)

    if (standalone) {
      setIsInstalled(true)
      return
    }

    // Listen for the beforeinstallprompt event (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Show prompt after a delay for iOS or if no install prompt is available
    const timer = setTimeout(() => {
      if (!standalone) {
        setShowPrompt(true)
      }
    }, 3000)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      clearTimeout(timer)
    }
  }, [])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        setIsInstalled(true)
        setShowPrompt(false)
      }
      
      setDeferredPrompt(null)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
  }

  if (isInstalled || isStandalone || !showPrompt) {
    return null
  }

  return (
    <div className="install-prompt">
      <div className="install-prompt-content">
        {isIOS ? (
          <>
            <h3>Install Junction 2025</h3>
            <p>To install this app on your iOS device:</p>
            <ol>
              <li>Tap the <strong>Share</strong> button <span className="ios-icon">⎋</span></li>
              <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
              <li>Tap <strong>"Add"</strong> to confirm</li>
            </ol>
          </>
        ) : deferredPrompt ? (
          <>
            <h3>Install Junction 2025</h3>
            <p>Install this app on your device for a better experience!</p>
            <div className="install-buttons">
              <button onClick={handleInstallClick} className="install-button">
                Install App
              </button>
              <button onClick={handleDismiss} className="dismiss-button">
                Not Now
              </button>
            </div>
          </>
        ) : (
          <>
            <h3>Install Junction 2025</h3>
            <p>Look for the install icon in your browser's address bar to add this app to your home screen.</p>
            <button onClick={handleDismiss} className="dismiss-button">
              Got it
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default InstallPrompt

