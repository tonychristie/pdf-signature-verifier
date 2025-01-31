declare module "@ninja-labs/verify-pdf" {
  interface EntityInfo {
    countryName?: string;
    organizationName?: string;
    commonName?: string;
    serialName?: string;
    organizationalUnitName?: string;
  }

  interface ValidityPeriod {
    notBefore: string;
    notAfter: string;
  }

  interface CertificateInfo {
    clientCertificate?: boolean;
    issuedBy: EntityInfo;
    issuedTo: EntityInfo;
    validityPeriod: ValidityPeriod;
    pemCertificate?: string;
  }

  interface SignatureMeta {
    reason: string | null;
    contactInfo: string | null;
    location: string | null;
    name: string | null;
  }

  interface SignatureMetadata {
    certs?: CertificateInfo[];
    signatureMeta: SignatureMeta;
  }

  interface Signature {
    verified: boolean;
    authenticity: boolean;
    integrity: boolean;
    expired: boolean;
    meta?: SignatureMetadata;
  }

  interface VerificationResult {
    verified: boolean;
    authenticity: boolean;
    integrity: boolean;
    expired: boolean;
    signatures?: Signature[];
    numberOfPages?: number;
  }

  function getCertificatesInfoFromPDF(
    pdf: Uint8Array
  ): Promise<CertificateInfo[][]>;

  export default function verifyPDF(
    pdfBuffer: Uint8Array
  ): Promise<VerificationResult>;
  export {
    getCertificatesInfoFromPDF,
    Signature,
    VerificationResult,
    CertificateInfo
  };
}
