 # CloseChat — Messagerie locale (WiFi uniquement)

CloseChat est un outil de messagerie **exclusivement local** afin de discuter avec les personnes connectées au **même réseau WiFi** que vous.  
Vos discussions sont donc à **100% locales**, et donc **100% sécurisées**.

---

## Intuition produit

L’idée derrière CloseChat est simple : créer des conversations **intimes**, sans dépendre de services externes, ni pousser les discussions dans un flux public.

La maquette traduit ce positionnement avec une navigation pensée pour de **petits groupes** :
- vous créez ou rejoignez un **salon**
- vous choisissez un **pseudonyme**
- vous discutez en **temps réel**
- les salons peuvent être **publics** ou **protégés** par un **mot de passe**

### Texte “À propos” (inspiré de la maquette)

> CloseChat est une application de chat pensée pour les petits groupes et les vraies conversations. Pas de flux infini, pas d'algorithme : juste vous et les gens qui comptent.
>
> Créez ou rejoignez un salon, choisissez un pseudo, et commencez à discuter en temps réel. Les salons peuvent être publics ou protégés par un mot de passe.
>
> Nous croyons que les meilleures conversations se passent dans des espaces intimes, où l'on se connaît vraiment.

---

## Parcours utilisateur (selon la maquette)

### 1) Connexion et session locale

Avant d’accéder aux salons, l’utilisateur passe par un écran de connexion (compte + choix d’identifiant).

L’objectif côté produit est clair :
> Vous serez connecté ou créerez une session locale en vous connectant à votre compte

### 2) Création d’un salon

Dans l’écran de création de salon, l’utilisateur :
- renseigne le **nom du salon** (`Nom du salon`)
- définit si nécessaire un **mot de passe**
- valide la **confirmation du mot de passe**

Libellé mis en avant dans la maquette :
- `Créez votre salon maintenant !`

### 3) Listing des salons

Une fois connecté, l’utilisateur peut consulter la liste des salons (et basculer vers un salon pour démarrer la discussion).

Libellés visibles dans la maquette :
- `Ecran de listing des salons`

### 4) Administration / modification du salon

Pour garder l’expérience simple tout en laissant la main à l’hôte, la maquette prévoit un espace d’administration :
- `Administrer le salon`

Et un écran de modification du salon pour ajuster certains paramètres.

### 5) Modification de l’utilisateur

La maquette prévoit aussi un écran de modification du profil utilisateur :
- `Ecran de modification de l'utilisateur`
- action : `Changer le pseudo`

### 6) Discussion

Quand tout est prêt, la maquette mène vers l’écran de chat :
- `Ecran de chat`
- message de bienvenue : `Ne soyez pas timide, rejoignez la discussion !`
- contexte éditorial : `Pour les conversations entre nous`

---

## Architecture technique (état actuel du repo)

Au moment où ce récapitulatif est rédigé, le dépôt met en place les briques de base suivantes :

### Backend : `api` (Node + Express)

Le backend Express expose désormais :
- un endpoint de santé `GET /health` (réponse `{"status":"ok"}`)
- une API d’authen­tication centralisée (JWT) :
  - `POST /auth/signup`
  - `POST /auth/login`
- un récepteur de crashs self-hosted (pour Electron) :
  - `POST /crash`

Le job Node gère aussi le nettoyage des crash reports (suppression des enregistrements plus vieux que 6 mois).

#### Clés JWT persistantes (mode multi-machines)

Pour que le chat LAN vérifie les tokens **sans requête internet**, les clés JWT doivent être **persistantes et partageables** :

- côté auth : `secrets/jwt_private.pem` et `secrets/jwt_public.pem`
- côté LAN (Electron) : au minimum `secrets/jwt_public.pem` (ou la variable d’environnement `JWT_PUBLIC_KEY`)

Génération (une fois) :
- exécuter `node scripts/generate-jwt-keys.js`
- puis copier `secrets/jwt_public.pem` sur les autres machines qui rejoignent les salons.

Note : à ce stade, la logique “salons” et la messagerie temps réel (LAN) a été amorcée côté Electron via WebSocket (host / join / diffusion). L’UI connexion/salon/chat n’est pas encore branchée sur ces écrans, mais le transport fonctionne déjà.

### Desktop : `desktop` (Electron + React + TailwindCSS)

L’application Electron charge l’interface React et embarque `electron.crashReporter` pour remonter les crashs vers l’API.

À ce stade :
- le rendu React reste un **écran de test / scaffold** (un composant `App` minimal)
- il n’existe pas encore de routes, d’écrans de connexion/salon/chat, ni de couche réseau côté UI

### Base de données : `db/db.sql`

Le fichier `db/db.sql` contient désormais un schéma minimal exploitable :
- `users` (comptes CloseChat)
- `crash_reports` (rapports de crash self-hosted)

Le schéma est idempotent (création conditionnelle) afin de simplifier le démarrage.

---

## Ce que le projet vise (et reste à implémenter)

Pour tenir la promesse “**100% local via WiFi**” décrite en introduction, l’implémentation devra notamment :

1. Mettre en place la **création/rejoindre de salons** sur le LAN
2. Ajouter une couche de communication **temps réel** (ex. WebSocket) et relier les événements “envoyer un message” / “recevoir un message”
3. Gérer une notion de **session locale** (définition du serveur/salon, découverte ou saisie d’une adresse, etc.)
4. Assurer la robustesse :
   - reconnexion
   - gestion des salons protégés par mot de passe
   - cohérence des pseudonymes / changements
5. Concevoir la sécurité comme une contrainte technique :
   - pas d’envoi vers des services externes
   - communication limitée au réseau local

La maquette sert de référence fonctionnelle pour ces écrans et ces interactions, tandis que le code actuel est encore au niveau “fondations”.

