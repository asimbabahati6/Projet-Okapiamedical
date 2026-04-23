/*
  # Fix posts RLS: allow anonymous visitors to read published posts

  ## Problem
  The existing SELECT policy on the `posts` table only targets the `authenticated`
  role. Anonymous (unauthenticated) visitors loading the public news page receive
  zero rows because no policy covers the `anon` role.

  ## Change
  - Add a new SELECT policy for the `public` role (covers both `anon` and
    `authenticated`) that allows reading posts where `status = 'publié'`.
  - The existing `authenticated`-only policy is left intact — it also grants
    admins and authors access to their own unpublished drafts.
*/

CREATE POLICY "Public can view published posts"
  ON posts FOR SELECT
  TO public
  USING (status = 'publié');
