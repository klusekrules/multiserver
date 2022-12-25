export default {
  aceBase: {
    name: '.',
  },
  cors: {
    origin: '*',
    optionsSuccessStatus: 200,
  },
  general: {
    useHttps: false,
    port: 8443,
  },
  session: {
    resave: false, // don't save session if unmodified
    saveUninitialized: false, // don't create session until something stored
    secret: 'shhhh, very secret'
  },
  ssl: {
    privateKey: '/home/ubuntu/vps-7357abad.vps.ovh.net.key',
    certificate: '/home/ubuntu/vps-7357abad.vps.ovh.net.crt',
  }
};
