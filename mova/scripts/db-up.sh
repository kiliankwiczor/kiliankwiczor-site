#!/usr/bin/env bash
set -euo pipefail
image='postgres:17-alpine@sha256:266d3c257594e195b309ae9d1805e54c788f1d7b375f56bf6c367aac6c917e7b'
local_docker() { env -u DOCKER_HOST -u DOCKER_CONTEXT -u DOCKER_TLS -u DOCKER_TLS_VERIFY -u DOCKER_CERT_PATH docker --host=unix:///var/run/docker.sock "$@"; }
local_docker info >/dev/null
if local_docker container inspect mova-db >/dev/null 2>&1; then
  actual_image="$(local_docker inspect --format '{{.Config.Image}}' mova-db)"
  [ "$actual_image" = "$image" ] || { echo 'Le nom mova-db est déjà utilisé par une autre image. Aucune suppression effectuée.' >&2; exit 1; }
  local_docker start mova-db >/dev/null
else
  local_docker run -d --name mova-db -e POSTGRES_USER=mova -e POSTGRES_PASSWORD=mova_local_only -e POSTGRES_DB=mova -p 127.0.0.1:5433:5432 -v mova-pgdata:/var/lib/postgresql/data "$image" >/dev/null
fi
for attempt in {1..30}; do
  if local_docker exec mova-db pg_isready -U mova -d mova >/dev/null; then echo 'PostgreSQL local prêt sur 127.0.0.1:5433'; exit 0; fi
  sleep 1
done
echo 'PostgreSQL non prêt ; inspecter les logs de mova-db.' >&2
exit 1
