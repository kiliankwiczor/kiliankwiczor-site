import { useState } from 'react';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useApi, queryClient } from '../src/client';
import { Button, Card, Field, Loading, Notice, Page, Txt } from '../src/ui';
type Group = { id: string; name: string; description: string; joined_at: string | null };
type GroupPost = { id: string; body: string; nickname: string; created_at: string };
export default function Groups() {
  const api = useApi(),
    router = useRouter(),
    { id } = useLocalSearchParams<{ id?: string }>(),
    [body, setBody] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    groups = useQuery({ queryKey: ['groups'], queryFn: () => api.request<Group[]>('/groups') });
  const group = groups.data?.find((g) => g.id === id),
    posts = useInfiniteQuery({
      queryKey: ['group-posts', id],
      initialPageParam: '',
      enabled: !!group?.joined_at,
      queryFn: ({ pageParam }) =>
        api.request<GroupPost[]>(`/groups/${id}/posts${pageParam ? '?' + pageParam : ''}`),
      getNextPageParam: (last) =>
        last.length === 20
          ? `before=${encodeURIComponent(last.at(-1)!.created_at)}&beforeId=${last.at(-1)!.id}`
          : undefined,
    });
  async function membership() {
    if (!group) return;
    setBusy(true);
    setError('');
    try {
      await api.request(
        `/groups/${group.id}/join`,
        group.joined_at ? undefined : {},
        group.joined_at ? 'DELETE' : 'POST',
      );
      queryClient.removeQueries({ queryKey: ['group-posts', id] });
      queryClient.removeQueries({ queryKey: ['post'] });
      await queryClient.invalidateQueries({ queryKey: ['groups'] });
      await queryClient.invalidateQueries({ queryKey: ['saved'] });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function publish() {
    setBusy(true);
    setError('');
    try {
      await api.request(`/groups/${id}/posts`, { body });
      setBody('');
      await queryClient.invalidateQueries({ queryKey: ['group-posts', id] });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (!api.token) return <Redirect href="/" />;
  if (groups.isPending) return <Loading />;
  return (
    <Page>
      <Button
        secondary
        label={id ? '← Tous les groupes' : '← Communauté'}
        onPress={() => router.replace(id ? '/groups' : '/community')}
      />
      <Txt kind="hero">{group?.name ?? 'Trouver son cercle.'}</Txt>
      <Notice error text={error || groups.error?.message || posts.error?.message} />
      {id ? (
        group ? (
          <>
            <Txt>{group.description}</Txt>
            <Notice text="Groupe ouvert aux comptes du pilote. Les conversations sont réservées aux membres, mais tout compte peut rejoindre le groupe. Ne publie pas de données sensibles." />
            <Button
              secondary={!!group.joined_at}
              busy={busy}
              label={group.joined_at ? 'Quitter le groupe' : 'Rejoindre le groupe'}
              onPress={membership}
            />
            {group.joined_at && (
              <>
                <Card>
                  <Field
                    label="Ta publication dans le groupe"
                    value={body}
                    onChangeText={setBody}
                    multiline
                    maxLength={1500}
                  />
                  <Button
                    disabled={!body.trim()}
                    busy={busy}
                    label="Publier dans ce groupe"
                    onPress={publish}
                  />
                </Card>
                {posts.isPending && <Txt>Chargement des conversations…</Txt>}
                {posts.data?.pages.flat().length === 0 && (
                  <Txt>
                    Le groupe n’a pas encore de publication. Les questions ont leur place ici.
                  </Txt>
                )}
                {posts.data?.pages.flat().map((p) => (
                  <Card key={p.id}>
                    <Txt kind="label">{p.nickname}</Txt>
                    <Txt>{p.body}</Txt>
                    <Button
                      secondary
                      label="Ouvrir cette conversation de groupe"
                      onPress={() => router.push(`/post?id=${p.id}`)}
                    />
                  </Card>
                ))}
                {posts.hasNextPage && (
                  <Button
                    secondary
                    busy={posts.isFetchingNextPage}
                    label="Conversations précédentes"
                    onPress={() => posts.fetchNextPage()}
                  />
                )}
              </>
            )}
          </>
        ) : (
          <Notice error text="Groupe introuvable." />
        )
      ) : (
        <>
          {groups.data?.length === 0 && <Txt>Aucun groupe disponible.</Txt>}
          {groups.data?.map((g) => (
            <Card key={g.id}>
              <Txt kind="title">{g.name}</Txt>
              <Txt>{g.description}</Txt>
              <Txt kind="small">{g.joined_at ? 'TU ES MEMBRE' : 'GROUPE OUVERT'}</Txt>
              <Button
                secondary
                label={`Voir ${g.name}`}
                onPress={() => router.push(`/groups?id=${g.id}`)}
              />
            </Card>
          ))}
        </>
      )}
    </Page>
  );
}
