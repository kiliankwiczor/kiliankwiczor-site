import { useState } from 'react';
import { useLocalSearchParams, useRouter, Redirect } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useApi, queryClient, type Post, type Me } from '../src/client';
import { Button, Card, Field, Notice, Page, Txt } from '../src/ui';
export default function PostDetail() {
  const { id } = useLocalSearchParams<{ id: string }>(),
    api = useApi(),
    router = useRouter(),
    [body, setBody] = useState(''),
    [reason, setReason] = useState(''),
    [error, setError] = useState(''),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false);
  const me = useQuery({ queryKey: ['me'], queryFn: () => api.request<Me>('/me') }),
    detail = useQuery({ queryKey: ['post', id], queryFn: () => api.request<Post>(`/posts/${id}`) }),
    comments = useQuery({
      queryKey: ['comments', id],
      queryFn: () =>
        api.request<{ id: string; body: string; nickname: string }[]>(`/posts/${id}/comments`),
    });
  if (!api.token) return <Redirect href="/" />;
  const post = detail.data;
  async function action(fn: () => Promise<unknown>, message: string) {
    setBusy(true);
    setError('');
    try {
      await fn();
      setMessage(message);
      await queryClient.invalidateQueries({ queryKey: ['comments', id] });
      await queryClient.invalidateQueries({ queryKey: ['feed'] });
      await queryClient.invalidateQueries({ queryKey: ['saved'] });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page>
      <Button
        secondary
        label={post?.group_id ? '← Groupe' : '← Communauté'}
        onPress={() =>
          router.replace(post?.group_id ? `/groups?id=${post.group_id}` : '/community')
        }
      />
      <Txt kind="title">La conversation</Txt>
      <Button
        secondary
        busy={busy}
        label="Sauvegarder cette publication"
        onPress={() =>
          action(
            () => api.request(`/posts/${id}/save`, { saved: true }, 'PUT'),
            'Publication sauvegardée.',
          )
        }
      />
      <Button
        secondary
        busy={busy}
        label="Retirer de mes sauvegardes"
        onPress={() =>
          action(
            () => api.request(`/posts/${id}/save`, { saved: false }, 'PUT'),
            'Publication retirée des sauvegardes.',
          )
        }
      />
      {post && (
        <Card>
          <Txt kind="label">{post.nickname}</Txt>
          <Button
            secondary
            label="Voir le profil public"
            onPress={() => router.push(`/members?id=${post.user_id}`)}
          />
          <Txt>{post.body}</Txt>
        </Card>
      )}
      <Notice text={error || comments.error?.message} error />
      <Notice text={message} />
      {comments.data?.length === 0 && <Txt>Pas encore de commentaire.</Txt>}
      {comments.data?.map((c) => (
        <Card key={c.id}>
          <Txt kind="label">{c.nickname}</Txt>
          <Txt>{c.body}</Txt>
        </Card>
      ))}
      <Field
        label="Ton commentaire"
        value={body}
        onChangeText={setBody}
        maxLength={500}
        multiline
      />
      <Button
        busy={busy}
        disabled={!body.trim()}
        label="Envoyer le commentaire"
        onPress={() =>
          action(async () => {
            await api.request(`/posts/${id}/comments`, { body });
            setBody('');
          }, 'Commentaire publié.')
        }
      />
      <Card>
        <Txt kind="title">Prendre soin de cet espace</Txt>
        <Field
          label="Motif du signalement · 5 caractères minimum"
          value={reason}
          onChangeText={setReason}
          maxLength={500}
        />
        <Button
          busy={busy}
          secondary
          disabled={reason.trim().length < 5}
          label="Signaler la publication"
          onPress={() =>
            action(
              () => api.request('/reports', { postId: id, reason }),
              'Signalement enregistré pour examen.',
            )
          }
        />
        {post && post.user_id !== me.data?.id && (
          <Button
            busy={busy}
            secondary
            label="Confirmer le blocage de cette membre"
            onPress={() =>
              action(async () => {
                await api.request('/blocks', { userId: post.user_id });
                router.replace('/community');
              }, 'Membre bloquée.')
            }
          />
        )}
        <Txt kind="small">
          Le blocage masque les publications et commentaires entre les deux comptes. Les urgences
          nécessitent les services compétents ; ce pilote n’a pas de modération permanente.
        </Txt>
        {post?.user_id === me.data?.id && (
          <Button
            secondary
            label="Supprimer ma publication"
            onPress={() =>
              action(async () => {
                await api.request(`/posts/${id}`, undefined, 'DELETE');
                router.replace('/community');
              }, 'Publication supprimée.')
            }
          />
        )}
      </Card>
    </Page>
  );
}
