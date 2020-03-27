const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient();

const TableName = 'SampleTable';
const PartitionKey = 'igGridSample';
const ScanCount = 200;

exports.handler = async (event, context) => {
  
  switch (event.httpMethod) {
    case 'GET':
      let totalCount;
      try {
        const params = {
          TableName: TableName,
          Select: 'COUNT'
        };
        totalCount = await docClient.scan(params).promise();
        console.info('Count RESULT:', totalCount.Count);
      }
      catch (err) {
        console.error(err);
        throw err
      }

      try {
        const params = {
          TableName: TableName,
          Limit: ScanCount
        };
        if (!!event.queryStringParameters && !!event.queryStringParameters['limit'] && parseInt(event.queryStringParameters['limit'], 10) > 0) {
          params.Limit = parseInt(event.queryStringParameters['limit'], 10);
        }
        if (!!event.queryStringParameters && !!event.queryStringParameters['exclusivestartkey']) {
          params.ExclusiveStartKey = JSON.parse(querystring.unescape(event.queryStringParameters['exclusivestartkey']));
        }

        const result = await docClient.scan(params).promise();
        console.info('Scan RESULT:', result);
        
        const response = {
          statusCode: 200,
          headers: {
            "Access-Control-Allow-Origin": "*"
          },
          body: JSON.stringify({
            Count: result.Count,
            ScannedCount: result.ScannedCount,
            TotalCount: totalCount.Count,
            Items: result.Items,
            LastEvaluatedKey: result.LastEvaluatedKey
          })
        };
        return response;
      }
      catch (err) {
        console.error(err);
        throw err
      }
      break;

    case 'PUT':
      try {
        if (typeof(event.body)==='string') event.body = JSON.parse(event.body);
        
        const params = {
          TableName: TableName,
          Key:{
            Partition: PartitionKey,
            Index: event.body.Index
          },
          ExpressionAttributeValues: {
            ":label": event.body.Label,
            ":updateAt": (new Date()).toISOString()
          },
          UpdateExpression: 'SET Label=:label, UpdateAt=:updateAt',
          ReturnValues: 'ALL_NEW'
        };

        const result = await docClient.update(params).promise();
        console.info('Update RESULT:', result);
        
        const response = {
          statusCode: 200,
          headers: {
            "Access-Control-Allow-Origin": "*"
          },
          body: JSON.stringify(result)
        };
        return response;
      }
      catch (err) {
        console.error(err);
        throw err
      }
      break;

    default:
      throw new Error('Unknown operation: ${operation}');
  }
};
