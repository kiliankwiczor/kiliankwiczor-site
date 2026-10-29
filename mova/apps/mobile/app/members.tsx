import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useApi } from '../src/client';
import { Button, Card, Field, Notice, Page, Txt } from '../src/ui';
type Member = {
  user_id: string;
  nickname: string;
  bio: string;
  posts?: { id: string; body: string }[];
};
export default function Members() {
  const api = useApi(),
    router = useRouter(),
    { id } = useLocalSearchParams<{ id?: string }>(),
    [search, setSearch] = useState(''),
    [submitted, setSubmitted] = useState('');
  const q = useQuery({
      queryKey: ['members', submitted],
      queryFn: () => api.request<Member[]>(`/members?search=${encodeURIComponent(submitted)}`),
      enabled: submitted.length >= 2,
    }),
    profile = useQuery({
      queryKey: ['member', id],
      queryFn: () => api.request<Member>(`/members/${id}`),
      enabled: !!id,
    });
  if (!api.token) return <Redirect href="/" />;
  return (
    <Page>
      <Button secondary label="← Communauté" onPress={() => router.replace('/community')} />
      <Txt kind="hero">Trouver ses alliées.</Txt>
      {id ? (
        <>
          <Notice error text={profile.error?.message} />
          {profile.isPending && <Txt>Chargement du profil…</Txt>}
          {profile.data && (
            <>
              <Card>
                <Txt kind="title">{profile.data.nickname}</Txt>
                <Txt>
                  {profile.data.bio || 'Cette membre n’a pas encore ajouté de présentation.'}
                </Txt>
              </Card>
              {profile.data.posts?.length === 0 && <Txt>Aucune publication visible.</Txt>}
              {profile.data.posts?.map((p) => (
                <Card key={p.id}>
                  <Txt>{p.body}</Txt>
                  <Button
                    secondary
                    label="Ouvrir la conversation"
                    onPress={() => router.push(`/post?id=${p.id}`)}
                  />
                </Card>
              ))}
            </>
          )}
        </>
      ) : (
        <>
          <Field
            label="Rechercher un pseudonyme · 2 caractères minimum"
            value={search}
            onChangeText={setSearch}
            maxLength={40}
          />
          <Button
            disabled={search.trim().length < 2}
            label="Rechercher des membres"
            onPress={() => setSubmitted(search.trim())}
          />
          <Notice error text={q.error?.message} />
          {q.isFetching && <Txt>Recherche…</Txt>}
          {q.data?.length === 0 && (
            <Txt>Aucune membre visible ne correspond à cette recherche.</Txt>
          )}
          {q.data?.map((m) => (
            <Card key={m.user_id}>
              <Txt kind="title">{m.nickname}</Txt>
              <Txt>{m.bio}</Txt>
              <Button
                secondary
                label={`Voir le profil de ${m.nickname}`}
                onPress={() => router.push(`/members?id=${m.user_id}`)}
              />
            </Card>
          ))}
        </>
      )}
    </Page>
  );
}
