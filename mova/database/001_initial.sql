CREATE ROLE mova_app NOLOGIN;
CREATE TABLE users (
 id uuid PRIMARY KEY, email text UNIQUE NOT NULL, password_hash text NOT NULL,
 role text NOT NULL DEFAULT 'member' CHECK(role IN ('member','admin')),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE auth_sessions (token_hash text PRIMARY KEY, user_id uuid NOT NULL REFERENCES users ON DELETE CASCADE, expires_at timestamptz NOT NULL);
CREATE TABLE password_resets (token_hash text PRIMARY KEY, user_id uuid NOT NULL REFERENCES users ON DELETE CASCADE, expires_at timestamptz NOT NULL);
CREATE TABLE profiles (user_id uuid PRIMARY KEY REFERENCES users ON DELETE CASCADE, nickname text NOT NULL CHECK(length(nickname) BETWEEN 2 AND 40), bio text NOT NULL DEFAULT '' CHECK(length(bio)<=300));
CREATE TABLE preferences (user_id uuid PRIMARY KEY REFERENCES users ON DELETE CASCADE, data jsonb NOT NULL);
CREATE TABLE catalog (id text PRIMARY KEY, kind text NOT NULL CHECK(kind IN ('exercise','program')), data jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE workouts (
 id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES users ON DELETE CASCADE,
 program_id text NOT NULL, snapshot jsonb NOT NULL, started_at timestamptz NOT NULL DEFAULT now(),
 completed_at timestamptz, sets jsonb NOT NULL DEFAULT '[]',
 CHECK(jsonb_typeof(sets)='array')
);
CREATE UNIQUE INDEX one_active_workout ON workouts(user_id) WHERE completed_at IS NULL;
CREATE TABLE points_ledger (
 id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES users ON DELETE CASCADE,
 workout_id uuid UNIQUE REFERENCES workouts ON DELETE CASCADE, amount integer NOT NULL CHECK(amount BETWEEN 0 AND 50), reason text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE entitlements (
 id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES users ON DELETE CASCADE,
 kind text NOT NULL CHECK(kind IN ('plus','premium','purchase')), program_id text, expires_at timestamptz,
 source_event text UNIQUE NOT NULL, CHECK((kind='purchase' AND program_id IS NOT NULL AND expires_at IS NULL) OR (kind IN ('plus','premium') AND expires_at IS NOT NULL))
);
CREATE TABLE posts (id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES users ON DELETE CASCADE, body text NOT NULL CHECK(length(body) BETWEEN 1 AND 1500), hidden boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE comments (id uuid PRIMARY KEY, post_id uuid NOT NULL REFERENCES posts ON DELETE CASCADE, user_id uuid NOT NULL REFERENCES users ON DELETE CASCADE, body text NOT NULL CHECK(length(body) BETWEEN 1 AND 500), created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE likes (post_id uuid REFERENCES posts ON DELETE CASCADE, user_id uuid REFERENCES users ON DELETE CASCADE, PRIMARY KEY(post_id,user_id));
CREATE TABLE follows (follower_id uuid REFERENCES users ON DELETE CASCADE, followed_id uuid REFERENCES users ON DELETE CASCADE, PRIMARY KEY(follower_id,followed_id), CHECK(follower_id<>followed_id));
CREATE TABLE blocks (blocker_id uuid REFERENCES users ON DELETE CASCADE, blocked_id uuid REFERENCES users ON DELETE CASCADE, PRIMARY KEY(blocker_id,blocked_id), CHECK(blocker_id<>blocked_id));
CREATE TABLE reports (id uuid PRIMARY KEY, reporter_id uuid REFERENCES users ON DELETE SET NULL, post_id uuid REFERENCES posts ON DELETE SET NULL, reason text NOT NULL CHECK(length(reason) BETWEEN 5 AND 500), state text NOT NULL DEFAULT 'open' CHECK(state IN ('open','resolved')), created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE audit_log (id uuid PRIMARY KEY, actor_id uuid REFERENCES users ON DELETE SET NULL, action text NOT NULL, target text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX feed_cursor ON posts(created_at DESC,id DESC) WHERE NOT hidden;
CREATE INDEX workouts_owner ON workouts(user_id,started_at DESC);
CREATE INDEX ledger_owner ON points_ledger(user_id,created_at);
CREATE INDEX comment_post ON comments(post_id,created_at);
CREATE INDEX blocks_reverse ON blocks(blocked_id,blocker_id);
CREATE FUNCTION actor() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('mova.user_id',true),'')::uuid $$;
CREATE FUNCTION mutually_visible(other_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$ SELECT NOT EXISTS(SELECT 1 FROM blocks WHERE (blocker_id=actor() AND blocked_id=other_id) OR (blocked_id=actor() AND blocker_id=other_id)) $$;
REVOKE ALL ON FUNCTION mutually_visible(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION mutually_visible(uuid) TO mova_app;
GRANT USAGE ON SCHEMA public TO mova_app;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY profiles_read ON profiles FOR SELECT TO mova_app USING(mutually_visible(user_id));
CREATE POLICY profiles_update ON profiles FOR UPDATE TO mova_app USING(user_id=actor()) WITH CHECK(user_id=actor());
GRANT SELECT,UPDATE(nickname,bio) ON profiles TO mova_app;
ALTER TABLE preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_preferences ON preferences TO mova_app USING(user_id=actor()) WITH CHECK(user_id=actor());
GRANT SELECT,INSERT,UPDATE ON preferences TO mova_app;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_workouts ON workouts TO mova_app USING(user_id=actor()) WITH CHECK(user_id=actor());
GRANT SELECT,INSERT,UPDATE(sets) ON workouts TO mova_app;
ALTER TABLE points_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_points ON points_ledger FOR SELECT TO mova_app USING(user_id=actor());
GRANT SELECT ON points_ledger TO mova_app;
ALTER TABLE entitlements ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_entitlements ON entitlements FOR SELECT TO mova_app USING(user_id=actor());
GRANT SELECT ON entitlements TO mova_app;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_blocks ON blocks TO mova_app USING(blocker_id=actor()) WITH CHECK(blocker_id=actor());
GRANT SELECT,INSERT,DELETE ON blocks TO mova_app;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY visible_follows ON follows FOR SELECT TO mova_app USING(follower_id=actor());
CREATE POLICY own_follows ON follows FOR INSERT TO mova_app WITH CHECK(follower_id=actor() AND mutually_visible(followed_id));
CREATE POLICY delete_follows ON follows FOR DELETE TO mova_app USING(follower_id=actor());
GRANT SELECT,INSERT,DELETE ON follows TO mova_app;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY visible_posts ON posts FOR SELECT TO mova_app USING(NOT hidden AND mutually_visible(user_id));
CREATE POLICY create_posts ON posts FOR INSERT TO mova_app WITH CHECK(user_id=actor() AND NOT hidden);
CREATE POLICY delete_posts ON posts FOR DELETE TO mova_app USING(user_id=actor());
GRANT SELECT,INSERT,DELETE ON posts TO mova_app;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY visible_comments ON comments FOR SELECT TO mova_app USING(mutually_visible(user_id) AND EXISTS(SELECT 1 FROM posts WHERE posts.id=post_id));
CREATE POLICY create_comments ON comments FOR INSERT TO mova_app WITH CHECK(user_id=actor() AND EXISTS(SELECT 1 FROM posts WHERE posts.id=post_id));
GRANT SELECT,INSERT ON comments TO mova_app;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY read_likes ON likes FOR SELECT TO mova_app USING(mutually_visible(user_id) AND EXISTS(SELECT 1 FROM posts WHERE posts.id=post_id));
CREATE POLICY own_likes ON likes FOR INSERT TO mova_app WITH CHECK(user_id=actor() AND EXISTS(SELECT 1 FROM posts WHERE posts.id=post_id));
CREATE POLICY delete_likes ON likes FOR DELETE TO mova_app USING(user_id=actor());
GRANT SELECT,INSERT,DELETE ON likes TO mova_app;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY create_reports ON reports FOR INSERT TO mova_app WITH CHECK(reporter_id=actor() AND EXISTS(SELECT 1 FROM posts WHERE posts.id=post_id));
GRANT INSERT ON reports TO mova_app;
GRANT SELECT ON catalog TO mova_app;
REVOKE ALL ON users,auth_sessions,password_resets,audit_log FROM mova_app;
