import AWS from 'aws-sdk';

const dynamodb = new AWS.DynamoDB.DocumentClient({
  region: process.env.AWS_REGION || 'us-east-1'
});

const TESTIMONIALS_TABLE = 'portfolio-testimonials';

export const getTestimonials = async () => {
  try {
    const params = {
      TableName: TESTIMONIALS_TABLE,
      ScanIndexForward: false,
    };
    const result = await dynamodb.scan(params).promise();
    return result.Items || [];
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    throw error;
  }
};

export const getTestimonialById = async (id) => {
  try {
    const params = {
      TableName: TESTIMONIALS_TABLE,
      Key: { id }
    };
    const result = await dynamodb.get(params).promise();
    return result.Item;
  } catch (error) {
    console.error('Error fetching testimonial:', error);
    throw error;
  }
};

export const createTestimonial = async (testimonial) => {
  try {
    const params = {
      TableName: TESTIMONIALS_TABLE,
      Item: {
        id: testimonial.id,
        author: testimonial.author,
        content: testimonial.content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        approved: false,
        ...testimonial
      }
    };
    await dynamodb.put(params).promise();
    return params.Item;
  } catch (error) {
    console.error('Error creating testimonial:', error);
    throw error;
  }
};

export const updateTestimonial = async (id, testimonial) => {
  try {
    const updateExpression = [];
    const expressionAttributeValues = {};
    
    Object.keys(testimonial).forEach((key, index) => {
      updateExpression.push(`${key} = :val${index}`);
      expressionAttributeValues[`:val${index}`] = testimonial[key];
    });
    
    updateExpression.push('updatedAt = :updated');
    expressionAttributeValues[':updated'] = new Date().toISOString();
    
    const params = {
      TableName: TESTIMONIALS_TABLE,
      Key: { id },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    };
    
    const result = await dynamodb.update(params).promise();
    return result.Attributes;
  } catch (error) {
    console.error('Error updating testimonial:', error);
    throw error;
  }
};

export const deleteTestimonial = async (id) => {
  try {
    const params = {
      TableName: TESTIMONIALS_TABLE,
      Key: { id }
    };
    await dynamodb.delete(params).promise();
  } catch (error) {
    console.error('Error deleting testimonial:', error);
    throw error;
  }
};
