# --- Object Storage for PostgreSQL backups (Production) ---

resource "oci_objectstorage_bucket" "pg_backups" {
  compartment_id = var.compartment_ocid
  namespace      = var.oci_namespace
  name           = "derma-consent-pg-backups"
  access_type    = "NoPublicAccess"
  auto_tiering   = "Disabled"

  versioning = "Disabled"
}

# Auto-delete production backups older than 30 days
resource "oci_objectstorage_object_lifecycle_policy" "backup_cleanup" {
  namespace = var.oci_namespace
  bucket    = oci_objectstorage_bucket.pg_backups.name

  rules {
    name      = "delete-old-backups"
    action    = "DELETE"
    is_enabled = true
    time_amount = 30
    time_unit   = "DAYS"

    target = "objects"
  }
}

# --- Object Storage for PostgreSQL backups (Staging) ---

resource "oci_objectstorage_bucket" "pg_backups_staging" {
  compartment_id = var.compartment_ocid
  namespace      = var.oci_namespace
  name           = "derma-consent-pg-backups-staging"
  access_type    = "NoPublicAccess"
  auto_tiering   = "Disabled"

  versioning = "Disabled"
}

# Auto-delete staging backups older than 7 days
resource "oci_objectstorage_object_lifecycle_policy" "backup_cleanup_staging" {
  namespace = var.oci_namespace
  bucket    = oci_objectstorage_bucket.pg_backups_staging.name

  rules {
    name      = "delete-old-backups"
    action    = "DELETE"
    is_enabled = true
    time_amount = 7
    time_unit   = "DAYS"

    target = "objects"
  }
}
