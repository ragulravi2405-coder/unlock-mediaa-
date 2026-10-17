import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import UserAuthModal from './components/UserAuthModal';
import { PurchaseProvider } from './context/PurchaseContext';
import { ToastProvider } from './context/ToastContext';
import { UserAuthProvider } from './context/UserAuthContext';

// Pages
import HomePage from './pages/HomePage';
import PhotosPage from './pages/PhotosPage';
import VideosPage from './pages/VideosPage';
import MediaDetailPage from './pages/MediaDetailPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import PaymentFailurePage from './pages/PaymentFailurePage';
import RecoveryPage from './pages/RecoveryPage';
import AboutPage from './pages/AboutPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import RefundPolicyPage from './pages/RefundPolicyPage';
import ContactPage from './pages/ContactPage';
import CopyrightPage from './pages/CopyrightPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';

function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <h1 className="font-display font-extrabold text-5xl text-slate-900 mb-2">404</h1>
      <p className="text-slate-500 text-sm mb-6">The page you requested does not exist or was moved.</p>
      <Link
        to="/"
        className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-brand-600 transition-colors"
      >
        Back to Gallery
      </Link>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <UserAuthProvider>
        <PurchaseProvider>
          <Router>
            <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-brand-500 selection:text-white">
              <Navbar />
              <UserAuthModal />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/photos" element={<PhotosPage />} />
                  <Route path="/videos" element={<VideosPage />} />
                  <Route path="/media/:id" element={<MediaDetailPage />} />
                  <Route path="/payment/success" element={<PaymentSuccessPage />} />
                  <Route path="/payment/failure" element={<PaymentFailurePage />} />
                  <Route path="/recover" element={<RecoveryPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/privacy" element={<PrivacyPage />} />
                  <Route path="/terms" element={<TermsPage />} />
                  <Route path="/refunds" element={<RefundPolicyPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/copyright" element={<CopyrightPage />} />
                  <Route path="/admin/login" element={<AdminLoginPage />} />
                  <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </Router>
        </PurchaseProvider>
      </UserAuthProvider>
    </ToastProvider>
  );
}
