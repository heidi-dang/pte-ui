import { useEffect, useState, useCallback } from 'react';
import { Bookmark } from 'lucide-react';
import { StudentPageContainer } from '../StudentPageContainer';
import { EmptyState } from '../../ui/EmptyState';

export function BookmarksPage() {
  return (
    <StudentPageContainer maxWidth="md">
      <EmptyState
        icon={<Bookmark className="h-6 w-6 text-gray-500" />}
        title="Bookmarks"
        description="Bookmarks are not available yet. This feature will be added in a future update."
      />
    </StudentPageContainer>
  );
}
