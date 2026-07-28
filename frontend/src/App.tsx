import { Navigate, Route, Routes } from 'react-router-dom'
import NavBar from './components/NavBar'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import TopicsPage from './pages/TopicsPage'
import TopicDetailPage from './pages/TopicDetailPage'
import EntityDetailPage from './pages/EntityDetailPage'
import ListDetailPage from './pages/ListDetailPage'
import AccountPage from './pages/AccountPage'

export default function App() {
  return (
    <div className="min-h-screen bg-amber-50">
      <NavBar />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/topics" element={<TopicsPage />} />
          <Route path="/topics/:topicId" element={<TopicDetailPage />} />
          <Route path="/entities/:entityId" element={<EntityDetailPage />} />
          <Route path="/lists/:listId" element={<ListDetailPage />} />
          <Route path="/account" element={<AccountPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/topics" replace />} />
      </Routes>
    </div>
  )
}
