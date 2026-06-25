1. Start containers
docker compose up -d --build
2. Verify containers are running
docker ps

You should see:

backend
frontend
postgres
redis
3. Run initial Prisma migration (IMPORTANT FIRST TIME ONLY)
docker compose exec backend npx prisma migrate dev --name init

This:

creates tables
creates prisma/migrations
syncs DB
4. Generate Prisma client (if needed)
docker compose exec backend npx prisma generate
5. Seed database
docker compose exec backend npx prisma db seed
6. Restart backend (optional but clean)
docker compose restart backend
7. Open app
Frontend: http://localhost:3000
Backend: http://localhost:4000
After FIRST setup (important)

You will NOT use migrate dev again in Docker.

Instead use:

docker compose exec backend npx prisma migrate deploy
Summary rule (simple)
Action	Command
First setup	migrate dev
Normal runs	migrate deploy
Insert data	db seed
Start system	docker compose up -d --build