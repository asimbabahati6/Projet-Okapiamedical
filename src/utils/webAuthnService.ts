import { supabase } from '../lib/supabase';

export interface BiometricCredential {
  id: string;
  patient_id: string;
  credential_id: string;
  public_key: string;
  counter: number;
  aaguid: string;
  transports: string[];
  device_name?: string;
  created_at: string;
  last_used_at: string;
  is_active: boolean;
}

export interface WebAuthnError {
  type: 'not_supported' | 'not_allowed' | 'timeout' | 'unknown' | 'no_device' | 'user_cancelled';
  message: string;
}

export function isWebAuthnSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.PublicKeyCredential !== undefined &&
    typeof window.PublicKeyCredential === 'function'
  );
}

export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  if (!isWebAuthnSupported()) {
    return false;
  }

  try {
    return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch (error) {
    console.error('Error checking platform authenticator:', error);
    return false;
  }
}

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function generateChallenge(): Promise<ArrayBuffer> {
  const challenge = new Uint8Array(32);
  crypto.getRandomValues(challenge);
  return challenge.buffer;
}

export async function registerWebAuthnCredential(
  patientId: string,
  patientName: string,
  deviceName?: string
): Promise<{ success: boolean; credential?: BiometricCredential; error?: WebAuthnError }> {
  if (!isWebAuthnSupported()) {
    return {
      success: false,
      error: {
        type: 'not_supported',
        message: 'WebAuthn is not supported in this browser',
      },
    };
  }

  try {
    const challenge = await generateChallenge();

    const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
      challenge,
      rp: {
        name: 'OKAPIA Medical',
        id: window.location.hostname,
      },
      user: {
        id: new TextEncoder().encode(patientId),
        name: patientName,
        displayName: patientName,
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' },
        { alg: -257, type: 'public-key' },
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        requireResidentKey: false,
      },
      timeout: 60000,
      attestation: 'none',
    };

    const credential = await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions,
    }) as PublicKeyCredential;

    if (!credential) {
      return {
        success: false,
        error: {
          type: 'unknown',
          message: 'Failed to create credential',
        },
      };
    }

    const response = credential.response as AuthenticatorAttestationResponse;
    const credentialId = bufferToBase64(credential.rawId);
    const publicKey = bufferToBase64(response.getPublicKey()!);

    const transports = response.getTransports ? response.getTransports() : [];
    const aaguid = '00000000-0000-0000-0000-000000000000';

    const { data, error } = await supabase
      .from('patient_biometric_credentials')
      .insert([
        {
          patient_id: patientId,
          credential_id: credentialId,
          public_key: publicKey,
          counter: 0,
          aaguid,
          transports,
          device_name: deviceName || 'Unknown Device',
          is_active: true,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error saving credential:', error);
      return {
        success: false,
        error: {
          type: 'unknown',
          message: 'Failed to save credential to database',
        },
      };
    }

    await supabase.from('biometric_authentication_logs').insert([
      {
        patient_id: patientId,
        credential_id: credentialId,
        success: true,
        action: 'enrollment',
        ip_address: null,
        user_agent: navigator.userAgent,
      },
    ]);

    return {
      success: true,
      credential: data,
    };
  } catch (error: any) {
    console.error('WebAuthn registration error:', error);

    let errorType: WebAuthnError['type'] = 'unknown';
    let errorMessage = 'An unknown error occurred';

    if (error.name === 'NotAllowedError') {
      errorType = 'not_allowed';
      errorMessage = 'User cancelled or operation not allowed';
    } else if (error.name === 'NotSupportedError') {
      errorType = 'not_supported';
      errorMessage = 'WebAuthn is not supported';
    } else if (error.name === 'TimeoutError') {
      errorType = 'timeout';
      errorMessage = 'Operation timed out';
    } else if (error.name === 'InvalidStateError') {
      errorType = 'unknown';
      errorMessage = 'Authenticator already registered';
    }

    return {
      success: false,
      error: {
        type: errorType,
        message: errorMessage,
      },
    };
  }
}

export async function authenticateWithWebAuthn(
  patientId?: string
): Promise<{ success: boolean; patientId?: string; error?: WebAuthnError }> {
  if (!isWebAuthnSupported()) {
    return {
      success: false,
      error: {
        type: 'not_supported',
        message: 'WebAuthn is not supported in this browser',
      },
    };
  }

  try {
    const challenge = await generateChallenge();

    let allowCredentials: PublicKeyCredentialDescriptor[] = [];

    if (patientId) {
      const { data: credentials } = await supabase
        .from('patient_biometric_credentials')
        .select('credential_id, transports')
        .eq('patient_id', patientId)
        .eq('is_active', true);

      if (credentials && credentials.length > 0) {
        allowCredentials = credentials.map((cred) => ({
          id: base64ToBuffer(cred.credential_id),
          type: 'public-key' as const,
          transports: (cred.transports as AuthenticatorTransport[]) || [],
        }));
      }
    }

    const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
      challenge,
      timeout: 60000,
      userVerification: 'required',
      rpId: window.location.hostname,
      ...(allowCredentials.length > 0 && { allowCredentials }),
    };

    const assertion = await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions,
    }) as PublicKeyCredential;

    if (!assertion) {
      return {
        success: false,
        error: {
          type: 'unknown',
          message: 'Failed to get assertion',
        },
      };
    }

    const credentialId = bufferToBase64(assertion.rawId);

    const { data: credential, error: credError } = await supabase
      .from('patient_biometric_credentials')
      .select('*, patient_id')
      .eq('credential_id', credentialId)
      .eq('is_active', true)
      .single();

    if (credError || !credential) {
      await supabase.from('biometric_authentication_logs').insert([
        {
          patient_id: patientId || null,
          credential_id: credentialId,
          success: false,
          failure_reason: 'credential_not_found',
          action: 'authentication',
          ip_address: null,
          user_agent: navigator.userAgent,
        },
      ]);

      return {
        success: false,
        error: {
          type: 'unknown',
          message: 'Credential not found',
        },
      };
    }

    await supabase
      .from('patient_biometric_credentials')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', credential.id);

    await supabase.from('biometric_authentication_logs').insert([
      {
        patient_id: credential.patient_id,
        credential_id: credentialId,
        success: true,
        action: 'authentication',
        ip_address: null,
        user_agent: navigator.userAgent,
      },
    ]);

    return {
      success: true,
      patientId: credential.patient_id,
    };
  } catch (error: any) {
    console.error('WebAuthn authentication error:', error);

    let errorType: WebAuthnError['type'] = 'unknown';
    let errorMessage = 'An unknown error occurred';

    if (error.name === 'NotAllowedError') {
      errorType = 'user_cancelled';
      errorMessage = 'User cancelled authentication';
    } else if (error.name === 'NotSupportedError') {
      errorType = 'not_supported';
      errorMessage = 'WebAuthn is not supported';
    } else if (error.name === 'TimeoutError') {
      errorType = 'timeout';
      errorMessage = 'Authentication timed out';
    }

    if (patientId) {
      await supabase.from('biometric_authentication_logs').insert([
        {
          patient_id: patientId,
          credential_id: null,
          success: false,
          failure_reason: error.name || 'unknown',
          action: 'authentication',
          ip_address: null,
          user_agent: navigator.userAgent,
        },
      ]);
    }

    return {
      success: false,
      error: {
        type: errorType,
        message: errorMessage,
      },
    };
  }
}

export async function revokeCredential(credentialId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('patient_biometric_credentials')
      .update({ is_active: false })
      .eq('id', credentialId);

    return !error;
  } catch (error) {
    console.error('Error revoking credential:', error);
    return false;
  }
}

export async function getPatientCredentials(patientId: string): Promise<BiometricCredential[]> {
  try {
    const { data, error } = await supabase
      .from('patient_biometric_credentials')
      .select('*')
      .eq('patient_id', patientId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching credentials:', error);
    return [];
  }
}
