// Serverless function for health check
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Club-ID');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    res.status(200).json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      message: 'ClubOps Backend API is running',
      environment: 'production'
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(503).json({ 
      status: 'error', 
      message: 'Service unavailable',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
