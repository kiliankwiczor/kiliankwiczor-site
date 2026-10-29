import { useState } from 'react';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useApi, queryClient, type Post, type Me } from '../../src/client';
import { Button, Card, Field, Notice, Page, Row, Txt } from '../../src/ui';
export default function Community() {
  const { request } = useApi(),
    router = useRouter(),
    [body, setBody] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [scope, setScope] = useState('community');
  const me = useQuery({ queryKey: ['me'], queryFn: () => request<Me>('/me') }),
    q = useInfiniteQuery({
      queryKey: ['feed', scope],
      initialPageParam: '',
      queryFn: ({ pageParam }) =>
        request<Post[]>(
          `/feed?scope=${scope}${pageParam ? `&before=${encodeURIComponent(pageParam.split('|')[0]!)}&beforeId=${pageParam.split('|')[1]}` : ''}`,
        ),
      getNextPageParam: (last) =>
        last.length === 20 ? `${last.at(-1)!.created_at}|${last.at(-1)!.id}` : undefined,
    });
  async function publish() {
    setBusy(true);
    setError('');
    try {
      await request('/posts', { body });
      setBody('');
      await queryClient.invalidateQueries({ queryKey: ['feed'] });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page>
      <Txt kind="label">LA FORCE DU COLLECTIF</Txt>
      <Txt kind="hero">On avance ensemble.</Txt>
      <Button secondary label="Explorer les groupes" onPress={() => router.push('/groups')} />
      <Button secondary label="Rechercher des membres" onPress={() => router.push('/members')} />
      <Txt>
        Une petite victoire, une question, un encouragement. Tu n’as pas besoin d’une photo pour
        avoir ta place.
      </Txt>
      <Notice text="Espace pilote : publications visibles par les autres comptes de test. Photos, vidéos et messages privés désactivés." />
      <Card>
        <Field
          label="Ta publication"
          placeholder="Aujourd’hui, je suis fière de…"
          value={body}
          onChangeText={setBody}
          multiline
          maxLength={1500}
        />
        <Button
          busy={busy}
          disabled={!body.trim()}
          label="Publier dans la communauté"
          onPress={publish}
        />
      </Card>
      <Notice text={error ?? q.error?.message} error />
      <Row>
        <Button
          label="Communauté"
          secondary={scope !== 'community'}
          onPress={() => setScope('community')}
        />
        <Button
          label="Abonnements"
          secondary={scope !== 'following'}
          onPress={() => setScope('following')}
        />
      </Row>
      {q.isPending && <Txt>Chargement du fil…</Txt>}
      {q.error && <Notice error text={q.error.message} />}
      <Button secondary label="Actualiser le fil" onPress={() => q.refetch()} />
      {q.data?.pages.flat().length === 0 && (
        <Card>
          <Txt kind="title">Tout commence ici.</Txt>
          <Txt>
            Aucune publication. Les membres que tu suis apparaîtront dans le fil Abonnements.
          </Txt>
        </Card>
      )}
      {q.data?.pages.flat().map((post) => (
        <Card key={post.id}>
          <Row>
            <Txt kind="label">{post.nickname}</Txt>
            <Txt kind="small">{new Date(post.created_at).toLocaleDateString('fr-FR')}</Txt>
          </Row>
          <Txt>{post.body}</Txt>
          <Row>
            <Button
              secondary
              label={`${post.liked ? '♥' : '♡'} ${post.likes}`}
              onPress={async () => {
                try {
                  await request(`/posts/${post.id}/like`, { liked: !post.liked }, 'PUT');
                  await queryClient.invalidateQueries({ queryKey: ['feed'] });
                } catch (e) {
                  setError((e as Error).message);
                }
              }}
            />
            <Button
              secondary
              label="Commentaires et options"
              onPress={() => router.push(`/post?id=${post.id}`)}
            />
          </Row>
          {post.user_id !== me.data?.id && (
            <Button
              secondary
              label={post.following ? 'Ne plus suivre' : 'Suivre cette membre'}
              onPress={async () => {
                try {
                  await request(
                    `/members/${post.user_id}/follow`,
                    { following: !post.following },
                    'PUT',
                  );
                  await queryClient.invalidateQueries({ queryKey: ['feed'] });
                } catch (e) {
                  setError((e as Error).message);
                }
              }}
            />
          )}
        </Card>
      ))}
      {q.hasNextPage && (
        <Button
          secondary
          busy={q.isFetchingNextPage}
          label="Voir les publications précédentes"
          onPress={() => q.fetchNextPage()}
        />
      )}
    </Page>
  );
}
