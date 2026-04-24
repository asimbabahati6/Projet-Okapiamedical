import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Header } from '../../components/public/Header';
import { Footer } from '../../components/public/Footer';
import { FloatingSocialQR } from '../../components/public/FloatingSocialQR';
import { Home } from './Home';
import { Services } from './Services';
import { Contact } from './Contact';
import { Appointments } from './Appointments';
import { News } from './News';
import { NewsDetail } from './NewsDetail';
import { About } from './About';
import { PatientRegistration } from './PatientRegistration';

const validPages = new Set([
  'home', 'services', 'appointments', 'news', 'news-detail', 'about', 'contact', 'register',
]);

export function PublicLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile } = useAuth();
  const [currentPage, setCurrentPage] = useState('home');
  const [newsSlug, setNewsSlug] = useState<string | null>(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);

  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (hash) {
      if (hash.includes('/')) {
        const [page, slug] = hash.split('/');
        if (validPages.has(page)) {
          setCurrentPage(page);
          if (page === 'news-detail' && slug) {
            setNewsSlug(slug);
            setSelectedDoctorId(null);
          } else {
            setNewsSlug(null);
          }
        } else {
          setCurrentPage('home');
          setNewsSlug(null);
          setSelectedDoctorId(null);
        }
      } else if (hash.includes('?doctor=')) {
        const [page, query] = hash.split('?');
        setCurrentPage(validPages.has(page) ? page : 'home');
        const doctorId = query.replace('doctor=', '');
        setSelectedDoctorId(doctorId);
        setNewsSlug(null);
      } else {
        setCurrentPage(validPages.has(hash) ? hash : 'home');
        setNewsSlug(null);
        setSelectedDoctorId(null);
      }
    }
  }, [location]);

  const handleNavigate = (page: string, param?: string) => {
    setCurrentPage(page);

    if (page === 'news-detail' && param) {
      setNewsSlug(param);
      setSelectedDoctorId(null);
      window.location.hash = `${page}/${param}`;
    } else if (page === 'appointments' && param) {
      setNewsSlug(null);
      setSelectedDoctorId(param);
      window.location.hash = `${page}?doctor=${param}`;
    } else {
      setNewsSlug(null);
      setSelectedDoctorId(null);
      window.location.hash = page;
    }
  };

  const handleNavigateToLogin = () => {
    navigate('/admin');
  };

  const handleNavigateToDashboard = user && profile ? () => {
    navigate('/tableau-de-bord');
  } : undefined;

  function renderPage() {
    switch (currentPage) {
      case 'home':
        return <Home onNavigate={handleNavigate} />;
      case 'services':
        return <Services onNavigate={handleNavigate} />;
      case 'appointments':
        return <Appointments preselectedDoctorId={selectedDoctorId} />;
      case 'news':
        return <News onNavigate={handleNavigate} />;
      case 'news-detail':
        return newsSlug ? <NewsDetail slug={newsSlug} onNavigate={handleNavigate} /> : <News onNavigate={handleNavigate} />;
      case 'about':
        return <About />;
      case 'contact':
        return <Contact />;
      case 'register':
        return <PatientRegistration />;
      default:
        return <Home onNavigate={handleNavigate} />;
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        onNavigate={handleNavigate}
        currentPage={currentPage}
        onNavigateToLogin={handleNavigateToLogin}
        onNavigateToDashboard={handleNavigateToDashboard}
      />
      <main className="flex-1">{renderPage()}</main>
      <Footer />
      <FloatingSocialQR />
    </div>
  );
}
