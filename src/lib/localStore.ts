/**
 * In-memory store for the portal's demonstration flows. Nothing leaves the page.
 */
const memory = new Map<string, unknown>();

export async function putLocal(collection: string, id: string, data: unknown): Promise<void> {
  memory.set(`${collection}/${id}`, data);
}
export function getLocal<T = unknown>(collection: string, id: string): T | undefined {
  return memory.get(`${collection}/${id}`) as T;
}
