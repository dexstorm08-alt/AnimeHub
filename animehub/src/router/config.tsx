
import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import AdminLayout from '../pages/admin/AdminLayout';

const HomePage = lazy(() => import('../pages/home/page'));
const AnimePage = lazy(() => import('../pages/anime/page'));
const AnimeDetailPage = lazy(() => import('../pages/anime-detail/page'));
const PlayerPage = lazy(() => import('../pages/player/page'));
const WatchlistPage = lazy(() => import('../pages/watchlist/page'));
const ProfilePage = lazy(() => import('../pages/profile/page'));
const SearchPage = lazy(() => import('../pages/search/page'));
const SettingsPage = lazy(() => import('../pages/settings/page'));
const FavoritesPage = lazy(() => import('../pages/favorites/page'));
const NotFoundPage = lazy(() => import('../pages/NotFound'));

// Admin Pages
const AdminDashboard = lazy(() => import('../pages/admin/page'));
const AdminAnime = lazy(() => import('../pages/admin/anime/page'));
const AdminUsers = lazy(() => import('../pages/admin/users/page'));
const AdminReports = lazy(() => import('../pages/admin/reports/page'));
const AdminAnalytics = lazy(() => import('../pages/admin/analytics/page'));
const AdminPerformance = lazy(() => import('../pages/admin/performance/page'));
const AdminSettings = lazy(() => import('../pages/admin/settings/page'));

const routes: RouteObject[] = [
  {
    path: '/',
    element: <HomePage />
  },
  {
    path: '/anime',
    element: <AnimePage />
  },
  {
    path: '/anime/:id',
    element: <AnimeDetailPage />
  },
  {
    path: '/player/:animeId/:episode',
    element: <PlayerPage />
  },
  {
    path: '/watchlist',
    element: (
      <ProtectedRoute>
        <WatchlistPage />
      </ProtectedRoute>
    )
  },
  {
    path: '/profile',
    element: (
      <ProtectedRoute>
        <ProfilePage />
      </ProtectedRoute>
    )
  },
  {
    path: '/search',
    element: <SearchPage />
  },
  {
    path: '/settings',
    element: (
      <ProtectedRoute>
        <SettingsPage />
      </ProtectedRoute>
    )
  },
  {
    path: '/favorites',
    element: (
      <ProtectedRoute>
        <FavoritesPage />
      </ProtectedRoute>
    )
  },
  // Admin Routes
  {
    path: '/admin',
    element: (
      <ProtectedRoute requireAdmin>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <AdminDashboard />
      },
      {
        path: 'anime',
        element: <AdminAnime />
      },
      {
        path: 'users',
        element: <AdminUsers />
      },
      {
        path: 'reports',
        element: <AdminReports />
      },
      {
        path: 'analytics',
        element: <AdminAnalytics />
      },
      {
        path: 'performance',
        element: <AdminPerformance />
      },
      {
        path: 'settings',
        element: <AdminSettings />
      }
    ]
  },
  {
    path: '*',
    element: <NotFoundPage />
  }
];

export default routes;
