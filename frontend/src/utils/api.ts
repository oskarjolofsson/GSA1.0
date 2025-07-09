interface AnalysisResponse {
  summary: string;
  drills: Array<{
    title: string;
    description: string;
  }>;
  keyframes: string[];
}

// Base URL for the backend API - update this when you deploy your backend
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const analyzeSwing = async (videoFile: File): Promise<AnalysisResponse> => {
  const formData = new FormData();
  formData.append('video', videoFile);

  try {
    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API call failed:', error);
    
    // For development/demo purposes, return mock data if API fails
    // Remove this when you have a working backend
    return getMockAnalysisData();
  }
};

// Mock data for development - remove when backend is ready
const getMockAnalysisData = (): AnalysisResponse => {
  return {
    summary: "Your swing shows good fundamentals with a few areas for improvement. The main issue is early extension during the downswing, where your hips move toward the ball. This reduces power and can cause inconsistent contact. Your backswing plane is slightly steep, which contributes to an over-the-top move. Focus on maintaining your spine angle and improving your swing plane for better results.",
    drills: [
      {
        title: "Wall Drill",
        description: "Stand with your back against a wall during practice swings. This helps maintain spine angle and prevents early extension by keeping your hips back."
      },
      {
        title: "Swing Plane Trainer",
        description: "Use an alignment stick or club laid across your shoulders during practice swings to feel the correct shoulder turn and swing plane."
      },
      {
        title: "Impact Position Hold",
        description: "Practice holding your impact position for 5 seconds to build muscle memory for proper body positions at contact."
      }
    ],
    keyframes: [
      // These would be actual URLs from your backend/Firebase storage
      // For now, they're placeholder URLs that won't load
      "https://example.com/frame1.jpg",
      "https://example.com/frame2.jpg",
      "https://example.com/frame3.jpg"
    ]
  };
};
