import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ProtectedRoute from './shared/components/Navigation/ProtectedRoute';
import ScrollToTop from './shared/components/Navigation/ScrollToTop';

// Layouts
import PersonalLayout from './layouts/PersonalLayout';
import ProfessionalLayout from './layouts/ProfessionalLayout';

// Páginas de Autenticação
import Login from './pages/Login';
import Fork from './pages/Fork';

// ════════════════════════════════════════════════════
// 🟢 MÓDULOS: VIDA PESSOAL
// ════════════════════════════════════════════════════

// Hub Pessoal
import HubPersonal from './modules/personal/hub/HubPersonal';

// Container: Finanças Pessoais
import FinanceDashboard from './modules/personal/finance/pages/FinanceDashboard';
import AnalyticsPage from './modules/personal/finance/pages/AnalyticsPage';
import AccountsPage from './modules/personal/finance/pages/AccountsPage';
import CardsPage from './modules/personal/finance/pages/CardsPage';
import CardDetailsPage from './modules/personal/finance/pages/CardDetailsPage';
import CardInvoicesPage from './modules/personal/finance/pages/CardInvoicesPage';
import BillsPage from './modules/personal/finance/pages/BillsPage';
import TransactionsPage from './modules/personal/finance/pages/TransactionsPage';
import NewTransactionPage from './modules/personal/finance/pages/NewTransactionPage';
import AvailableLimitsPage from './modules/personal/finance/pages/AvailableLimitsPage';

// Container: Estudos
import StudiesDashboard from './modules/personal/studies/pages/StudiesDashboard';
import CourseList from './modules/personal/studies/pages/CourseList';
import CourseDetail from './modules/personal/studies/pages/CourseDetail';
import LessonDetail from './modules/personal/studies/pages/LessonDetail';
import SearchPage from './modules/personal/studies/pages/SearchPage';

// Container: Pets
import PetPage from './modules/personal/pets/PetPage';

// Container: Sommelier (Adega)
import CellarPage from './modules/personal/sommelier/CellarPage';

// Container: Saúde
import HealthHub from './modules/personal/health/pages/HealthHub';
import TherapyPage from './modules/personal/health/pages/TherapyPage';
import TherapyEditor from './modules/personal/health/pages/TherapyEditor';
import WellnessPage from './modules/personal/health/pages/WellnessPage';
import WellnessEditor from './modules/personal/health/pages/WellnessEditor';
import PlanningPage from './modules/personal/health/pages/PlanningPage';
import WorkoutsPage from './modules/personal/health/pages/WorkoutsPage';

// Container: Espiritual
import SpiritualHub from './modules/personal/spiritual/pages/SpiritualHub';
import BibleReadingPage from './modules/personal/spiritual/pages/BibleReadingPage';
import SermonsPage from './modules/personal/spiritual/pages/SermonsPage';
import SermonEditor from './modules/personal/spiritual/pages/SermonEditor';
import StudyNotesPage from './modules/personal/spiritual/pages/StudyNotesPage';
import PrayerLibraryPage from './modules/personal/spiritual/pages/PrayerLibraryPage';
import PrayerEditor from './modules/personal/spiritual/pages/PrayerEditor';
import PrayersPage from './modules/personal/spiritual/pages/PrayersPage';
import HymnsPage from './modules/personal/spiritual/pages/HymnsPage';
import HymnEditor from './modules/personal/spiritual/pages/HymnEditor';
import BooksPage from './modules/personal/spiritual/pages/BooksPage';
import BookEditor from './modules/personal/spiritual/pages/BookEditor';

// ════════════════════════════════════════════════════
// 🔵 MÓDULOS: VIDA PROFISSIONAL
// ════════════════════════════════════════════════════

// Hub Profissional
import HubProfessional from './modules/professional/hub/HubProfessional';

// Container: Projetos
import AgencyDashboard from './modules/professional/projects/AgencyDashboard';
import VideoManagerPage from './modules/professional/projects/VideoManagerPage';
import VideoProjectEditor from './modules/professional/projects/VideoProjectEditor';

// Container: Clientes
import ClientsPage from './modules/professional/clients/ClientsPage';
import ClientEditorPage from './modules/professional/clients/ClientEditorPage';

// Container: Orçamentos
import QuotesPage from './modules/professional/quotes/QuotesPage';
import QuoteBuilderPage from './modules/professional/quotes/QuoteBuilderPage';
import ProposalTemplatePage from './modules/professional/quotes/ProposalTemplatePage';
import ProposalView from './modules/professional/quotes/ProposalView';

// Container: Serviços
import ServicesPage from './modules/professional/services/ServicesPage';

// ════════════════════════════════════════════════════

// Inicializando o React Query Client
const queryClient = new QueryClient();

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <HashRouter>
            <ScrollToTop />
            <Routes>
              {/* Páginas Públicas */}
              <Route path="/" element={<Login />} />
              
              <Route path="/fork" element={
                <ProtectedRoute>
                  <Fork />
                </ProtectedRoute>
              } />
              
              {/* ═══════════════════════════════════════ */}
              {/* CONTEXTO 1: VIDA PESSOAL */}
              {/* ═══════════════════════════════════════ */}
              <Route path="/personal/*" element={
                <ProtectedRoute>
                  <PersonalLayout>
                    <Routes>
                      <Route path="" element={<HubPersonal />} />
                      
                      {/* Módulo: Finanças */}
                      <Route path="finance" element={<FinanceDashboard />} />
                      <Route path="finance/analytics" element={<AnalyticsPage />} />
                      <Route path="finance/accounts" element={<AccountsPage />} />
                      <Route path="finance/cards" element={<CardsPage />} />
                      <Route path="finance/cards/:id" element={<CardDetailsPage />} />
                      <Route path="finance/cards/:id/invoices" element={<CardInvoicesPage />} />
                      <Route path="finance/bills" element={<BillsPage />} />
                      <Route path="finance/transactions" element={<TransactionsPage />} />
                      <Route path="finance/transactions/new" element={<NewTransactionPage />} />
                      <Route path="finance/new" element={<NewTransactionPage />} />
                      <Route path="finance/edit/:id" element={<NewTransactionPage />} />
                      <Route path="finance/limits" element={<AvailableLimitsPage />} />
                      
                      {/* Módulo: Estudos */}
                      <Route path="studies" element={<StudiesDashboard />} />
                      <Route path="studies/search" element={<SearchPage />} />
                      <Route path="studies/courses" element={<CourseList />} />
                      <Route path="studies/courses/:courseId" element={<CourseDetail />} />
                      <Route path="studies/lessons/:lessonId" element={<LessonDetail />} />
                      
                      {/* Módulo: Pets */}
                      <Route path="pet" element={<PetPage />} />

                      {/* Módulo: Sommelier (Adega) */}
                      <Route path="sommelier" element={<CellarPage />} />

                      {/* Módulo: Saúde & Planejamento */}
                      <Route path="health" element={<HealthHub />} />
                      <Route path="health/therapy" element={<TherapyPage />} />
                      <Route path="health/therapy/new" element={<TherapyEditor />} />
                      <Route path="health/therapy/:id" element={<TherapyEditor />} />
                      <Route path="health/wellness" element={<WellnessPage />} />
                      <Route path="health/wellness/new" element={<WellnessEditor />} />
                      <Route path="health/wellness/:id" element={<WellnessEditor />} />
                      <Route path="health/planning/new" element={<PlanningPage />} />
                      <Route path="health/workouts" element={<WorkoutsPage />} />
                      
                      {/* Módulo: Espiritual */}
                      <Route path="spiritual" element={<SpiritualHub />} />
                      <Route path="spiritual/reading" element={<BibleReadingPage />} />
                      
                      {/* Rotas de Pregações */}
                      <Route path="spiritual/sermons" element={<SermonsPage />} />
                      <Route path="spiritual/sermons/new" element={<SermonEditor />} />
                      <Route path="spiritual/sermons/:id" element={<SermonEditor />} />
                      
                      <Route path="spiritual/studies" element={<StudyNotesPage />} />
                      
                      {/* Rotas de Pedidos de Oração (Lista simples) */}
                      <Route path="spiritual/prayers-list" element={<PrayersPage />} />

                      {/* Rotas de Biblioteca de Orações (Modelos) */}
                      <Route path="spiritual/prayers" element={<PrayerLibraryPage />} />
                      <Route path="spiritual/prayers/new" element={<PrayerEditor />} />
                      <Route path="spiritual/prayers/:id" element={<PrayerEditor />} />

                      {/* Rotas de Hinos */}
                      <Route path="spiritual/hymns" element={<HymnsPage />} />
                      <Route path="spiritual/hymns/new" element={<HymnEditor />} />
                      <Route path="spiritual/hymns/:id" element={<HymnEditor />} />

                      {/* Rotas de Livros */}
                      <Route path="spiritual/books" element={<BooksPage />} />
                      <Route path="spiritual/books/new" element={<BookEditor />} />
                      <Route path="spiritual/books/:id" element={<BookEditor />} />
                    </Routes>
                  </PersonalLayout>
                </ProtectedRoute>
              } />

              {/* ═══════════════════════════════════════ */}
              {/* CONTEXTO 2: VIDA PROFISSIONAL */}
              {/* ═══════════════════════════════════════ */}
              <Route path="/professional/*" element={
                <ProtectedRoute>
                  <ProfessionalLayout>
                    <Routes>
                      <Route path="" element={<HubProfessional />} />
                      
                      {/* Módulo: Projetos */}
                      <Route path="projects" element={<AgencyDashboard />} />
                      <Route path="video-editor" element={<VideoManagerPage />} />
                      <Route path="video-editor/new" element={<VideoProjectEditor />} />
                      <Route path="video-editor/:id" element={<VideoProjectEditor />} />
                      
                      {/* Módulo: CRM (Clientes) */}
                      <Route path="crm" element={<ClientsPage />} />
                      <Route path="crm/new" element={<ClientEditorPage />} />
                      <Route path="crm/:id" element={<ClientEditorPage />} />

                      {/* Módulo: Orçamentos */}
                      <Route path="quotes" element={<QuotesPage />} />
                      <Route path="quotes/template" element={<ProposalTemplatePage />} />
                      <Route path="quotes/new" element={<QuoteBuilderPage />} />
                      <Route path="quotes/:id/view" element={<ProposalView />} />
                      <Route path="quotes/:id" element={<QuoteBuilderPage />} />

                      {/* Módulo: Serviços */}
                      <Route path="services" element={<ServicesPage />} />
                      
                      {/* Módulo: Financeiro PJ (Placeholder) */}
                      <Route path="finance" element={
                        <div className="p-10 text-zinc-400">
                          Financeiro PJ em construção...
                        </div>
                      } />
                    </Routes>
                  </ProfessionalLayout>
                </ProtectedRoute>
              } />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </HashRouter>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;