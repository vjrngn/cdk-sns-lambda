import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as lambda from 'aws-cdk-lib/aws-lambda';

import * as path from 'path';
import { LambdaSubscription } from 'aws-cdk-lib/aws-sns-subscriptions';

export class SnsLambdaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const orderNotificationsTopics = new sns.Topic(this, 'OrderNotificationsTopic', {
      topicName: 'OrderNotificationsTopic',
      fifo: false,
    });

    const highPriorityLambdaPath = path.resolve(__dirname, 'lambda', 'HighPriorityLambda', 'src');
    const highPriorityLambda = new lambda.Function(this, 'HighPriorityLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset(highPriorityLambdaPath),
      handler: 'index.handler'
    });

    const lowPriorityLambdaPath = path.resolve(__dirname, 'lambda', 'LowPriorityLambda', 'src');
    const lowPriorityLambda = new lambda.Function(this, 'LowPriorityLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset(lowPriorityLambdaPath),
      handler: 'index.handler'
    });

    orderNotificationsTopics.addSubscription(new LambdaSubscription(highPriorityLambda, {
      filterPolicyWithMessageBody: {
        priority: sns.FilterOrPolicy.filter(
          sns.SubscriptionFilter.stringFilter({ allowlist: ['high'] })
        )
      }
    }));

    orderNotificationsTopics.addSubscription(new LambdaSubscription(lowPriorityLambda, {
      filterPolicyWithMessageBody: {
        priority: sns.FilterOrPolicy.filter(
          sns.SubscriptionFilter.stringFilter({ allowlist: ['low'] })
        )
      }
    }));
  }
}
