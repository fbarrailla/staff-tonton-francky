# Staff — Tonton Francky

Backoffice de gestion d'équipe pour Tonton Francky (voyage · tech · ebooks).

Suivi des présences 7/7, congés (4 jours/mois), arrêts maladie, calendrier mensuel
et soldes. Interface française, thèmes clair + sombre, ambiance « papier crème +
encre espresso + orange Tonton ».

## Stack

- **Vite + React 18 + TypeScript**
- **Tailwind CSS** avec design tokens (variables CSS pour le thème)
- **Supabase** pour l'auth, la base de données et le stockage
- **lucide-react** · icônes
- **date-fns** · manipulation de dates (locale FR)

## Démarrage rapide

```bash
npm install
cp .env.example .env.local       # remplir les deux variables — voir ci-dessous
npm run dev
```

Ouvrez ensuite [http://localhost:5173](http://localhost:5173).

> L'application requiert un projet Supabase. Sans `VITE_SUPABASE_URL` et
> `VITE_SUPABASE_ANON_KEY`, la connexion échouera.

## Configuration Supabase

1. Créez un projet sur [supabase.com](https://supabase.com).
2. Dans **SQL Editor**, collez le contenu de [`supabase/schema.sql`](./supabase/schema.sql),
   puis de [`supabase/applicants.sql`](./supabase/applicants.sql), et exécutez. Cela crée :
   - Tables : `employees`, `employee_days_off`, `employee_sick_leaves`, `employee_documents`, `applicants`
   - Vue : `v_employee_monthly_balance` (soldes par mois)
   - Triggers `updated_at`
   - Row Level Security (lecture/écriture pour les utilisateurs authentifiés)
   - Buckets de stockage : `avatars` (public), `medical-certificates` (privé)
     et `applicants` (privé — CV + lettres de motivation)
   - Policies de stockage associées
3. Dans **Authentication → Providers**, activez **Email**, puis créez
   un·e utilisateur·trice administrateur·trice depuis l'onglet **Users**.
4. Récupérez l'URL et la clé `anon` du projet (Settings → API) puis ajoutez-les
   à `.env.local` :

   ```env
   VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```

5. Relancez `npm run dev`. L'écran de connexion utilise désormais Supabase Auth.

## Architecture

```
src/
  components/          shells & shared widgets
    ui/                primitives (Button, Field, Dialog, …)
    Sidebar.tsx, Topbar.tsx, Layout.tsx, MobileNav.tsx
    EmployeeForm.tsx, DayOffForm.tsx, SickLeaveForm.tsx
  contexts/            AuthContext (Supabase), ThemeContext, ToastContext
  hooks/               useStore — reactive bindings to the in-memory cache
  lib/
    store.ts           in-memory cache, source of truth = Supabase
    storage.ts         avatar + medical-certificate uploads
    supabase.ts        Supabase client
    derived.ts         today-status & monthly balance computations
    utils.ts
  pages/
    Login.tsx, Dashboard.tsx, Employees.tsx, EmployeeDetail.tsx,
    CalendarPage.tsx, DaysOffPage.tsx, SickLeavesPage.tsx, SettingsPage.tsx
  types/
supabase/
  schema.sql           full backend schema + RLS + storage
```

## Fonctionnalités

- **Connexion / déconnexion** par e-mail + mot de passe (Supabase Auth).
- **Équipe** — CRUD complet, recherche, filtres rôle / statut / compétences,
  upload de photo de profil.
- **Candidats** — pipeline de recrutement (nouveau · en revue · entretien ·
  embauché · refusé), CV + lettre de motivation en pièce jointe (privé,
  signed URLs), lien portfolio externe, note interne.
- **Calendrier** mensuel avec navigation, filtres et code couleur :
  orange = congé approuvé, jaune = en attente, gris = refusé, rose = arrêt
  maladie, vert = en poste. Ajout rapide depuis n'importe quelle journée.
- **Congés** — quota de **4 jours / mois calendaire** par salarié·e, avec
  validation, refus motivé, et **override admin** explicite si la demande
  dépasse le quota.
- **Arrêts maladie** — décompte séparé, certificat médical en pièce jointe.
- **Tableau de bord** — équipe en poste, en congé, en arrêt, soldes mensuels,
  demandes à valider, prochains événements.
- **Réglages** — thème, quota, langue, gestion du compte, réinitialisation de
  la démo.

## Conventions

- Les dates en base sont des `date` ISO (`yyyy-MM-dd`).
- `number_of_days` est inclusif (du jour de début au jour de fin).
- Les arrêts maladie ne décomptent **jamais** du quota mensuel.

## Déploiement — GitHub Pages

Le workflow `.github/workflows/deploy.yml` publie automatiquement le site sur
GitHub Pages à chaque push sur `main`.

**Configuration en deux étapes :**

1. **Activer Pages** — Repo → *Settings* → *Pages* → **Source : GitHub Actions**.
2. **Ajouter les secrets** (Settings → Secrets and variables → Actions) :
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

Le site est servi sur le domaine personnalisé
**[https://staff.tontonfrancky.com](https://staff.tontonfrancky.com)**.

- `public/CNAME` est embarqué dans le build pour que GitHub Pages conserve
  le domaine personnalisé à chaque déploiement.
- Le routage SPA fonctionne aussi sur les liens profonds (`/equipe/:id`,
  `/calendrier`, etc.) grâce à un `404.html` qui sert la même page que
  `index.html`.

### Servir depuis `fbarrailla.github.io/staff-tonton-francky/`

Si vous voulez aussi exposer le site sur l'URL GitHub par défaut, construisez
avec un sous-chemin :

```bash
VITE_BASE=/staff-tonton-francky/ npm run build
```

ou ajoutez `env: { VITE_BASE: '/staff-tonton-francky/' }` à l'étape *Build*
du workflow.

## Roadmap suggérée

- Realtime — souscriptions Supabase pour propager les changements à tous les
  clients connectés en temps réel.
- Notifications par e-mail à l'approbation / au refus.
- Export CSV des congés / arrêts pour la paie.
- Rôles non-admin (salarié·e voyant uniquement ses propres données).
