export const environment = {
  production: false,

  apiUser: process.env['NG_APP_API_USER'] || '',
  apiRol: process.env['NG_APP_API_ROL'] || '',
  apiLanguage: process.env['NG_APP_API_LANGUAGE'] || '',
  apiIncendio: process.env['NG_APP_API_INCENDIO'] || '',
  apiNotificacion: process.env['NG_APP_API_NOTIFICACION'] || '',

  apiUrl: process.env['NG_APP_API_URL'] || '',
  oauthURL: process.env['NG_APP_OAUTH_URL'] || '',
  clientId: process.env['NG_APP_CLIENT_ID'] || '',
  clientSecret: process.env['NG_APP_CLIENT_SECRET'] || '',
  redirectUriLoginModal: process.env['NG_APP_REDIRECT_URI'] || '',
  ninjasApiKey: process.env['NG_APP_NINJAS_API_KEY'] || ''
};