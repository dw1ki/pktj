// Debug file to verify environment variables are loaded correctly

if (typeof window !== 'undefined' && import.meta.env.DEV) {
  console.log('🔍 DEBUG MODE - Environment Variables:', {
    VITE_API_URL: import.meta.env.VITE_API_URL,
    VITE_YOLO_API_URL: import.meta.env.VITE_YOLO_API_URL,
    MODE: import.meta.env.MODE,
    PROD: import.meta.env.PROD,
  });
}

