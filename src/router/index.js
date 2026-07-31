import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/modules/rooms/views/RoomListView.vue'),
  },
  {
    path: '/rooms/:id',
    name: 'room-detail',
    component: () => import('@/modules/rooms/views/RoomDetailView.vue'),
    props: true,
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/modules/auth/views/LoginView.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/register/student',
    name: 'register-student',
    component: () => import('@/modules/auth/views/RegisterStudentView.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/register/landlord',
    name: 'register-landlord',
    component: () => import('@/modules/auth/views/RegisterLandlordView.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('@/modules/profile/views/ProfileView.vue'),
    meta: { requiresAuth: true },
  },

  // Landlord
  {
    path: '/landlord/rooms',
    name: 'landlord-rooms',
    component: () => import('@/modules/landlord/views/MyRoomsView.vue'),
    meta: { requiresAuth: true, roles: ['landlord'] },
  },
  {
    path: '/landlord/rooms/new',
    name: 'landlord-room-create',
    component: () => import('@/modules/landlord/views/RoomFormView.vue'),
    meta: { requiresAuth: true, roles: ['landlord'] },
  },
  {
    path: '/landlord/rooms/:id/edit',
    name: 'landlord-room-edit',
    component: () => import('@/modules/landlord/views/RoomFormView.vue'),
    props: true,
    meta: { requiresAuth: true, roles: ['landlord'] },
  },

  // Admin
  {
    path: '/admin/rooms',
    name: 'admin-rooms',
    component: () => import('@/modules/admin/views/PendingRoomsView.vue'),
    meta: { requiresAuth: true, roles: ['admin'] },
  },
  {
    path: '/admin/users',
    name: 'admin-users',
    component: () => import('@/modules/admin/views/UsersView.vue'),
    meta: { requiresAuth: true, roles: ['admin'] },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

/*
 * Mirrors the backend permission matrix (docs/BACKEND_ARCHITECTURE.md,
 * section 5): this is a UX convenience only, never the actual
 * authorization boundary - the API enforces every one of these rules
 * again server-side.
 */
router.beforeEach((to) => {
  const auth = useAuthStore()

  if (to.meta.guestOnly && auth.isAuthenticated) {
    return { name: 'home' }
  }

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.meta.roles && !to.meta.roles.includes(auth.role)) {
    return { name: 'home' }
  }

  return true
})

export default router
