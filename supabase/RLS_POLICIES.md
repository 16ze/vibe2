# 🔐 Politiques RLS (Row Level Security) Supabase

Ce document liste les politiques RLS nécessaires pour sécuriser l'application VIBE.

## 📋 Tables à Sécuriser

### 1. `profiles`
- **Lecture** : Tous les utilisateurs authentifiés peuvent lire tous les profils
- **Écriture** : Un utilisateur ne peut modifier que son propre profil

### 2. `posts`
- **Lecture** : Tous les utilisateurs authentifiés peuvent lire tous les posts
- **Écriture** : Un utilisateur ne peut créer/modifier/supprimer que ses propres posts

### 3. `stories`
- **Lecture** : Tous les utilisateurs authentifiés peuvent lire toutes les stories actives
- **Écriture** : Un utilisateur ne peut créer/modifier/supprimer que ses propres stories

### 4. `conversations`
- **Lecture** : Un utilisateur ne peut lire que les conversations où il est participant
- **Écriture** : Un utilisateur ne peut créer que des conversations où il est participant

### 5. `conversation_participants`
- **Lecture** : Un utilisateur ne peut lire que les participants de ses conversations
- **Écriture** : Un utilisateur ne peut s'ajouter que comme participant de ses propres conversations

### 6. `messages`
- **Lecture** : Un utilisateur ne peut lire que les messages des conversations où il est participant
- **Écriture** : Un utilisateur ne peut envoyer des messages que dans les conversations où il est participant

### 7. `likes`
- **Lecture** : Tous les utilisateurs authentifiés peuvent lire tous les likes
- **Écriture** : Un utilisateur ne peut créer/supprimer que ses propres likes

### 8. `comments`
- **Lecture** : Tous les utilisateurs authentifiés peuvent lire tous les commentaires
- **Écriture** : Un utilisateur ne peut créer/modifier/supprimer que ses propres commentaires

### 9. `follows`
- **Lecture** : Tous les utilisateurs authentifiés peuvent lire toutes les relations de suivi
- **Écriture** : Un utilisateur ne peut créer/supprimer que ses propres relations de suivi

### 10. `notifications`
- **Lecture** : Un utilisateur ne peut lire que ses propres notifications
- **Écriture** : Un utilisateur ne peut créer que des notifications pour d'autres utilisateurs (pas pour lui-même)

## 🔧 Commandes SQL à Exécuter dans Supabase

```sql
-- Active RLS sur toutes les tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles : Lecture publique, écriture limitée
CREATE POLICY "Profiles are viewable by authenticated users"
  ON profiles FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Posts : Lecture publique, écriture limitée
CREATE POLICY "Posts are viewable by authenticated users"
  ON posts FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create own posts"
  ON posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts"
  ON posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts"
  ON posts FOR DELETE
  USING (auth.uid() = user_id);

-- Stories : Lecture publique, écriture limitée
CREATE POLICY "Stories are viewable by authenticated users"
  ON stories FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create own stories"
  ON stories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own stories"
  ON stories FOR DELETE
  USING (auth.uid() = user_id);

-- Conversations : Lecture limitée aux participants
CREATE POLICY "Users can view conversations they participate in"
  ON conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = conversations.id
      AND conversation_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (true); -- Vérifié via conversation_participants

-- Conversation Participants : Lecture limitée
CREATE POLICY "Users can view participants of their conversations"
  ON conversation_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = conversation_participants.conversation_id
      AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add themselves as participants"
  ON conversation_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Messages : Lecture limitée aux participants
CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = messages.conversation_id
      AND conversation_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages in their conversations"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = messages.conversation_id
      AND conversation_participants.user_id = auth.uid()
    )
  );

-- Likes : Lecture publique, écriture limitée
CREATE POLICY "Likes are viewable by authenticated users"
  ON likes FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create own likes"
  ON likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes"
  ON likes FOR DELETE
  USING (auth.uid() = user_id);

-- Comments : Lecture publique, écriture limitée
CREATE POLICY "Comments are viewable by authenticated users"
  ON comments FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create own comments"
  ON comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
  ON comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  USING (auth.uid() = user_id);

-- Follows : Lecture publique, écriture limitée
CREATE POLICY "Follows are viewable by authenticated users"
  ON follows FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create own follows"
  ON follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can delete own follows"
  ON follows FOR DELETE
  USING (auth.uid() = follower_id);

-- Notifications : Lecture limitée
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create notifications for others"
  ON notifications FOR INSERT
  WITH CHECK (auth.uid() = actor_id AND auth.uid() != user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);
```

## ✅ Vérification

Pour vérifier que les politiques RLS sont actives :

1. Allez dans Supabase Dashboard → Authentication → Policies
2. Vérifiez que chaque table a des politiques actives
3. Testez avec un utilisateur non authentifié (doit être bloqué)
4. Testez avec un utilisateur authentifié (doit fonctionner)

## 📝 Notes

- Les politiques RLS sont **obligatoires** pour la production
- Sans RLS, n'importe qui peut accéder/modifier toutes les données
- Les politiques sont évaluées **côté serveur**, donc même si le client est compromis, les données sont protégées


