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

export class ApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3
    const s3Bucket : aws_s3.Bucket = this.createS3Bucket();

    const originAccessIdentity = this.createCloudFrontAccessIdentity();

    const s3BucketPolicyStatement = this.createIamPolicyStatement(originAccessIdentity, s3Bucket);

    s3Bucket.addToResourcePolicy(s3BucketPolicyStatement);

    const distribution = this.createCloudFrontDistribution(s3Bucket, originAccessIdentity);

    this.deployResourceToS3(s3Bucket, distribution);
  }

  private deployResourceToS3(s3Bucket: cdk.aws_s3.Bucket, distribution: cdk.aws_cloudfront.Distribution) {
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
        aws_s3_deployment.Source.data('/favicon.ico', ''),
      ],
      destinationBucket: s3Bucket,
      distribution: distribution,
      distributionPaths: ['/*'],
    });
  }

  private createCloudFrontDistribution(s3Bucket: cdk.aws_s3.Bucket, originAccessIdentity: cdk.aws_cloudfront.OriginAccessIdentity) {
    return new aws_cloudfront.Distribution(this, 'distribution', {
      comment: 'website-distribution',
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          ttl: Duration.seconds(300),
          httpStatus: 403,
          responseHttpStatus: 403,
          responsePagePath: '/error.html',
        },
        {
          ttl: Duration.seconds(300),
          httpStatus: 404,
          responseHttpStatus: 404,
          responsePagePath: '/error.html',
        },
      ],
      defaultBehavior: {
        allowedMethods: aws_cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        cachedMethods: aws_cloudfront.CachedMethods.CACHE_GET_HEAD,
        cachePolicy: aws_cloudfront.CachePolicy.CACHING_OPTIMIZED,
        viewerProtocolPolicy: aws_cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        origin: new aws_cloudfront_origins.S3Origin(s3Bucket, {
          originAccessIdentity,
        }),
      },
      priceClass: aws_cloudfront.PriceClass.PRICE_CLASS_ALL,
    });
  }

  private createIamPolicyStatement(originAccessIdentity: cdk.aws_cloudfront.OriginAccessIdentity, websiteBucket: cdk.aws_s3.Bucket) {
    return new aws_iam.PolicyStatement({
      actions: ['s3:GetObject'],
      effect: aws_iam.Effect.ALLOW,
      principals: [
        new aws_iam.CanonicalUserPrincipal(
          originAccessIdentity.cloudFrontOriginAccessIdentityS3CanonicalUserId
        ),
      ],
      resources: [`${websiteBucket.bucketArn}/*`],
    });
  }

  private createCloudFrontAccessIdentity() : aws_cloudfront.OriginAccessIdentity {
    return new aws_cloudfront.OriginAccessIdentity(
      this,
      'OriginAccessIdentity',
      {
        comment: 'website-distribution-originAccessIdentity',
      }
    );
  }

  private createS3Bucket() : aws_s3.Bucket{
    const websiteBucket = new aws_s3.Bucket(this, 'WebsiteBucket', {
      removalPolicy: RemovalPolicy.DESTROY,
    });

    return websiteBucket;
  }  
}
