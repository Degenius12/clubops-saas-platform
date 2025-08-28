// Serverless function for user login

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
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }

    // TODO: Replace with actual database authentication
    // For now, accept any valid email/password combination
    console.log('Login attempt:', email);

    // Mock authentication - accept any email with password length > 6
    if (password.length < 6) {
      return res.status(401).json({ 
        error: 'Invalid credentials' 
      });
    }

    const mockUser = {
      id: 'user-123',
      email,
      firstName: email.split('@')[0],
      lastName: 'Manager',
      clubs: [{
        id: 'club-123',
        name: 'Demo Club',
        role: 'owner'
      }]
    };

    const mockToken = 'mock-jwt-token-' + Date.now();

    return res.status(200).json({
      success: true,
      token: mockToken,
      user: mockUser
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Login failed'
    });
  }
}
