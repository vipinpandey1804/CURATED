import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { WishlistProvider } from './context/WishlistContext';
import { useAuth } from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Pages
import HomePage from './pages/HomePage';
import ProductListingPage from './pages/ProductListingPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CollectionsPage from './pages/CollectionsPage';
import NewArrivalsPage from './pages/NewArrivalsPage';
import EditorialPage from './pages/EditorialPage';
import LookbookPage from './pages/LookbookPage';
import WishlistPage from './pages/WishlistPage';
import ShoppingCartPage from './pages/ShoppingCartPage';
import CheckoutShippingPage from './pages/CheckoutShippingPage';
import CheckoutPaymentPage from './pages/CheckoutPaymentPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import OrderInvoicePage from './pages/OrderInvoicePage';
import TrackPackagePage from './pages/TrackPackagePage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import EmailVerificationPage from './pages/EmailVerificationPage';
import EditPersonalInfoPage from './pages/EditPersonalInfoPage';
import AccountSettingsPage from './pages/AccountSettingsPage';
import ProfileAddressPage from './pages/ProfileAddressPage';
import WriteReviewPage from './pages/WriteReviewPage';
import AboutUsPage from './pages/AboutUsPage';
import ContactPage from './pages/ContactPage';

// Admin panel
import AdminRoute from './components/admin/AdminRoute';
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminProductsPage from './pages/admin/AdminProductsPage';
import AdminProductFormPage from './pages/admin/AdminProductFormPage';
import AdminCategoriesPage from './pages/admin/AdminCategoriesPage';
import AdminAttributesPage from './pages/admin/AdminAttributesPage';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import AdminOrderDetailPage from './pages/admin/AdminOrderDetailPage';
import AdminReturnsPage from './pages/admin/AdminReturnsPage';
import AdminCouponsPage from './pages/admin/AdminCouponsPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';

// Auth routes that use their own full-screen layout (no Navbar/Footer)
const AUTH_ROUTES = ['/login', '/signup', '/forgot-password', '/reset-password', '/verify-email', '/admin-panel'];

/** Redirect unauthenticated users to /login */
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function Layout() {
  const { pathname } = useLocation();
  const isAuthPage = AUTH_ROUTES.some((r) => pathname.startsWith(r));

  return (
    <>
      {!isAuthPage && <Navbar />}
      <Routes>
        {/* Main */}
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductListingPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/products/:id/review" element={<WriteReviewPage />} />
        <Route path="/collections" element={<CollectionsPage />} />
        <Route path="/new-arrivals" element={<NewArrivalsPage />} />
        <Route path="/editorial" element={<EditorialPage />} />
        <Route path="/lookbook" element={<LookbookPage />} />
        <Route path="/about-us" element={<AboutUsPage />} />
        <Route path="/contact" element={<ContactPage />} />

        {/* Wishlist */}
        <Route path="/wishlist" element={<ProtectedRoute><WishlistPage /></ProtectedRoute>} />

        {/* Cart & Checkout */}
        <Route path="/cart" element={<ShoppingCartPage />} />
        <Route path="/checkout/shipping" element={<ProtectedRoute><CheckoutShippingPage /></ProtectedRoute>} />
        <Route path="/checkout/payment" element={<ProtectedRoute><CheckoutPaymentPage /></ProtectedRoute>} />
        <Route path="/order/confirmation" element={<ProtectedRoute><OrderConfirmationPage /></ProtectedRoute>} />

        {/* Orders */}
        <Route path="/orders" element={<ProtectedRoute><OrderHistoryPage /></ProtectedRoute>} />
        <Route path="/orders/:id/invoice" element={<ProtectedRoute><OrderInvoicePage /></ProtectedRoute>} />
        <Route path="/track" element={<ProtectedRoute><TrackPackagePage /></ProtectedRoute>} />

        {/* Auth */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verify-email" element={<EmailVerificationPage />} />

        {/* Account — protected */}
        <Route path="/account/profile" element={<ProtectedRoute><EditPersonalInfoPage /></ProtectedRoute>} />
        <Route path="/account/settings" element={<ProtectedRoute><AccountSettingsPage /></ProtectedRoute>} />
        <Route path="/account/addresses" element={<ProtectedRoute><ProfileAddressPage /></ProtectedRoute>} />

        {/* 404 fallback */}
        <Route path="*" element={
          <main className="pt-[96px] min-h-screen flex flex-col items-center justify-center gap-4">
            <p className="font-serif text-6xl font-light text-brand-dark">404</p>
            <p className="text-brand-muted text-sm">Page not found.</p>
            <a href="/" className="btn-primary">Go Home</a>
          </main>
        } />
      </Routes>
      {!isAuthPage && <Footer />}
    </>
  );
}

function AdminApp() {
  return (
    <Routes>
      <Route
        path="/"
        element={<AdminRoute><AdminLayout /></AdminRoute>}
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="products" element={<AdminProductsPage />} />
        <Route path="products/new" element={<AdminProductFormPage />} />
        <Route path="products/:id" element={<AdminProductFormPage />} />
        <Route path="categories" element={<AdminCategoriesPage />} />
        <Route path="attributes" element={<AdminAttributesPage />} />
        <Route path="orders" element={<AdminOrdersPage />} />
        <Route path="orders/:id" element={<AdminOrderDetailPage />} />
        <Route path="returns" element={<AdminReturnsPage />} />
        <Route path="coupons" element={<AdminCouponsPage />} />
        <Route path="users" element={<AdminUsersPage />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/admin-panel/*" element={<AdminApp />} />
              <Route path="*" element={<Layout />} />
            </Routes>
          </BrowserRouter>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}
