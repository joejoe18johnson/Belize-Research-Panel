-- Storage buckets for panelist documents and survey branding assets

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'panelist-documents',
    'panelist-documents',
    false,
    10485760,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  ),
  (
    'survey-assets',
    'survey-assets',
    false,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
  )
ON CONFLICT (id) DO NOTHING;

-- Panelists may upload/read files under panelist-documents/{panelist_id}/...
CREATE POLICY panelist_documents_select_own
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'panelist-documents'
    AND (storage.foldername(name))[1] = auth_panelist_id()::text
  );

CREATE POLICY panelist_documents_insert_own
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'panelist-documents'
    AND (storage.foldername(name))[1] = auth_panelist_id()::text
  );

CREATE POLICY panelist_documents_update_own
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'panelist-documents'
    AND (storage.foldername(name))[1] = auth_panelist_id()::text
  );

CREATE POLICY panelist_documents_delete_own
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'panelist-documents'
    AND (storage.foldername(name))[1] = auth_panelist_id()::text
  );

-- Staff read access to panelist documents
CREATE POLICY panelist_documents_staff_select
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'panelist-documents' AND auth_is_staff());

-- Survey assets: staff write, authenticated read (for assigned surveys)
CREATE POLICY survey_assets_staff_all
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'survey-assets' AND auth_is_staff())
  WITH CHECK (bucket_id = 'survey-assets' AND auth_is_staff());

CREATE POLICY survey_assets_authenticated_read
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'survey-assets');
