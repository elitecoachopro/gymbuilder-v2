export default {
  async rewrites() { return [...(process.env.GYM_SERVICE_TEST_ORIGIN === 'http://127.0.0.1:3110' ? [{ source: '/api/:path*', destination: 'http://127.0.0.1:3110/api/:path*' }] : []), { source: '/models/gym/pilot/cad_treadmill.glb', destination: '/api/model-fixture' }, { source: '/models/:path*', destination: 'http://127.0.0.1:3121/models/:path*' }, { source: '/textures/:path*', destination: 'http://127.0.0.1:3121/textures/:path*' }]; },
};
