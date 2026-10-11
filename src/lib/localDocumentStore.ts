/**
 * Document retention, on the device.
 *
 * Donor identity documents, laboratory certificates and clinical signatures are
 * personal data. This build's principle is that PII does not leave the country,
 * so these are NOT posted to a third-party object store. The file is held for
 * the session and a local object URL is returned for preview; a production
 * deployment writes to the in-country document vault instead.
 */
const retained = new Map<string, Blob>();

export async function uploadFileToStorage(
  storagePath: string,
  file: Blob | Uint8Array | ArrayBuffer,
  _metadata?: { contentType?: string }
): Promise<{ downloadUrl: string; storagePath: string; retainedLocally: boolean }> {
  const blob = file instanceof Blob ? file : new Blob([file as any]);
  retained.set(storagePath, blob);
  let downloadUrl = '';
  try { downloadUrl = URL.createObjectURL(blob); } catch { downloadUrl = ''; }
  return { downloadUrl, storagePath, retainedLocally: true };
}

export function getRetainedDocument(storagePath: string): Blob | undefined {
  return retained.get(storagePath);
}
