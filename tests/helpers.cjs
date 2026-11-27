// 測試共用：讓瀏覽器在每次載入頁面前，把「第一次使用的導覽」標記為已看過
// （測試會清除儲存空間再重新載入，所以用 addInitScript 在每次載入時補上）。
// 專門測試導覽本身的測試，請直接使用 browser.newContext 而不要經過這裡。
function skipOnboarding(browser) {
  const original = browser.newContext.bind(browser);
  browser.newContext = async (options) => {
    const ctx = await original(options);
    await ctx.addInitScript(() => {
      try { if (!localStorage.getItem('yuexia.onboarded')) localStorage.setItem('yuexia.onboarded', '1'); } catch (e) { /* 忽略 */ }
    });
    return ctx;
  };
  browser.newContextRaw = original;
  return browser;
}
module.exports = { skipOnboarding };
