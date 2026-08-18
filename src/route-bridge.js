(() => {
  const ROUTE_CHANGE_EVENT = "polaris-for-web-route-change";

  function notifyRouteChange() {
    window.dispatchEvent(new Event(ROUTE_CHANGE_EVENT));
  }

  ["pushState", "replaceState"].forEach((method) => {
    const original = window.history[method];
    window.history[method] = function (...args) {
      const result = original.apply(this, args);
      notifyRouteChange();
      return result;
    };
  });

  window.addEventListener("popstate", notifyRouteChange);
  window.addEventListener("hashchange", notifyRouteChange);
})();
