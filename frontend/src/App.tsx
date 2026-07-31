import { Navigate, Route, Routes } from 'react-router-dom'
import NavBar from './components/NavBar'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import TopicsPage from './pages/TopicsPage'
import TopicDetailPage from './pages/TopicDetailPage'
import EntityDetailPage from './pages/EntityDetailPage'
import ListDetailPage from './pages/ListDetailPage'
import AccountLayout from './pages/AccountLayout'
import AccountSettingsPage from './pages/AccountSettingsPage'
import AccountFriendsPage from './pages/AccountFriendsPage'

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
          <Route path="/account" element={<AccountLayout />}>
            <Route index element={<Navigate to="/account/settings" replace />} />
            <Route path="settings" element={<AccountSettingsPage />} />
            <Route path="friends" element={<AccountFriendsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/topics" replace />} />
      </Routes>
    </div>
  )
}
