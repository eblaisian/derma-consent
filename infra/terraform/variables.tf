variable "tenancy_ocid" {
  description = "OCI Tenancy OCID"
  type        = string
}

variable "user_ocid" {
  description = "OCI User OCID"
  type        = string
}

variable "fingerprint" {
  description = "OCI API key fingerprint"
  type        = string
}

variable "private_key" {
  description = "OCI API private key (PEM contents)"
  type        = string
  sensitive   = true
}

variable "oci_region" {
  description = "OCI region"
  type        = string
  default     = "eu-frankfurt-1"
}

variable "oci_namespace" {
  description = "OCI Object Storage namespace (tenancy namespace)"
  type        = string
}

variable "compartment_ocid" {
  description = "OCI Compartment OCID for all resources"
  type        = string
}

variable "kubernetes_version" {
  description = "OKE Kubernetes version"
  type        = string
  default     = "v1.30.1"
}

variable "node_shape" {
  description = "Compute shape for worker nodes"
  type        = string
  default     = "VM.Standard.A1.Flex"
}

variable "node_ocpus" {
  description = "Number of OCPUs for the ARM A1 node"
  type        = number
  default     = 4
}

variable "node_memory_gb" {
  description = "Memory in GB for the ARM A1 node"
  type        = number
  default     = 24
}

variable "node_pool_size" {
  description = "Number of worker nodes"
  type        = number
  default     = 1
}

variable "vcn_cidr" {
  description = "CIDR block for the VCN"
  type        = string
  default     = "10.0.0.0/16"
}

variable "node_image_id" {
  description = "OCI image OCID for ARM A1 nodes (Oracle Linux 8 aarch64). Find via: oci compute image list --compartment-id <OCID> --shape VM.Standard.A1.Flex"
  type        = string
}

variable "ssh_public_key" {
  description = "SSH public key for node access (optional)"
  type        = string
  default     = ""
}
