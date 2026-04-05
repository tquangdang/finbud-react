let appPromise;

function getApp() {
  if (!appPromise) {
    appPromise = import('../backend/app.js').then((m) => m.default);
  }
  return appPromise;
}

module.exports = async (req, res) => {
  const app = await getApp();
  app(req, res);
};
