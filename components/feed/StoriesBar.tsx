import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import StoryCircle from '@/components/feed/StoryCircle';

interface StoriesBarProps {
  stories: any[];
  onStoryClick?: (stories: any[] | null, isOwn?: boolean) => void;
  currentUserStory?: any;
}

export default function StoriesBar({ stories, onStoryClick, currentUserStory }: StoriesBarProps) {
  const { user } = useAuth();
  const router = useRouter();

  // CORRECTION : Récupération de l'utilisateur connecté
  const currentUserId = user?.id;
  const currentUserEmail = user?.email;

  // CORRECTION : Filtrage des stories - sépare ma story des autres
  const myStory = stories.find((s) => {
    // Vérifie selon plusieurs champs possibles (user_id, created_by, author_id, email)
    return (
      (currentUserId && (s.user_id === currentUserId || s.author_id === currentUserId)) ||
      (currentUserEmail && (s.created_by === currentUserEmail || s.author_name === currentUserEmail)) ||
      (currentUserStory && s.id === currentUserStory.id)
    );
  });

  const otherStories = stories.filter((s) => {
    // Exclut ma story de la liste des autres
    return !(
      (currentUserId && (s.user_id === currentUserId || s.author_id === currentUserId)) ||
      (currentUserEmail && (s.created_by === currentUserEmail || s.author_name === currentUserEmail)) ||
      (currentUserStory && s.id === currentUserStory.id)
    );
  });

  // Group other stories by author
  const storyGroups = otherStories.reduce((acc, story) => {
    const author = story.created_by || story.user_id || 'unknown';
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
        {/* CORRECTION : Rendu conditionnel du premier cercle */}
        {myStory ? (
          // CAS A : J'ai une story - Affiche mon avatar avec bordure colorée
          <StoryCircle
            story={{
              author_name: 'Ta story', // Force "Ta story" même si isOwn=false
              author_avatar: user?.avatar_url || myStory.author_avatar
            }}
            isOwn={false} // Pas isOwn pour ne pas afficher le + bleu
            hasUnviewed={true} // Bordure colorée (gradient Vibe)
            onClick={() => {
              // Ouvre le viewer de story avec ma story
              const myStoryGroup = {
                author_name: user?.full_name || user?.username || 'Toi',
                author_avatar: user?.avatar_url || myStory.author_avatar,
                stories: [myStory]
              };
              onStoryClick?.(myStoryGroup.stories, true);
            }}
          />
        ) : (
          // CAS B : Pas de story - Affiche le bouton avec le + bleu
          <StoryCircle
            story={{
              author_name: 'Ta story', // Sera remplacé par "Ta story" grâce à isOwn=true
              author_avatar: user?.avatar_url
            }}
            isOwn={true} // Affiche le + bleu et le texte "Ta story"
            hasUnviewed={false} // Bordure grise
            onClick={() => {
              // Redirige vers /camera
              router.push('/camera');
            }}
          />
        )}
        
        {/* CORRECTION : Rendu de la liste - uniquement les autres stories */}
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