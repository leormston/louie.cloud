import AWS from 'aws-sdk';

const cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider({
  region: process.env.AWS_REGION || 'us-east-1'
});

export const verifyToken = async (token) => {
  try {
    const params = {
      AccessToken: token
    };
    const user = await cognitoIdentityServiceProvider.getUser(params).promise();
    return user;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
};

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    const user = await verifyToken(token);

    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const roleCheck = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userGroups = req.user.GroupConfiguration?.GroupsToOverride || [];
    const hasRole = allowedRoles.some(role => userGroups.includes(role));

    if (!hasRole && allowedRoles.length > 0) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    next();
  };
};

export const errorHandler = (err, req, res, next) => {
  console.error(err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};
