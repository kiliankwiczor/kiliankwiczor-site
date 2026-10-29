CREATE TABLE groups (
 id uuid PRIMARY KEY, name text NOT NULL CHECK(length(name) BETWEEN 3 AND 80),
 description text NOT NULL CHECK(length(description)<=1000)
);
CREATE TABLE group_members (
 user_id uuid REFERENCES users ON DELETE CASCADE, group_id uuid REFERENCES groups ON DELETE CASCADE,
 joined_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id,group_id)
);
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY read_groups ON groups FOR SELECT TO mova_app USING(true);
GRANT SELECT ON groups TO mova_app;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_group_members ON group_members TO mova_app USING(user_id=actor()) WITH CHECK(user_id=actor());
GRANT SELECT,INSERT,DELETE ON group_members TO mova_app;
ALTER TABLE posts ADD COLUMN group_id uuid REFERENCES groups ON DELETE CASCADE;
DROP POLICY visible_posts ON posts;
CREATE POLICY visible_posts ON posts FOR SELECT TO mova_app USING(NOT hidden AND mutually_visible(user_id) AND (group_id IS NULL OR EXISTS(SELECT 1 FROM group_members gm WHERE gm.user_id=actor() AND gm.group_id=posts.group_id)));
DROP POLICY create_posts ON posts;
CREATE POLICY create_posts ON posts FOR INSERT TO mova_app WITH CHECK(user_id=actor() AND NOT hidden AND (group_id IS NULL OR EXISTS(SELECT 1 FROM group_members gm WHERE gm.user_id=actor() AND gm.group_id=posts.group_id)));
CREATE INDEX group_feed_cursor ON posts(group_id,created_at DESC,id DESC) WHERE NOT hidden;
INSERT INTO groups VALUES
 ('42e11c72-9f5b-4338-a7f0-0824ca691001','Les premiers pas','Un espace de questions et d’entraide pour découvrir la musculation.'),
 ('42e11c72-9f5b-4338-a7f0-0824ca691002','À la maison','S’organiser chez soi et partager ses petites victoires, sans injonctions.'),
 ('42e11c72-9f5b-4338-a7f0-0824ca691003','En salle, ensemble','Découvrir les machines et préparer ses questions aux professionnelles.');
