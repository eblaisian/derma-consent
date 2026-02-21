output "cluster_id" {
  description = "OKE cluster OCID"
  value       = oci_containerengine_cluster.main.id
}

output "cluster_endpoint" {
  description = "OKE cluster Kubernetes API endpoint"
  value       = oci_containerengine_cluster.main.endpoints[0].kubernetes
}

output "node_pool_id" {
  description = "OKE node pool OCID"
  value       = oci_containerengine_node_pool.arm_pool.id
}

output "vcn_id" {
  description = "VCN OCID"
  value       = oci_core_vcn.main.id
}

output "backup_bucket" {
  description = "Object Storage bucket for PG backups (production)"
  value       = oci_objectstorage_bucket.pg_backups.name
}

output "backup_bucket_staging" {
  description = "Object Storage bucket for PG backups (staging)"
  value       = oci_objectstorage_bucket.pg_backups_staging.name
}

output "ocir_url" {
  description = "OCIR registry URL"
  value       = "${var.oci_region}.ocir.io/${var.oci_namespace}/derma-consent"
}

output "kubeconfig_command" {
  description = "Command to configure kubectl"
  value       = "oci ce cluster create-kubeconfig --cluster-id ${oci_containerengine_cluster.main.id} --region ${var.oci_region} --file $HOME/.kube/config --token-version 2.0.0"
}
