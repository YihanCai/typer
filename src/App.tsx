import { Routes, Route } from 'react-router-dom'
import SongSelect from './components/SongSelect'
import GameScreen from './components/GameScreen'
import ResultScreen from './components/ResultScreen'

export default function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<SongSelect />} />
        <Route path="/play/:songId" element={<GameScreen />} />
        <Route path="/result" element={<ResultScreen />} />
      </Routes>
    </div>
  )
}