# Mythos Archives – Backend

## Architecture

Deux microservices indépendants :
- **auth-service** (Express + Prisma + SQL) - Gestion des utilisateurs et authentification
- **lore-service** (Express + Mongoose + MongoDB) - Gestion des créatures et témoignages

Sécurisés par JWT avec 3 rôles : **USER**, **EXPERT**, **ADMIN**. Le lore-service vérifie les tokens via l'auth-service.

## Technologies

### auth-service
- **Express.js** - Framework web
- **Prisma** - ORM pour SQL
- **SQLite** (dev) / PostgreSQL/MySQL (prod)
- **bcryptjs** - Hash des mots de passe
- **jsonwebtoken** - Authentification JWT

### lore-service
- **Express.js** - Framework web
- **Mongoose** - ODM pour MongoDB
- **MongoDB** - Base de données NoSQL
- **axios** - Communication inter-services

## Prérequis
- Node.js 18+
- SQLite (dev) ou Postgres/MySQL (optionnel) pour auth-service
- MongoDB (local ou Atlas) pour lore-service

## 🚀 Installation

### 1) auth-service
```bash
cd auth-service
npm install
npx prisma generate
# Pour SQLite en dev :
setx DATABASE_URL "file:./dev.db"
# Ou définir votre URL SQL
npm run dev
```
Port par défaut : **4000**

### 2) lore-service
```bash
cd lore-service
npm install
setx MONGO_URL "mongodb://localhost:27017/mythos"
setx AUTH_SERVICE_URL "http://localhost:4000"
setx JWT_SECRET "super-secret-change-me"
npm run dev
```
Port par défaut : **5000**

## Routes API

### auth-service (SQL - Port 4000)

**Authentification** (`/auth`)
- `POST /auth/register` - Inscription (public)
- `POST /auth/login` - Connexion (public)
- `GET /auth/me` - Profil utilisateur (authentifié)

**Utilisateurs** (`/users`)
- `PATCH /users/:id/role` - Modifier le rôle (ADMIN uniquement)
- `POST /users/:id/reputation` - Mettre à jour la réputation (EXPERT/ADMIN)
  - Met à jour la réputation et promeut automatiquement en EXPERT à 10+

**Administration** (`/admin`)
- `GET /admin/users` - Lister tous les utilisateurs (ADMIN uniquement)

### lore-service (MongoDB - Port 5000)

**Créatures** (`/creatures`)
- `POST /creatures` - Créer une créature (authentifié)
- `GET /creatures/:id` - Obtenir une créature (authentifié)
- `GET /creatures?sort=legendScore` - Lister les créatures avec tri (authentifié)

**Témoignages** (`/testimonies`)
- `POST /testimonies` - Poster un témoignage (authentifié)
- `GET /creatures/:id/testimonies` - Lister les témoignages d'une créature (authentifié)
- `POST /testimonies/:id/validate` - Valider un témoignage (EXPERT/ADMIN)
- `POST /testimonies/:id/reject` - Rejeter un témoignage (EXPERT/ADMIN)

**Règles** :
- Un utilisateur ne peut pas valider son propre témoignage
- Le score de légende (legendScore) est calculé selon les témoignages validés

## Modèles de Données

### Base SQL (auth-service)
```prisma
User {
  id          Int
  email       String (unique)
  username    String (unique)
  password    String (hash)
  role        String (USER/EXPERT/ADMIN)
  reputation  Int (défaut: 0)
  createdAt   DateTime
}
```

### Base MongoDB (lore-service)
```javascript
Creature {
  authorId    String
  name        String (unique)
  origin      String
  createdAt   Date
}

Testimony {
  creatureId   ObjectId (ref: Creature)
  authorId     String
  description  String
  status       String (PENDING/VALIDATED/REJECTED)
  validatedBy  String
  validatedAt  Date
  createdAt    Date
}
```

## Exemples d'utilisation

### Inscription et connexion
```bash
# Inscription
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"utilisateur@example.com","username":"pseudo","password":"motdepasse"}'

# Connexion
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"utilisateur@example.com","password":"motdepasse"}'
```

### Créer une créature
```bash
curl -X POST http://localhost:5000/creatures \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Lindworm","origin":"Nordique"}'
```

### Poster un témoignage
```bash
curl -X POST http://localhost:5000/testimonies \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"creatureId":"<id>","description":"Aperçu près des fjords norvégiens"}'
```

### Valider un témoignage (EXPERT/ADMIN)
```bash
curl -X POST http://localhost:5000/testimonies/<id>/validate \
  -H "Authorization: Bearer TOKEN_EXPERT_OU_ADMIN"
```

### Lister les créatures par score de légende
```bash
curl "http://localhost:5000/creatures?sort=legendScore" \
  -H "Authorization: Bearer VOTRE_TOKEN"
```

## Architecture en couches

Chaque service utilise une architecture en couches :
- **Controllers** - Gestion des requêtes HTTP
- **Services** - Logique métier
- **Repositories / Models** - Accès aux données
- **Middleware** - Authentification et autorisations

##  Notes importantes

- **Production** : Utiliser PostgreSQL/MySQL pour auth-service et MongoDB Atlas pour lore-service
- **Sécurité** : Les deux services doivent utiliser le même `JWT_SECRET`
- **Communication** : Le lore-service appelle l'endpoint `/auth/me` de l'auth-service pour vérifier les tokens
- **Promotion automatique** : Les utilisateurs atteignant 10+ de réputation deviennent automatiquement EXPERT

## 🎯 Fonctionnalités clés

✅ Authentification JWT avec gestion de rôles  
✅ Système de réputation automatique  
✅ Validation croisée des témoignages  
✅ Calcul dynamique du score de légende  
✅ Architecture microservices découplée  
✅ Communication inter-services sécurisée
