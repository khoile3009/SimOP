import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from '@/components/pages/HomePage'
import DeckBuilderPage from '@/components/pages/DeckBuilderPage'
import PlayPage from '@/components/pages/PlayPage'
import CardsPage from '@/components/pages/CardsPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/deck-builder" element={<DeckBuilderPage />} />
        <Route path="/play" element={<PlayPage />} />
        <Route path="/cards" element={<CardsPage />} />
      </Routes>
    </BrowserRouter>
  )
}
