# Mythos Archives – Backend

Two microservices:
- auth-service (Express + Prisma + SQL)
- lore-service (Express + Mongoose + MongoDB)

Both secured via JWT with roles (USER, EXPERT, ADMIN). Lore-service verifies tokens via auth-service.

## Prerequisites
- Node.js 18+
- SQLite (for dev) or Postgres/MySQL (optional) for auth-service
- MongoDB (local or Atlas) for lore-service

## Setup

### 1) auth-service
```
cd auth-service
npm install
npx prisma generate
# For SQLite dev:
setx DATABASE_URL "file:./dev.db"
# Or set to your SQL URL
```
Defaults to port 4000.

### 2) lore-service
```
cd lore-service
npm install
setx MONGO_URL "mongodb://localhost:27017/mythos"
setx AUTH_SERVICE_URL "http://localhost:4000"
setx JWT_SECRET "super-secret-change-me"
npm run dev
```
Defaults to port 5000.

## Endpoints Overview

### auth-service (SQL)
- POST /auth/register
- POST /auth/login
- GET /auth/me
- GET /admin/users (ADMIN)
- PATCH /users/:id/role (ADMIN)
- POST /users/:id/reputation (EXPERT/ADMIN) – updates reputation and auto-promotes to EXPERT at 10+

### lore-service (MongoDB)
Creatures:
- POST /creatures
- GET /creatures/:id
- GET /creatures (supports sort by legendScore)

Rules:
- Cannot validate own testimony

Register & Login:

# Login
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"a@b.com","password":"pass"}'
```

Create Creature (lore-service):
```
curl -X POST http://localhost:5000/creatures \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Lindworm","origin":"Nordique"}'
```

Post Testimony:
```
curl -X POST http://localhost:5000/testimonies \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"creatureId":"<id>","description":"Spotted near fjords"}'
```

Validate Testimony:
```
curl -X POST http://localhost:5000/testimonies/<id>/validate \
  -H "Authorization: Bearer EXPERT_OR_ADMIN_TOKEN"
```

List Creatures sorted by legendScore:
```
curl "http://localhost:5000/creatures?sort=legendScore"
```

## Architecture
Layered per service: controllers / services / repositories (or models), with middleware for auth.

## Notes
- For production, use Postgres/MySQL for auth-service and a managed Mongo.
- Ensure both services use the same JWT secret if you switch to shared verification; otherwise lore-service calls auth-service `/auth/me`.
