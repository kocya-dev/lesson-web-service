import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

// import * as sqs from 'aws-cdk-lib/aws-sqs';
import {
  Stack,
  StackProps,
  aws_s3,
  aws_cloudfront,
  aws_cloudfront_origins,
  aws_s3_deployment,
  aws_iam,
  RemovalPolicy,
  Duration,
} from 'aws-cdk-lib';

export class WebAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3
    const s3Bucket : aws_s3.Bucket = this.createS3Bucket();
    // S3へのデプロイ
    this.deployResourceToS3(s3Bucket);
  }

  private deployResourceToS3(s3Bucket: cdk.aws_s3.Bucket, ) {
    new aws_s3_deployment.BucketDeployment(this, 'WebsiteDeploy', {
      sources: [
        aws_s3_deployment.Source.data(
          '/index.html',
          '<html><body><h1>Hello World</h1></body></html>'
        ),
        aws_s3_deployment.Source.data(
          '/error.html',
          '<html><body><h1>Error!!!!!!!!!!!!!</h1></body></html>'
        ),
      ],
      destinationBucket: s3Bucket,
      distributionPaths: ['/*'],
    });
  }

  private createS3Bucket() : aws_s3.Bucket{
    const websiteBucket = new aws_s3.Bucket(this, 'DataSourceBucket', {
      removalPolicy: RemovalPolicy.DESTROY,
    });

    return websiteBucket;
  }  
}
