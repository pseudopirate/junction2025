import { useState } from 'react'
import InstallPrompt from './components/InstallPrompt'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="App">
      <header className="App-header">
        <h1>Junction 2025 PWA</h1>
        <p>Welcome to your Progressive Web App</p>
        <div className="card">
          <button onClick={() => setCount((count) => count + 1)}>
            count is {count}
          </button>
          <p>
            Edit <code>src/App.tsx</code> and save to test HMR
          </p>
        </div>
        <p className="read-the-docs">
          This app is installable on Android and iOS devices
        </p>
      </header>
      <InstallPrompt />
    </div>
  )
}

export default App

