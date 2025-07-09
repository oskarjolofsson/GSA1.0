# Golf Swing Analyzer - Frontend

A React-based frontend for the Golf Swing Analyzer project, built with TypeScript and TailwindCSS.

## Features

- **Video Upload**: Drag-and-drop interface for golf swing videos
- **Video Preview**: Preview uploaded videos before analysis
- **Analysis Results**: Display AI-generated swing analysis and recommendations
- **Responsive Design**: Mobile-friendly interface with TailwindCSS
- **Loading States**: Professional loading overlays during processing

## Tech Stack

- React 18 with TypeScript
- React Router for navigation
- TailwindCSS for styling
- React Dropzone for file uploads
- React Player for video playback

## Setup Instructions

### Prerequisites

1. Install Node.js (version 16 or higher):
   - Download from [nodejs.org](https://nodejs.org/)
   - Or install via Homebrew: `brew install node`

### Installation

1. Navigate to the project directory:
   ```bash
   cd golf-swing-analyzer-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open your browser and go to `http://localhost:3000`

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Header.tsx      # Navigation header
│   ├── Footer.tsx      # Page footer
│   ├── VideoUpload.tsx # Drag-and-drop upload
│   ├── VideoPreview.tsx # Video preview with controls
│   ├── LoadingOverlay.tsx # Loading spinner overlay
│   └── AnalysisResults.tsx # Results display
├── pages/              # Route-based components
│   ├── Home.tsx        # Upload page
│   └── Results.tsx     # Analysis results page
├── utils/              # Helper functions
│   └── api.ts          # API calls to backend
├── App.tsx             # Main app component
├── index.tsx           # React entry point
└── index.css           # Global styles
```

## Usage

1. **Upload Video**: Drag and drop a golf swing video or click to select
2. **Preview**: Review your video before submitting for analysis
3. **Analyze**: Click "Analyze My Swing" to process the video
4. **Results**: View your personalized feedback and drill recommendations

## API Integration

The frontend expects a backend API running on `http://localhost:8000` with the following endpoint:

- `POST /upload` - Accepts video file and returns analysis results

The API response should match this format:
```json
{
  "summary": "Analysis text...",
  "drills": [
    {
      "title": "Drill Name",
      "description": "Drill description..."
    }
  ],
  "keyframes": [
    "https://example.com/frame1.jpg",
    "https://example.com/frame2.jpg"
  ]
}
```

## Development Notes

- Currently includes mock data for testing without backend
- Remove mock data from `src/utils/api.ts` when backend is ready
- Configure `REACT_APP_API_URL` environment variable for production API URL

## Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm eject` - Eject from Create React App (not recommended)

## Next Steps

1. Install Node.js if not already installed
2. Run `npm install` to install dependencies
3. Start development server with `npm start`
4. Test the interface with mock data
5. Connect to backend API when ready
