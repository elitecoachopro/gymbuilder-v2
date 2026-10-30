#!/bin/sh
set -eu
TASK_REPO_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
TASK_DB_CONTAINER="gymbuilder-mobile-billing-check-$$"
docker run --rm -d --name "$TASK_DB_CONTAINER" --network none --memory 512m -e POSTGRES_PASSWORD=gymbuilder_disposable_fixture public.ecr.aws/supabase/postgres:17.11.0.004 >/dev/null
trap 'docker rm -f "$TASK_DB_CONTAINER" >/dev/null 2>&1 || true' EXIT HUP INT TERM
TASK_READY=0
for TASK_TRY in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15; do
 if docker exec "$TASK_DB_CONTAINER" pg_isready -h 127.0.0.1 -U postgres >/dev/null 2>&1; then TASK_READY=1; break; fi
 sleep 1
done
[ "$TASK_READY" = 1 ] || exit 1
# template0 avoids vendor-specific GraphQL event triggers in the image's default DB.
docker exec "$TASK_DB_CONTAINER" createdb -U postgres -T template0 gymbuilder_mobile_check
docker exec -i "$TASK_DB_CONTAINER" psql -U postgres -d gymbuilder_mobile_check -v ON_ERROR_STOP=1 < "$TASK_REPO_DIR/tests/mobile/billing-fixture.sql"
docker exec -i "$TASK_DB_CONTAINER" psql -U postgres -d gymbuilder_mobile_check -v ON_ERROR_STOP=1 < "$TASK_REPO_DIR/supabase/migrations/20261029000100_mobile_billing_sandbox.sql"
docker exec -i "$TASK_DB_CONTAINER" psql -U postgres -d gymbuilder_mobile_check -v ON_ERROR_STOP=1 < "$TASK_REPO_DIR/tests/mobile/billing-database.sql"
