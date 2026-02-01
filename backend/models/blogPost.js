import AWS from 'aws-sdk';

const dynamodb = new AWS.DynamoDB.DocumentClient({
  region: process.env.AWS_REGION || 'us-east-1'
});

const BLOG_TABLE = 'portfolio-blog-posts';

export const getBlogPosts = async () => {
  try {
    const params = {
      TableName: BLOG_TABLE,
      ScanIndexForward: false, // Sort by date descending
    };
    const result = await dynamodb.scan(params).promise();
    return result.Items || [];
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    throw error;
  }
};

export const getBlogPostById = async (id) => {
  try {
    const params = {
      TableName: BLOG_TABLE,
      Key: { id }
    };
    const result = await dynamodb.get(params).promise();
    return result.Item;
  } catch (error) {
    console.error('Error fetching blog post:', error);
    throw error;
  }
};

export const createBlogPost = async (post) => {
  try {
    const params = {
      TableName: BLOG_TABLE,
      Item: {
        id: post.id,
        title: post.title,
        content: post.content,
        author: post.author,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...post
      }
    };
    await dynamodb.put(params).promise();
    return params.Item;
  } catch (error) {
    console.error('Error creating blog post:', error);
    throw error;
  }
};

export const updateBlogPost = async (id, post) => {
  try {
    const updateExpression = [];
    const expressionAttributeValues = {};
    
    Object.keys(post).forEach((key, index) => {
      updateExpression.push(`${key} = :val${index}`);
      expressionAttributeValues[`:val${index}`] = post[key];
    });
    
    updateExpression.push('updatedAt = :updated');
    expressionAttributeValues[':updated'] = new Date().toISOString();
    
    const params = {
      TableName: BLOG_TABLE,
      Key: { id },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    };
    
    const result = await dynamodb.update(params).promise();
    return result.Attributes;
  } catch (error) {
    console.error('Error updating blog post:', error);
    throw error;
  }
};

export const deleteBlogPost = async (id) => {
  try {
    const params = {
      TableName: BLOG_TABLE,
      Key: { id }
    };
    await dynamodb.delete(params).promise();
  } catch (error) {
    console.error('Error deleting blog post:', error);
    throw error;
  }
};
