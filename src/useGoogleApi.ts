import { ref } from 'vue';

export function useGoogleApi() {
  const gapiLoaded = ref(false);
  const isSignedIn = ref(false);
  const userProfile = ref(null);
  const accessToken = ref(null);


  const SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.metadata.readonly';

  function initClient() {
    return new Promise((resolve, reject) => {
      window.gapi.load('client:auth2', () => {
        window.gapi.client.init({
          apiKey: import.meta.env.VITE_GOOGLE_API_KEY,
          clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          scope: SCOPES,
          discoveryDocs: ["https://sheets.googleapis.com/$discovery/rest?version=v4"]
        }).then(() => {
          gapiLoaded.value = true;
          const authInstance = window.gapi.auth2.getAuthInstance();

          isSignedIn.value = authInstance.isSignedIn.get();

          authInstance.isSignedIn.listen(val => {
            isSignedIn.value = val;
            if (val) {
              userProfile.value = authInstance.currentUser.get().getBasicProfile();
              accessToken.value = authInstance.currentUser.get().getAuthResponse().access_token;
            } else {
              userProfile.value = null;
              accessToken.value = null;
            }
          });

          if (isSignedIn.value) {
            userProfile.value = authInstance.currentUser.get().getBasicProfile();
            accessToken.value = authInstance.currentUser.get().getAuthResponse().access_token;
          }

          resolve();
        }).catch(reject);
      });
    });
  }

  async function signIn() {
    if (!gapiLoaded.value) await initClient();
    return window.gapi.auth2.getAuthInstance().signIn();
  }

  function signOut() {
    if (!gapiLoaded.value) return;
    window.gapi.auth2.getAuthInstance().signOut();
  }

  return {
    gapiLoaded,
    isSignedIn,
    userProfile,
    accessToken,
    initClient,
    signIn,
    signOut
  };
}
