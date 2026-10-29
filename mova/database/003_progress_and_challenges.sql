ALTER TABLE workouts ADD COLUMN revision integer NOT NULL DEFAULT 0;
GRANT UPDATE(revision,snapshot) ON workouts TO mova_app;
CREATE TABLE challenges (
 id uuid PRIMARY KEY, title text NOT NULL CHECK(length(title) BETWEEN 3 AND 100),
 description text NOT NULL CHECK(length(description)<=1000), weeks integer NOT NULL CHECK(weeks BETWEEN 1 AND 8),
 weekly_goal integer NOT NULL CHECK(weekly_goal BETWEEN 1 AND 3), active boolean NOT NULL DEFAULT true
);
CREATE TABLE challenge_members (
 user_id uuid REFERENCES users ON DELETE CASCADE, challenge_id uuid REFERENCES challenges ON DELETE CASCADE,
 joined_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id,challenge_id)
);
CREATE TABLE badges (
 user_id uuid REFERENCES users ON DELETE CASCADE, code text NOT NULL,
 awarded_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id,code)
);
CREATE TABLE saved_posts (
 user_id uuid REFERENCES users ON DELETE CASCADE, post_id uuid REFERENCES posts ON DELETE CASCADE,
 PRIMARY KEY(user_id,post_id)
);
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY read_challenges ON challenges FOR SELECT TO mova_app USING(active);
GRANT SELECT ON challenges TO mova_app;
ALTER TABLE challenge_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_challenges ON challenge_members TO mova_app USING(user_id=actor()) WITH CHECK(user_id=actor() AND EXISTS(SELECT 1 FROM challenges WHERE id=challenge_id));
GRANT SELECT,INSERT,DELETE ON challenge_members TO mova_app;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_badges ON badges FOR SELECT TO mova_app USING(user_id=actor());
GRANT SELECT ON badges TO mova_app;
ALTER TABLE saved_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_saved_posts ON saved_posts FOR SELECT TO mova_app USING(user_id=actor() AND EXISTS(SELECT 1 FROM posts WHERE id=post_id));
CREATE POLICY save_visible_posts ON saved_posts FOR INSERT TO mova_app WITH CHECK(user_id=actor() AND EXISTS(SELECT 1 FROM posts WHERE id=post_id));
CREATE POLICY delete_own_saved_posts ON saved_posts FOR DELETE TO mova_app USING(user_id=actor());
GRANT SELECT,INSERT,DELETE ON saved_posts TO mova_app;
INSERT INTO challenges VALUES('da925302-501b-41a8-a978-aad0bc086101','Deux rendez-vous pour moi','Deux jours de mouvement par période de sept jours, quatre semaines, sans rattrapage ni pénalité. Défi de régularité du pilote.',4,2,true);
