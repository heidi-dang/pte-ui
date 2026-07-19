import { HelpCircle, Mail, MessageCircle, FileText } from 'lucide-react';
import { StudentPageContainer } from '../StudentPageContainer';

export function SupportPage() {
  return (
    <StudentPageContainer title="Help & Support" maxWidth="md">
      <div className="space-y-4">
        <div className="rounded-xl border border-dark-border bg-dark-surface p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-lg bg-primary-500/10 flex items-center justify-center">
              <HelpCircle className="h-5 w-5 text-primary-400" />
            </div>
            <h2 className="text-sm font-semibold text-gray-100">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-gray-200 font-medium">How do I start a practice session?</p>
              <p className="text-gray-500 text-xs mt-1">Go to Practice, select a task type, and choose your questions. Click Start to begin.</p>
            </div>
            <div>
              <p className="text-gray-200 font-medium">How are scores calculated?</p>
              <p className="text-gray-500 text-xs mt-1">Multiple-choice questions are scored automatically. Speaking and writing tasks use AI-powered evaluation.</p>
            </div>
            <div>
              <p className="text-gray-200 font-medium">Can I retake mock exams?</p>
              <p className="text-gray-500 text-xs mt-1">Yes, you can take unlimited mock exams. Each attempt is tracked separately in your history.</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-dark-border bg-dark-surface p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-lg bg-info-500/10 flex items-center justify-center">
              <MessageCircle className="h-5 w-5 text-info-400" />
            </div>
            <h2 className="text-sm font-semibold text-gray-100">Contact Us</h2>
          </div>
          <div className="space-y-3">
            <a
              href="mailto:support@pteacademicmaster.com"
              className="flex items-center gap-3 p-3 rounded-xl bg-dark-elevated hover:bg-dark-surface-100 transition-colors"
            >
              <Mail className="h-4 w-4 text-gray-500 shrink-0" />
              <span className="text-sm text-gray-300">support@pteacademicmaster.com</span>
            </a>
            <a
              href="#"
              className="flex items-center gap-3 p-3 rounded-xl bg-dark-elevated hover:bg-dark-surface-100 transition-colors"
            >
              <FileText className="h-4 w-4 text-gray-500 shrink-0" />
              <span className="text-sm text-gray-300">Documentation & Guides</span>
            </a>
          </div>
        </div>
      </div>
    </StudentPageContainer>
  );
}
