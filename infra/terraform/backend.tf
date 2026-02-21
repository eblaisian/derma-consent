# S3-compatible backend using OCI Object Storage.
# The endpoint must be configured via -backend-config at init time since
# variables are not allowed in backend blocks.
#
# Initialize with:
#   terraform init \
#     -backend-config="endpoint=https://<namespace>.compat.objectstorage.<region>.oraclecloud.com" \
#     -backend-config="access_key=<OCI_S3_ACCESS_KEY>" \
#     -backend-config="secret_key=<OCI_S3_SECRET_KEY>"

terraform {
  backend "s3" {
    bucket = "derma-consent-tfstate"
    key    = "terraform.tfstate"
    region = "eu-frankfurt-1"

    skip_region_validation      = true
    skip_credentials_validation = true
    skip_requesting_account_id  = true
    skip_metadata_api_check     = true
    skip_s3_checksum            = true
    use_path_style              = true
  }
}
