const sprintf = require('sprintf-js').sprintf;
const _ = require('lodash');
const Hashids = require('hashids/cjs');
const AWS = require('aws-sdk');

//https://docs.aws.amazon.com/ja_jp/sdk-for-javascript/v2/developer-guide/setting-credentials-node.html
//AWS.config.update({accessKeyId: '...', secretAccessKey: '...', region:'ap-northeast-1'});

const SampleRecordCount = 200;
const DynamoDbSampleTable = {
  TableName: 'SampleTable',
  AttributeDefinitions: [
    { AttributeName: 'Partition', AttributeType: 'S' },
    { AttributeName: 'Index', AttributeType: 'N' }
  ],
  KeySchema: [
    { AttributeName: 'Partition', KeyType: 'HASH' }, // Partition key
    { AttributeName: 'Index', KeyType: 'RANGE' } // Sort key
  ],
  ProvisionedThroughput: {
    ReadCapacityUnits: 5,
    WriteCapacityUnits: 5
  }
};
const PartitionKey = 'igGridSample';

(async () => {
  const dynamodb = new AWS.DynamoDB();
  const hashids = new Hashids('', 16, '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ');

  try {
    await dynamodb.deleteTable({ TableName: DynamoDbSampleTable.TableName }).promise();
    console.log('deleteTable:', DynamoDbSampleTable.TableName);
    await dynamodb.waitFor('tableNotExists', { TableName: DynamoDbSampleTable.TableName }).promise();
  }
  catch (err) {
    console.error(err);
  }

  try {
    const result = await dynamodb.createTable(DynamoDbSampleTable).promise();
    console.log('createTable:', DynamoDbSampleTable.TableName);
    await dynamodb.waitFor('tableExists', { TableName: DynamoDbSampleTable.TableName }).promise();
  }
  catch (err) {
    if (_.get(err, 'name') !== 'ResourceInUseException'){
      console.error('createTable ERROR', err);
      return;
    }
  }

  for (let idx = 0; idx < SampleRecordCount; idx++) {
    const now = new Date();
    const item = {
      Partition: {S: PartitionKey},
      Index: {N: idx.toString()},
      Hash: {S: hashids.encode(idx, now.getTime())},
      Label: {S: sprintf('Label_%08d', idx)},
      CreateAt: {S: now.toISOString()},
      UpdateAt: {NULL: true}
    };
    console.log('putItem:', JSON.stringify(item));

    try {
      dynamodb.putItem({ TableName: DynamoDbSampleTable.TableName, Item: item }, ()=>{});
    }
    catch (err) {
      console.error('putItem ERROR', err);
      return;
    }
  }

  console.log('finish.');
})();
