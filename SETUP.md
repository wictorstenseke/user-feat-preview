# Customer Feedback Previewer - Setup Guide

## Prerequisites

- Node.js 20+
- Firebase account
- GitHub account with a repository
- OpenAI API key (for LLM draft generation)

## Step 1: Firebase Setup

1. **Create a Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Create a new project
   - Enable Firestore Database (Start in test mode for development)
   - Note your project ID, API key, and other config values

2. **Set up Firestore Collections**
   - The app will create these collections automatically, but you can pre-create them:
     - `feedback` - stores feedback items
     - `comments` - stores comments on feedback
     - `votes` - tracks user votes (one per user per item)
     - `ratelimits` - tracks rate limits for spam protection

3. **Set up Firestore Rules**
   - Use the `firestore.rules` file provided in the repo
   - Deploy: `firebase deploy --only firestore:rules`

## Step 2: Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your Firebase credentials:
   - `VITE_FIREBASE_API_KEY` - Your Firebase API key
   - `VITE_FIREBASE_AUTH_DOMAIN` - your-project.firebaseapp.com
   - `VITE_FIREBASE_PROJECT_ID` - Your project ID
   - `VITE_FIREBASE_STORAGE_BUCKET` - your-project.appspot.com
   - `VITE_FIREBASE_MESSAGING_SENDER_ID` - Your sender ID
   - `VITE_FIREBASE_APP_ID` - Your app ID

3. Set up GitHub integration:
   - `VITE_GITHUB_REPO_OWNER` - Your GitHub username
   - `VITE_GITHUB_REPO_NAME` - Repository name (user-feat-preview)
   - `VITE_GITHUB_API_TOKEN` - GitHub personal access token (needs `repo` scope)

4. Set up OpenAI:
   - `VITE_OPENAI_API_KEY` - Your OpenAI API key

## Step 3: Cloud Functions Setup

1. **Install Firebase CLI** (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. **Initialize Firebase in your project**:
   ```bash
   firebase init
   ```
   - Select your Firebase project
   - Choose "Functions" when prompted
   - Choose TypeScript
   - Say yes to ESLint

3. **Set up environment variables for Cloud Functions**:
   - Create `.env` file in the `functions/` directory:
     ```
     GITHUB_TOKEN=your_github_token
     GITHUB_REPO_OWNER=your_username
     GITHUB_REPO_NAME=user-feat-preview
     OPENAI_API_KEY=your_openai_key
     PREVIEW_WEBHOOK_SECRET=your_random_secret_key
     ```

4. **Deploy Cloud Functions**:
   ```bash
   firebase deploy --only functions
   ```

## Step 4: GitHub Actions Setup

1. **Add GitHub Secrets** to your repository settings:
   - `FIREBASE_API_KEY`
   - `FIREBASE_AUTH_DOMAIN`
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_STORAGE_BUCKET`
   - `FIREBASE_MESSAGING_SENDER_ID`
   - `FIREBASE_APP_ID`
   - `PREVIEW_WEBHOOK_SECRET` - Same value as in Cloud Functions
   - `PREVIEW_WEBHOOK_URL` - Your Cloud Functions URL for preview updates

2. **Enable GitHub Pages**:
   - Go to repository Settings → Pages
   - Build and deployment: GitHub Actions
   - The workflows will handle publishing to Pages

## Step 5: Run Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# In another terminal, optionally use Firebase Emulator for local testing
firebase emulators:start
```

## Step 6: Deployment

### Frontend
The app deploys automatically on `npm run build`:
- Builds the React app with Vite
- Runs type checks and linting
- Creates optimized production bundle in `dist/`

### Cloud Functions
Deploy when you make changes to `functions/`:
```bash
firebase deploy --only functions
```

### GitHub Pages
PR previews deploy automatically via GitHub Actions.

## Configuration

### Rate Limits
Adjust in `functions/src/index.ts`:
- `checkRateLimit("submissions-${clientIp}", 10, 86400)` - 10 submissions per day per IP
- Vote rate limit: 5 votes per minute per user (in `feedbackApi.ts`)

### LLM Model
Currently uses `gpt-3.5-turbo`. To change, edit `functions/src/index.ts`:
```typescript
model: "gpt-4-turbo" // or another model
```

### GitHub Labels
Labels used for status:
- `cf:public` - public feedback item
- `cf:type/feature` or `cf:type/bug`
- `cf:status/new` - newly created
- `cf:status/planned` - planned work
- `cf:status/in-progress` - currently being worked on
- `cf:status/preview` - preview available
- `cf:status/merged` - work completed and merged
- `cf:status/wontfix` - won't be implemented
- `cf:status/duplicate` - duplicate of another issue

## Troubleshooting

### Cloud Functions not running
- Check Firebase CLI is up to date: `firebase --version`
- Verify credentials in `.env`
- Check Firebase console for function errors: https://console.firebase.google.com/functions

### Firestore not accessible
- Check Firestore Rules in Firebase console
- Ensure Firestore is enabled and in test mode (for development)
- Verify API keys are correct

### GitHub Issues not created
- Verify GitHub token has `repo` scope
- Check Cloud Functions logs for errors
- Ensure repo owner/name are correct

### LLM not generating drafts
- Check OpenAI API key is valid
- Verify OpenAI account has credits
- Check Cloud Functions logs for API errors

## Next Steps

1. Create some demo feedback to test the flow
2. Link a GitHub issue to test status syncing
3. Create a PR to test preview generation
4. Monitor Cloud Functions logs for any issues
