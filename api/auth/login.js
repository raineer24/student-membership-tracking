module.exports = (req, res) => {
  const { url, method } = req;

  if (url.endsWith('/login') && method === 'POST') {
    // Handle login
    return res.status(200).json({ message: 'Login successful' });
  }

  if (url.endsWith('/register') && method === 'POST') {
    // Handle register
    return res.status(200).json({ message: 'Register successful' });
  }

  res.status(404).json({ message: 'Not found' });
};
