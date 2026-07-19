import { useStudentRoute } from './StudentRouteContext';
import {
  DashboardPage,
  PracticePage,
  QuestionBrowserPage,
  CustomPracticeBuilderPage,
  PracticeSessionPage,
  MockExamsPage,
  StudyPlanPage,
  AnalyticsPage,
  ReviewPage,
  AssignmentsPage,
  BookmarksPage,
  AchievementsPage,
  SubscriptionPage,
  ProfilePage,
  SettingsPage,
  SupportPage,
} from './pages';

export function StudentPageRouter() {
  const { currentRouteId } = useStudentRoute();

  switch (currentRouteId) {
    case 'dashboard':
      return <DashboardPage />;
    case 'practice':
    case 'practice-task':
      return <PracticePage />;
    case 'practice-questions':
      return <QuestionBrowserPage />;
    case 'practice-session':
      return <PracticeSessionPage />;
    case 'mock-exams':
    case 'mock-exam-session':
      return <MockExamsPage />;
    case 'study-plan':
      return <StudyPlanPage />;
    case 'analytics':
    case 'analytics-task':
      return <AnalyticsPage />;
    case 'review':
    case 'review-detail':
    case 'results':
      return <ReviewPage />;
    case 'assignments':
    case 'assignment-detail':
      return <AssignmentsPage />;
    case 'bookmarks':
      return <BookmarksPage />;
    case 'achievements':
      return <AchievementsPage />;
    case 'subscription':
      return <SubscriptionPage />;
    case 'profile':
      return <ProfilePage />;
    case 'settings':
      return <SettingsPage />;
    case 'support':
      return <SupportPage />;
    default:
      return <DashboardPage />;
  }
}
