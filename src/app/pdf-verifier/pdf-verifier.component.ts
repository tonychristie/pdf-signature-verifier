import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import verifyPDF, { getCertificatesInfoFromPDF } from "@ninja-labs/verify-pdf";

interface SignatureInfo {
  name: string;
  date: string;
  reason: string;
  isValid: boolean;
  location?: string;
}

interface SimplifiedCertInfo {
  issuedTo: string;
  issuedBy: string;
  validFrom: Date;
  validTo: Date;
}

@Component({
  selector: "app-pdf-verifier",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./pdf-verifier.component.html",
  styleUrls: ["./pdf-verifier.component.css"]
})
export class PdfVerifierComponent {
  signatureInfo: SignatureInfo | null = null;
  certificateInfo: SimplifiedCertInfo[] = [];
  error: string | null = null;
  loading = false;

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) {
      return;
    }

    this.loading = true;
    this.error = null;
    this.signatureInfo = null;
    this.certificateInfo = [];

    const file = input.files[0];
    try {
      const arrayBuffer = await file.arrayBuffer();
      const fileBuffer = new Uint8Array(arrayBuffer);

      // Get signature verification
      const verification = await verifyPDF(fileBuffer);
      console.log(
        "Verification result:",
        JSON.stringify(verification, null, 2)
      );

      if (verification.signatures && verification.signatures.length > 0) {
        const signature = verification.signatures[0];
        console.log("Found signature:", JSON.stringify(signature, null, 2));

        // Get the signing certificate (first certificate in the chain)
        const signingCert = signature.meta?.certs?.[0];

        this.signatureInfo = {
          name:
            signingCert?.issuedTo?.commonName ||
            signingCert?.issuedTo?.organizationName ||
            "Unknown",
          // No timestamp in current structure, using cert valid from date
          date: new Date(
            signingCert?.validityPeriod?.notBefore || ""
          ).toLocaleString(),
          reason: signature.meta?.signatureMeta?.reason || "Not specified",
          isValid: signature.verified === true && signature.integrity === true,
          location: signature.meta?.signatureMeta?.location || undefined
        };
        console.log("Processed signature info:", this.signatureInfo);
      } else {
        console.log("No signatures found in verification result");
        this.error = "No digital signature found in the PDF";
      }

      // Get certificate information
      try {
        console.log("Getting certificates...");
        const certificates = await getCertificatesInfoFromPDF(fileBuffer);
        console.log("Raw certificate response:", certificates);

        if (
          Array.isArray(certificates) &&
          certificates.length > 0 &&
          Array.isArray(certificates[0])
        ) {
          console.log("Number of certificates found:", certificates[0].length);

          this.certificateInfo = certificates[0].map(cert => ({
            issuedTo: this.formatEntityName(cert.issuedTo),
            issuedBy: this.formatEntityName(cert.issuedBy),
            validFrom: new Date(cert.validityPeriod.notBefore),
            validTo: new Date(cert.validityPeriod.notAfter)
          }));
        } else {
          console.log("Unexpected certificate format:", typeof certificates);
          this.certificateInfo = [];
        }
      } catch (certError) {
        console.warn("Error getting certificate details:", certError);
        // Don't set error - we still have signature info
      }
    } catch (err) {
      this.error =
        "Error verifying PDF signature: " +
        (err instanceof Error ? err.message : String(err));
      this.signatureInfo = null;
      this.certificateInfo = [];
    } finally {
      this.loading = false;
    }
  }

  private formatEntityName(entity: any): string {
    if (!entity) return "Not available";

    const parts = [];
    if (entity.commonName) parts.push(entity.commonName);
    if (
      entity.organizationName &&
      entity.organizationName !== entity.commonName
    ) {
      parts.push(entity.organizationName);
    }
    if (entity.countryName) parts.push(`(${entity.countryName})`);

    return parts.length > 0 ? parts.join(" ") : "Not available";
  }

  formatDate(date: Date | undefined): string {
    if (!date || isNaN(date.getTime())) return "Not available";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  }
}
