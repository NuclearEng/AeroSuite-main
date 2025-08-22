/**
 * PKCE (Proof Key for Code Exchange) Utilities
 * 
 * These utilities help implement PKCE authentication for enhanced security
 * in single-page applications.
 */

/**
 * Generates a random string for use as a code verifier
 * 
 * @param length - The length of the code verifier (default: 64)
 * @returns A random string of the specified length
 */
export function generateCodeVerifier(length: number = 64): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let result = '';
  
  // Use crypto.getRandomValues if available (more secure)
  if (window.crypto && window.crypto.getRandomValues) {
    const values = new Uint8Array(length);
    window.crypto.getRandomValues(values);
    values.forEach(value => result += charset[value % charset.length]);
  } else {
    // Fallback to Math.random
    for (let i = 0; i < length; i++) {
      result += charset[Math.floor(Math.random() * charset.length)];
    }
  }
  
  return result;
}

/**
 * Generates a code challenge from a code verifier using SHA-256
 * 
 * @param codeVerifier - The code verifier to hash
 * @returns A base64url encoded SHA-256 hash of the code verifier
 */
export async function generateCodeChallenge(codeVerifier: string): Promise<string> {
  // Convert code verifier to a text encoder for hashing
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  
  // Hash the verifier with SHA-256
  const hash = await window.crypto.subtle.digest('SHA-256', data);
  
  // Convert the hash to base64url encoding
  return base64UrlEncode(hash);
}

/**
 * Encodes an ArrayBuffer to a base64url string
 * 
 * @param buffer - The ArrayBuffer to encode
 * @returns A base64url encoded string
 */
function base64UrlEncode(buffer: ArrayBuffer): string {
  // Convert the buffer to a byte array
  const bytes = new Uint8Array(buffer);
  const base64 = btoa(String.fromCharCode(...bytes));
  
  // Convert to base64url by replacing characters
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Stores PKCE verifier in session storage
 * 
 * @param verifier - The code verifier to store
 */
export function storeCodeVerifier(verifier: string): void {
  sessionStorage.setItem('pkce_verifier', verifier);
}

/**
 * Retrieves stored PKCE verifier from session storage
 * 
 * @returns The stored code verifier or null if not found
 */
export function getStoredCodeVerifier(): string | null {
  return sessionStorage.getItem('pkce_verifier');
}

/**
 * Clears the stored PKCE verifier from session storage
 */
export function clearCodeVerifier(): void {
  sessionStorage.removeItem('pkce_verifier');
}

/**
 * Complete PKCE authentication flow helper
 * 
 * @param loginFn - The function that performs the login API call
 * @param email - User email
 * @param password - User password
 * @returns The login response
 */
export async function loginWithPkce(
  loginFn: (data: any) => Promise<any>,
  email: string, 
  password: string
): Promise<any> {
  // Generate and store code verifier
  const codeVerifier = generateCodeVerifier();
  storeCodeVerifier(codeVerifier);
  
  // Generate code challenge
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  
  // Call login with code challenge
  const response = await loginFn({
    email,
    password,
    codeChallenge,
    codeChallengeMethod: 'S256'
  });
  
  // Return response for further processing
  return response;
} 