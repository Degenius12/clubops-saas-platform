// Serverless function for user registration
// This will replace the /api/auth/register endpoint that's returning 404

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fullName, clubName, email, phone, password, confirmPassword } = req.body;

    // Basic validation
    if (!fullName || !clubName || !email || !password) {
      return res.status(400).json({ 
        error: 'Missing required fields: fullName, clubName, email, password' 
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ 
        error: 'Passwords do not match' 
      });
    }

    if (!email.includes('@')) {
      return res.status(400).json({ 
        error: 'Invalid email address' 
      });
    }

    // TODO: Replace with actual database integration
    // For now, return a mock successful response
    console.log('Registration attempt:', { fullName, clubName, email, phone });

    const mockUser = {
      id: Date.now().toString(),
      email,
      fullName,
      clubName,
      createdAt: new Date().toISOString(),
      status: 'pending_verification'
    };

    // Mock JWT token generation
    const mockToken = 'mock-jwt-token-' + Date.now();

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      user: mockUser,
      token: mockToken,
      club: {
        id: `club-${Date.now()}`,
        name: clubName,
        owner: fullName
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to create account'
    });
  }
}
