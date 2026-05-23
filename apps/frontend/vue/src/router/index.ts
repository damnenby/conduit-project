import { createRouter, createWebHistory } from 'vue-router'
import ArticleView from '../views/ArticleView.vue'
import EditArticleView from '../views/EditArticleView.vue'
import FeedView from '../views/FeedView.vue'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import NewArticleView from '../views/NewArticleView.vue'
import ProfileView from '../views/ProfileView.vue'
import RegisterView from '../views/RegisterView.vue'
import SettingsView from '../views/SettingsView.vue'
import { useAuth } from '../composables/useAuth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: {
        title: 'Home',
      },
    },
    {
      path: '/feed',
      name: 'feed',
      component: FeedView,
      meta: {
        requiresAuth: true,
        title: 'Feed',
      },
    },
    {
      path: '/editor',
      name: 'new-article',
      component: NewArticleView,
      meta: {
        requiresAuth: true,
        title: 'New Article',
      },
    },
    {
      path: '/editor/:slug',
      name: 'edit-article',
      component: EditArticleView,
      meta: {
        requiresAuth: true,
        title: 'Edit Article',
      },
    },
    {
      path: '/articles/:slug',
      name: 'article',
      component: ArticleView,
      meta: {
        title: 'Article',
      },
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
      meta: {
        title: 'Register',
      },
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: {
        title: 'Login',
      },
    },
    {
      path: '/profiles/:username',
      name: 'profile',
      component: ProfileView,
      meta: {
        title: 'Profile',
      },
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsView,
      meta: {
        requiresAuth: true,
        title: 'Settings',
      },
    },
  ],
})

router.beforeEach((to) => {
  const { isLoggedIn } = useAuth()

  if (to.meta.requiresAuth && !isLoggedIn.value) {
    return { name: 'login' }
  }
})

router.afterEach((to) => {
  const title = typeof to.meta.title === 'string' ? to.meta.title : ''
  document.title = title ? `${title} | Conduit` : 'Conduit'
})

export default router
