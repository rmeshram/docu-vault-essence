Deployment instructions for Supabase and frontend

1. Set env vars locally in .env.local
2. Create Supabase storage bucket named `documents`
3. Deploy edge functions with `supabase functions deploy`
4. Run `npm run db:migrate` to apply schema
5. Build and deploy frontend (Docker or static hosting)
