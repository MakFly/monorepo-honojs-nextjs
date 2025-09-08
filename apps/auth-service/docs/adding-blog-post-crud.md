# Guide DDD: Ajouter un CRUD "Blog Post" dans auth-service

Ce service suit une architecture inspirée DDD/Clean Architecture:

- Core (domaine): interfaces de repository, use-cases, logique métier pure. Aucune dépendance framework/IO.
- Types: tous les `export type` réutilisables centralisés dans `src/types`.
- Infrastructure: implémentations concrètes (Prisma, Better Auth, etc.). Pas de logique métier.
- Interfaces (HTTP): routes Hono, validation d’IO (zod), mapping DTO ⇄ domaine.
- Composition root: `src/infrastructure/build.ts` câble les dépendances et enregistre les routes.

L’objectif: dépendre d’abstractions (interfaces du domaine) depuis les couches hautes, et inverser les dépendances au niveau du bootstrap.

---

## 0) Pré-requis

- SQLite activé (par défaut): `DATABASE_URL=file:./dev.db`.
- Prisma généré: `pnpm prisma:gen`.

---

## 1) Schéma Prisma (SQLite)

Ajouter le modèle dans `apps/auth-service/prisma/schema.prisma`:

```prisma
model BlogPost {
  id        String   @id @default(cuid())
  title     String
  content   String?
  authorId  String
  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("blog_post")
}
```

Appliquer le schéma:

```bash
pnpm --filter auth-service prisma:gen
pnpm --filter auth-service prisma:push
```

---

## 2) Domaine: types + repository + use-cases

Types (tous les types partagés vont dans `src/types`):

`src/types/blog-post.ts`
```ts
export type BlogPostId = string;

export type BlogPost = {
  id: BlogPostId;
  title: string;
  content?: string | null;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type BlogPostCreate = {
  title: string;
  content?: string | null;
  authorId: string;
};

export type BlogPostUpdate = {
  title?: string;
  content?: string | null;
};
```

Interface de repository (dans le core):

`src/core/repositories/blog-post-repository.ts`
```ts
import type { BlogPost, BlogPostCreate, BlogPostId, BlogPostUpdate } from '../../types/blog-post';

export interface BlogPostRepository {
  create(input: BlogPostCreate): Promise<BlogPost>;
  findById(id: BlogPostId): Promise<BlogPost | null>;
  listByAuthor(authorId: string): Promise<BlogPost[]>;
  update(id: BlogPostId, patch: BlogPostUpdate): Promise<BlogPost>;
  delete(id: BlogPostId): Promise<void>;
}
```

Use-cases (fonctions pures dépendant de l’interface):

`src/core/use-cases/blog-post/create-blog-post.ts`
```ts
import type { BlogPostCreate, BlogPost } from '../../../types/blog-post';
import type { BlogPostRepository } from '../../repositories/blog-post-repository';

export const createBlogPost = (repo: BlogPostRepository) => async (input: BlogPostCreate): Promise<BlogPost> => {
  // Ici on peut ajouter des règles métier (ex: title non vide au-delà de la validation IO)
  return repo.create(input);
};
```

`src/core/use-cases/blog-post/get-blog-post.ts`
```ts
import type { BlogPost } from '../../../types/blog-post';
import type { BlogPostRepository } from '../../repositories/blog-post-repository';

export const getBlogPost = (repo: BlogPostRepository) => async (id: string): Promise<BlogPost | null> => {
  return repo.findById(id);
};
```

`src/core/use-cases/blog-post/list-blog-posts.ts`
```ts
import type { BlogPost } from '../../../types/blog-post';
import type { BlogPostRepository } from '../../repositories/blog-post-repository';

export const listBlogPosts = (repo: BlogPostRepository) => async (authorId: string): Promise<BlogPost[]> => {
  return repo.listByAuthor(authorId);
};
```

`src/core/use-cases/blog-post/update-blog-post.ts`
```ts
import type { BlogPost, BlogPostUpdate } from '../../../types/blog-post';
import type { BlogPostRepository } from '../../repositories/blog-post-repository';

export const updateBlogPost = (repo: BlogPostRepository) => async (id: string, patch: BlogPostUpdate): Promise<BlogPost> => {
  return repo.update(id, patch);
};
```

`src/core/use-cases/blog-post/delete-blog-post.ts`
```ts
import type { BlogPostRepository } from '../../repositories/blog-post-repository';

export const deleteBlogPost = (repo: BlogPostRepository) => async (id: string): Promise<void> => {
  await repo.delete(id);
};
```

---

## 3) Infrastructure: implémentation Prisma du repository

`src/infrastructure/repositories/prisma-blog-post-repository.ts`
```ts
import { getPrisma } from '../db/prisma';
import type { BlogPostRepository } from '../../core/repositories/blog-post-repository';
import type { BlogPost, BlogPostCreate, BlogPostId, BlogPostUpdate } from '../../types/blog-post';

export class PrismaBlogPostRepository implements BlogPostRepository {
  private prisma = getPrisma();

  async create(input: BlogPostCreate): Promise<BlogPost> {
    const row = await this.prisma.blogPost.create({ data: input });
    return row as unknown as BlogPost;
  }

  async findById(id: BlogPostId): Promise<BlogPost | null> {
    const row = await this.prisma.blogPost.findUnique({ where: { id } });
    return (row as unknown as BlogPost) ?? null;
  }

  async listByAuthor(authorId: string): Promise<BlogPost[]> {
    const rows = await this.prisma.blogPost.findMany({ where: { authorId }, orderBy: { createdAt: 'desc' } });
    return rows as unknown as BlogPost[];
  }

  async update(id: BlogPostId, patch: BlogPostUpdate): Promise<BlogPost> {
    const row = await this.prisma.blogPost.update({ where: { id }, data: patch });
    return row as unknown as BlogPost;
  }

  async delete(id: BlogPostId): Promise<void> {
    await this.prisma.blogPost.delete({ where: { id } });
  }
}
```

---

## 4) Interfaces HTTP: routes Hono + validation zod

`src/interfaces/http/routes/blog-posts.ts`
```ts
import { z } from 'zod';
import type { Hono } from 'hono';
import type { SessionService } from '../../../core/services/session';
import type { BlogPostRepository } from '../../../core/repositories/blog-post-repository';
import { createBlogPost } from '../../../core/use-cases/blog-post/create-blog-post';
import { getBlogPost } from '../../../core/use-cases/blog-post/get-blog-post';
import { listBlogPosts } from '../../../core/use-cases/blog-post/list-blog-posts';
import { updateBlogPost } from '../../../core/use-cases/blog-post/update-blog-post';
import { deleteBlogPost } from '../../../core/use-cases/blog-post/delete-blog-post';

const createSchema = z.object({ title: z.string().min(1), content: z.string().optional() });
const updateSchema = z.object({ title: z.string().min(1).optional(), content: z.string().optional() });

type Deps = { repo: BlogPostRepository; sessionService: SessionService };

export const registerBlogPostRoutes = (app: Hono, { repo, sessionService }: Deps) => {
  // List posts of current user
  app.get('/api/posts', async (c) => {
    const session = await sessionService.getSession(c.req.raw.headers);
    if (!session) return c.json({ error: 'Unauthorized' }, 401);
    const exec = listBlogPosts(repo);
    const data = await exec(session.user.id as string);
    return c.json(data);
  });

  // Get by id
  app.get('/api/posts/:id', async (c) => {
    const session = await sessionService.getSession(c.req.raw.headers);
    if (!session) return c.json({ error: 'Unauthorized' }, 401);
    const exec = getBlogPost(repo);
    const post = await exec(c.req.param('id'));
    if (!post || post.authorId !== (session.user.id as string)) return c.json({ error: 'Not Found' }, 404);
    return c.json(post);
  });

  // Create
  app.post('/api/posts', async (c) => {
    const session = await sessionService.getSession(c.req.raw.headers);
    if (!session) return c.json({ error: 'Unauthorized' }, 401);
    const body = await c.req.json().catch(() => ({}));
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: 'Invalid body', details: parsed.error.flatten() }, 400);
    const exec = createBlogPost(repo);
    const post = await exec({ ...parsed.data, authorId: session.user.id as string });
    return c.json(post, 201);
  });

  // Update
  app.put('/api/posts/:id', async (c) => {
    const session = await sessionService.getSession(c.req.raw.headers);
    if (!session) return c.json({ error: 'Unauthorized' }, 401);
    const id = c.req.param('id');
    const body = await c.req.json().catch(() => ({}));
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: 'Invalid body', details: parsed.error.flatten() }, 400);
    const current = await getBlogPost(repo)(id);
    if (!current || current.authorId !== (session.user.id as string)) return c.json({ error: 'Not Found' }, 404);
    const exec = updateBlogPost(repo);
    const post = await exec(id, parsed.data);
    return c.json(post);
  });

  // Delete
  app.delete('/api/posts/:id', async (c) => {
    const session = await sessionService.getSession(c.req.raw.headers);
    if (!session) return c.json({ error: 'Unauthorized' }, 401);
    const id = c.req.param('id');
    const current = await getBlogPost(repo)(id);
    if (!current || current.authorId !== (session.user.id as string)) return c.json({ error: 'Not Found' }, 404);
    await deleteBlogPost(repo)(id);
    return c.body(null, 204);
  });
};
```

---

## 5) Wiring: composition root

Dans `src/infrastructure/build.ts`, instancier le repository et enregistrer les routes:

```ts
import { PrismaBlogPostRepository } from './repositories/prisma-blog-post-repository';
import { registerBlogPostRoutes } from '../interfaces/http/routes/blog-posts';

export const buildDependencies = (env: Env) => {
  const auth = buildBetterAuth(env);

  const sessionService: SessionService = {
    getSession: async (headers) => auth.api.getSession({ headers }),
  };

  const blogRepo = new PrismaBlogPostRepository();

  const routes: RoutesRegistrar = (app) => {
    registerMeRoutes(app, { sessionService });
    registerAuthRoutes(app, { authHandler: auth.handler });
    registerBlogPostRoutes(app, { repo: blogRepo, sessionService });
  };

  return { routes };
};
```

---

## 6) Test rapide (après démarrage)

Assurez-vous d’être authentifié (cookies/headers gérés par Better Auth). Exemples `curl` (adapter l’URL/headers):

```bash
# Créer
curl -X POST http://localhost:4001/api/posts \
  -H 'Content-Type: application/json' \
  -d '{"title":"Hello","content":"World"}'

# Lister mes posts
curl http://localhost:4001/api/posts

# Détail
curl http://localhost:4001/api/posts/<id>

# Mettre à jour
curl -X PUT http://localhost:4001/api/posts/<id> \
  -H 'Content-Type: application/json' \
  -d '{"title":"New title"}'

# Supprimer
curl -X DELETE http://localhost:4001/api/posts/<id>
```

---

## Rappels et principes

- La validation d’IO (zod) vit dans l’interface HTTP; la validation métier dans les use-cases.
- Les handlers Hono n’accèdent jamais directement à Prisma; ils passent par les use-cases/repositories.
- Les types partagés restent dans `src/types` pour éviter les dépendances circulaires et clarifier l’API interne.
- Toute nouvelle dépendance concrète (repo, service externe) est câblée dans `buildDependencies` et injectée.

