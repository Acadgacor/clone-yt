# 🎬 CineView: Professional Web Theater

CineView is a minimalist, high-performance web theater designed for an immersive viewing experience. It features a custom-built YouTube player interface with a "Liquid Glass" aesthetic, optimized for both curated content and high-stakes live streams.

## ✨ Key Features

- **Liquid Glass UI**: A premium, iPhone-inspired aesthetic using high-intensity backdrop blurs, translucent layering, and ultra-thin borders.
- **Advanced Live Stream Support**: 
    - **Live Badge**: An animated, pulsing indicator for real-time broadcasts.
    - **Manual Sync-to-Live**: A dedicated crystal-glass button to instantly catch up to the live edge after buffering.
- **Forced Resolution Control**: A professional-grade resolution selector (144p to 4K) that "locks" your preferred quality, preventing YouTube's adaptive bitrate from downgrading your experience.
- **Cinema Mode Experience**: 
    - Auto-hiding controls for distraction-free viewing.
    - Enhanced "Cinema Glow" background effect for visual depth.
    - Responsive layout for Desktop, Tablet, and Mobile.
- **Instant Administration**: A dedicated settings page to update the featured video URL and title in real-time via Firebase Firestore.

## 🛠️ Tech Stack

- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **UI Components**: [ShadCN UI](https://ui.shadcn.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Database**: [Firebase Firestore](https://firebase.google.com/)
- **Player API**: [YouTube IFrame Player API](https://developers.google.com/youtube/iframe_api_reference)
- **Icons**: [Lucide React](https://lucide.dev/)

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+ 
- A Firebase Project

### 2. Configuration
Create a `.env.local` file or update `src/firebase/config.ts` with your Firebase credentials:

```typescript
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 3. Setup Firestore
Ensure your Firestore Security Rules allow public access to the settings collection (or as per your security requirements):

```javascript
service cloud.firestore {
  match /databases/{database}/documents {
    match /settings/theater {
      allow read, write: if true;
    }
  }
}
```

### 4. Installation & Development
```bash
npm install
npm run dev
```

Open [http://localhost:9002](http://localhost:9002) to view the theater.

## 📱 Mobile Experience
CineView is fully optimized for mobile devices. The "Liquid Glass" controls are scaled for touch interactions, and the layout adjusts dynamically to provide the best possible viewing experience on smaller screens.

## 📄 License
This project is for personal use and portfolio demonstration. Built with ❤️ for the art of cinema.
