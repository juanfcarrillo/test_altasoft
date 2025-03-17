CREATE OR REPLACE FUNCTION get_grouped_documents()
RETURNS TABLE (
  name text,
  title text,
  author text,
  type text,
  pages int
) AS $$
  SELECT
    metadata->>'s3Name' as name,
    metadata->'pdf'->'info'->>'Title' as title,
    metadata->'pdf'->'metadata'->'_metadata'->>'dc:creator' as author,
    metadata->'blobType' as type,
    (metadata->'pdf'->>'totalPages')::int as pages
  FROM documents
  GROUP BY
    metadata->>'s3Name',
    metadata->'pdf'->'info'->>'Title',
    metadata->'pdf'->'metadata'->'_metadata'->>'dc:creator',
    metadata->'blobType',
    metadata->'pdf'->>'totalPages';
$$ LANGUAGE sql;
