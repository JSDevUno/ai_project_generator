import { MLScriptGenerator } from './components/MLScriptGenerator'
import { ErrorBoundary } from './components/ErrorBoundary'
import './App.css'

function App() {
  return (
    <ErrorBoundary>
      <MLScriptGenerator />
    </ErrorBoundary>
  )
}

export default App
