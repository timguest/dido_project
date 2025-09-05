export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { username, password } = req.body;

  // Get credentials from environment variables
  const validUsername = process.env.ADMIN_USERNAME;
  const validPassword = process.env.ADMIN_PASSWORD;

  // Check if environment variables are set
  if (!validUsername || !validPassword) {
    console.error('ADMIN_USERNAME or ADMIN_PASSWORD not set in environment variables');
    return res.status(500).json({ message: 'Server configuration error' });
  }

  // Validate credentials
  if (username === validUsername && password === validPassword) {
    // In a real app, you'd use proper JWT tokens or sessions
    // For MVP, we'll use a simple approach with a session token
    const sessionToken = Buffer.from(`${username}:${Date.now()}`).toString('base64');

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token: sessionToken
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Onjuiste gebruikersnaam of wachtwoord'
    });
  }
}