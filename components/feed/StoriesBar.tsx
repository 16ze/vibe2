import React from 'react';
import StoryCircle from '@/components/feed/StoryCircle';

interface StoriesBarProps {
  stories: any[];
  onStoryClick?: (stories: any[] | null, isOwn?: boolean) => void;
  currentUserStory?: any;
}

export default function StoriesBar({ stories, onStoryClick, currentUserStory }: StoriesBarProps) {
  // Group stories by author
  const storyGroups = stories.reduce((acc, story) => {
    const author = story.created_by || 'unknown';
    if (!acc[author]) {
      acc[author] = {
        author_name: story.author_name,
        author_avatar: story.author_avatar,
        stories: []
      };
    }
    acc[author].stories.push(story);
    return acc;
  }, {});

  const groupedStories = Object.entries(storyGroups).map(([author, data]: [string, any]) => ({
    author,
    ...(data || {}),
    latestStory: data?.stories?.[0]
  }));

  return (
    <div className="bg-white border-b border-gray-100">
      <div className="flex gap-3 px-4 py-4 overflow-x-auto scrollbar-hide">
        {/* Own story placeholder */}
        <StoryCircle
          story={{
            author_name: 'Toi',
            author_avatar: currentUserStory?.author_avatar
          }}
          isOwn={true}
          hasUnviewed={false}
          onClick={() => onStoryClick?.(null, true)}
        />
        
        {/* Other stories */}
        {groupedStories.map((group, index) => (
          <StoryCircle
            key={group.author}
            story={{
              author_name: group.author_name,
              author_avatar: group.author_avatar
            }}
            hasUnviewed={true}
            onClick={() => onStoryClick?.(group.stories)}
          />
        ))}
      </div>
    </div>
  );
}