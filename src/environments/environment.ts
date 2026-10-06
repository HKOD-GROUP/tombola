export const environment = {
  production: false,
  /**
   * hkod-api en local : profil Spring `local` actif par defaut
   * (`application-local.yaml` : port 8082, TLS active avec un certificat
   * auto-signe). Accepter le certificat une fois dans le navigateur.
   */
  apiBaseUrl: 'https://192.168.1.17:8082',
  //apiBaseUrl: 'https://192.168.1.17:8082',
  /** Origine publique du site, pour les URL absolues (canonical, Open Graph, return_url). */
  siteUrl: 'https://192.168.1.17:4206',
};
