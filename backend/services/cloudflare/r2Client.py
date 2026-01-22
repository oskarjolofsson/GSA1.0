import os
from dotenv import load_dotenv
import boto3
from botocore.client import Config
from botocore.exceptions import ClientError

load_dotenv()
class R2Client:
    
    def __init__(self):
        self.bucket = os.getenv("CLOUDFLARE_R2_BUCKET")
        self.s3 = boto3.client(
            "s3",
            endpoint_url=os.getenv("S3_API"),
            aws_access_key_id=os.getenv("CLOUDFLARE_R2_ACCESS_KEY"),
            aws_secret_access_key=os.getenv("CLOUDFLARE_R2_SECRET_ACCESS_KEY"),
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
                Bucket=os.getenv("CLOUDFLARE_R2_BUCKET"),
                Key=key,
            )
            return True
        except ClientError as e:
            if e.response["Error"]["Code"] == "404":
                return False
            raise

    def get_object(self, key: str) -> bytes:
        response = self.s3.get_object(
            Bucket=os.getenv("CLOUDFLARE_R2_BUCKET"),
            Key=key,
        )
        return response["Body"].read()
    
    def delete_object(self, key: str) -> None:
        self.s3.delete_object(
            Bucket=os.getenv("CLOUDFLARE_R2_BUCKET"),
            Key=key,
        )
    
# Instantiate a single global R2 client
r2_client = R2Client()
