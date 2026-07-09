# Viora Render Deploy

To keep users, messages, uploaded files, and deleted messages persistent on Render:

1. Create or open the Viora web service on Render.
2. Add a persistent disk mounted at:
   `/var/data`
3. Add environment variable:
   `DATA_DIR=/var/data`
4. Redeploy the latest GitHub commit.

Without a persistent disk, Render can reset local JSON/file storage after deploys or restarts. That can make deleted messages come back and newly created users disappear.
