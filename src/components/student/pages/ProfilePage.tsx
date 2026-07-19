import { User, Mail, Target, Award } from 'lucide-react';
import { StudentPageContainer } from '../StudentPageContainer';
import { useGlobalContext } from '../../ThemeContext';

export function ProfilePage() {
  const { user } = useGlobalContext();

  return (
    <StudentPageContainer title="Profile" maxWidth="md">
      <div className="rounded-xl border border-dark-border bg-dark-surface overflow-hidden">
        <div className="p-6 border-b border-dark-border">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary-500/10 flex items-center justify-center">
              <span className="text-2xl font-bold text-primary-400">
                {(user?.name || 'S')[0].toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-100">{user?.name || 'Student'}</h2>
              <p className="text-sm text-gray-500">{user?.email || ''}</p>
            </div>
          </div>
        </div>

        <div className="divide-y divide-dark-border">
          <div className="flex items-center gap-3 p-4">
            <User className="h-4 w-4 text-gray-500 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-500">Name</p>
              <p className="text-sm text-gray-200 truncate">{user?.name || 'Not set'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4">
            <Mail className="h-4 w-4 text-gray-500 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-500">Email</p>
              <p className="text-sm text-gray-200 truncate">{user?.email || 'Not set'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4">
            <Target className="h-4 w-4 text-gray-500 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-500">Target Score</p>
              <p className="text-sm text-gray-200">{user?.targetScore != null ? `${user.targetScore}/90` : 'Not set'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4">
            <Award className="h-4 w-4 text-gray-500 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-500">Current Average</p>
              <p className="text-sm text-gray-200">{user?.currentAvg != null ? `${user.currentAvg}%` : 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>
    </StudentPageContainer>
  );
}
