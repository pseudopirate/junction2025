// Type declarations for Google Identity Services

interface GoogleAccounts {
  oauth2: {
    initTokenClient: (config: {
      client_id: string;
      scope: string;
      callback: (response: GoogleTokenResponse) => void;
    }) => {
      requestAccessToken: () => void;
    };
  };
}

interface GoogleTokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

interface Window {
  google?: {
    accounts: GoogleAccounts;
  };
}

