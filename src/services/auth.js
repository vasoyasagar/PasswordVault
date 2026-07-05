const SCOPES = 'openid email profile https://www.googleapis.com/auth/drive.file';

let tokenClient = null;

export function initAuth(clientId, callback) {
  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: SCOPES,
    callback: (response) => {
      if (response.access_token) {
        callback(response);
      }
    },
  });
}

export function signIn() {
  if (tokenClient) {
    tokenClient.requestAccessToken();
  }
}

export function signOut(token) {
  if (token) {
    window.google.accounts.oauth2.revoke(token);
  }
}
