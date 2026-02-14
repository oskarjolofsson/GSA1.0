import boto3
from botocore.client import Config
from botocore.exceptions import ClientError
from ...config import R2_BUCKET, R2_ENDPOINT, R2_ACCESS_KEY, R2_SECRET_KEY

class R2Client:
    
    def __init__(self):
        self.bucket = R2_BUCKET
        self.s3 = boto3.client(
            "s3",
            endpoint_url=R2_ENDPOINT,
            aws_access_key_id=R2_ACCESS_KEY,
            aws_secret_access_key=R2_SECRET_KEY,
            region_name="auto",
            config=Config(signature_version="s3v4"),
        )

    def generate_signed_url(self, method: str, key: str, expires_in: int) -> str:
        return self.s3.generate_presigned_url(
            ClientMethod=method,
            Params={"Bucket": self.bucket, "Key": key},
            ExpiresIn=expires_in,
        )

    def head_object(self, key: str) -> bool:
        try:
            self.s3.head_object(
                Bucket=self.bucket,
                Key=key,
            )
            return True
        except ClientError as e:
            if e.response["Error"]["Code"] == "404":
                return False
            raise

    def get_object(self, key: str) -> bytes:
        response = self.s3.get_object(
            Bucket=self.bucket,
            Key=key,
        )
        return response["Body"].read()
    
    def delete_object(self, key: str) -> None:
        self.s3.delete_object(
            Bucket=self.bucket,
            Key=key,
        )
        
    def put_object(self, key: str, data: bytes, content_type: str = "application/octet-stream") -> None:
        self.s3.put_object(
            Bucket=self.bucket,
            Key=key,
            Body=data,
            ContentType=content_type,
        )
    
# Instantiate a single global R2 client
r2_client = R2Client()
