DrOdin GRN - Production Deployment

1. DATABASE
   Open database folder.
   Run run_migration.bat as administrator.
   Confirm SQL Server connection and database name.

2. BACKEND
   Copy all files from backend folder to:
   C:\inetpub\wwwroot\APIDRODIN

   Preserve production appsettings.json.
   Configure IIS and API hosting.

3. FRONTEND
   Copy frontend files from dist root to:
   C:\inetpub\wwwroot\grn-ui

4. IMPORTANT
   Configure Angular API URL to production API.
   Configure IIS routing and permissions.
   Restart IIS Application Pool.

5. TEST
   Open GRN application.
   Test Repair Center.
   Verify New + Saleable + Scratch = Passed.
