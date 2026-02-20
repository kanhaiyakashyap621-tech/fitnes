# Runner

Runner is a real-time multiplayer territory-capture running web app. Users track outdoor runs, close loops to capture territory, and see those polygons appear live on a shared map and leaderboard.

## Tech Stack
- React + Vite
- Tailwind CSS (dark neon theme)
- React Router
- Leaflet + OpenStreetMap tiles
- Firebase Authentication + Firestore
- Firebase Hosting compatible

## Local Development
1. Install dependencies:
   - `npm install`
2. Create a `.env` file:
   - Copy `.env.example` to `.env`
   - Fill in Firebase web app config values
3. Start the dev server:
   - `npm run dev`

Geolocation requires HTTPS in production, or `localhost` during development.

## Firebase Setup (Step-by-Step)
1. **Create a Firebase project**
   - Go to the Firebase Console and create a new project.
2. **Enable Authentication**
   - Authentication → Sign-in method → Enable **Email/Password**.
3. **Create Firestore Database**
   - Firestore Database → Create database.
   - Choose **Production mode**.
4. **Add a Web App**
   - Project settings → General → Add app → Web.
   - Copy the config values into `.env`:
     - `VITE_FIREBASE_API_KEY`
     - `VITE_FIREBASE_AUTH_DOMAIN`
     - `VITE_FIREBASE_PROJECT_ID`
     - `VITE_FIREBASE_STORAGE_BUCKET`
     - `VITE_FIREBASE_MESSAGING_SENDER_ID`
     - `VITE_FIREBASE_APP_ID`
     - `VITE_FIREBASE_MEASUREMENT_ID`
5. **Set Firestore Security Rules**
   - Firestore Database → Rules → Paste contents of `firestore.rules` → Publish.

## Firestore Collections
### `users` (document ID: `uid`)
- `username` (string)
- `email` (string)
- `totalDistance` (number)
- `totalArea` (number)
- `totalCaptures` (number)
- `createdAt` (timestamp)

### `territories` (auto ID)
- `userId` (string)
- `username` (string)
- `coordinates` (array of `{ lat, lng }`)
- `area` (number, square meters)
- `distance` (number, meters)
- `createdAt` (timestamp)

## Firebase Hosting Deployment
1. Install Firebase CLI:
   - `npm install -g firebase-tools`
2. Login:
   - `firebase login`
3. Initialize (if needed):
   - `firebase init`
   - Select **Firestore** and **Hosting**
   - Choose existing project
   - Public directory: `dist`
   - Configure as single-page app: **Yes**
   - Use existing `firestore.rules`: **Yes**
4. Build:
   - `npm run build`
5. Deploy:
   - `firebase deploy`
