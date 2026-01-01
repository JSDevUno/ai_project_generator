import { ModeSelector } from './components/ModeSelector'
import { ErrorBoundary } from './components/ErrorBoundary'
import './App.css'

function App() {
  return (
    <ErrorBoundary>
      <ModeSelector />
    </ErrorBoundary>
  )
}

export default App
