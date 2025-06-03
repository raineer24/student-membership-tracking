// api/dashboard/[[...slug]].js
const { withAuth } = require('../../utils/auth');

async function dashboardHandler(req, res) {
  const { slug = [] } = req.query;
  const path = Array.isArray(slug) ? slug.join('/') : slug;
  
  // Handle different dashboard endpoints
  switch(req.method) {
    case 'GET':
      return handleGet(req, res, path);
    case 'POST':
      return handlePost(req, res, path);
    case 'PUT':
      return handlePut(req, res, path);
    case 'DELETE':
      return handleDelete(req, res, path);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleGet(req, res, path) {
  const { user } = req; // Available from auth middleware
  
  switch(path) {
    case '':
    case undefined:
      // Base dashboard endpoint: GET /api/dashboard
      return res.json({
        message: 'Admin Dashboard',
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        },
        timestamp: new Date().toISOString()
      });
      
    case 'stats':
      // Dashboard statistics: GET /api/dashboard/stats
      return res.json({
        students: {
          total: 0,
          active: 0,
          inactive: 0
        },
        memberships: {
          total: 0,
          active: 0,
          expired: 0
        },
        payments: {
          total: 0,
          thisMonth: 0,
          revenue: 0
        }
      });
      
    case 'overview':
      // Dashboard overview: GET /api/dashboard/overview
      return res.json({
        summary: {
          totalStudents: 0,
          activeMemberships: 0,
          monthlyRevenue: 0,
          pendingPayments: 0
        },
        recentActivity: []
      });
      
    default:
      return res.status(404).json({ 
        error: `Dashboard endpoint '${path}' not found`,
        availableEndpoints: ['/', '/stats', '/overview']
      });
  }
}

async function handlePost(req, res, path) {
  return res.status(501).json({ error: 'POST operations not implemented yet' });
}

async function handlePut(req, res, path) {
  return res.status(501).json({ error: 'PUT operations not implemented yet' });
}

async function handleDelete(req, res, path) {
  return res.status(501).json({ error: 'DELETE operations not implemented yet' });
}

// Export the handler wrapped with auth middleware
// ✅ Protected with allowedRoles={["ADMIN"]}
export default withAuth(dashboardHandler, { 
  allowedRoles: ['ADMIN'] 
});