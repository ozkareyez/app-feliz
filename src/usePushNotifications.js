import { useEffect, useRef, useCallback } from "react";

function isToday(d) {
  return d === new Date().toLocaleDateString("en-CA");
}
function isTomorrow(d) {
  var t = new Date();
  t.setDate(t.getDate() + 1);
  return d === t.toLocaleDateString("en-CA");
}

function swMessage(type, payload) {
  if (!navigator.serviceWorker || !navigator.serviceWorker.controller) return;
  navigator.serviceWorker.controller.postMessage({ type, ...payload });
}

function updateBadge(count) {
  if ("setAppBadge" in navigator) {
    if (count > 0) {
      navigator.setAppBadge(count).catch(function () {});
    } else {
      navigator.clearAppBadge().catch(function () {});
    }
  }
  swMessage("UPDATE_BADGE", { count });
}

function showLocalNotification(pickups, totalCount) {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  if (!navigator.serviceWorker || !navigator.serviceWorker.controller) return;

  var names = pickups.slice(0, 2).map(function (r) { return r.client; }).join(", ");
  var extra = pickups.length > 2 ? " y " + (pickups.length - 2) + " más" : "";

  swMessage("SHOW_NOTIFICATION", {
    title: "📦 " + totalCount + " recogida" + (totalCount !== 1 ? "s" : "") + " pendiente" + (totalCount !== 1 ? "s" : ""),
    body: names + extra,
    tag: "feliz-pickup",
    url: "/?tab=alertas",
    count: totalCount,
  });
}

function checkAndNotify(resList, lastBadge) {
  var pending = resList.filter(function (r) {
    return r.status !== "recogido" && (isToday(r.pickup) || isTomorrow(r.pickup));
  });
  var count = pending.length;
  if (count !== lastBadge.current) {
    lastBadge.current = count;
    updateBadge(count);
  }
  var todayPickups = pending.filter(function (r) { return isToday(r.pickup); });
  if (todayPickups.length > 0 && document.hidden) {
    showLocalNotification(todayPickups, count);
  }
}

export function usePushNotifications(reservations) {
  var swRegistered = useRef(false);
  var lastBadgeCount = useRef(-1);
  var checkInterval = useRef(null);

  var checkAndNotifyRef = useRef(function (resList) {
    checkAndNotify(resList, lastBadgeCount);
  });

  useEffect(function () {
    if (!("serviceWorker" in navigator)) return;
    if (swRegistered.current) return;
    swRegistered.current = true;

    navigator.serviceWorker
      .register("/sw.js")
      .then(function (reg) {
        console.log("[Feliz] Service Worker registrado:", reg.scope);
      })
      .catch(function (err) {
        console.warn("[Feliz] SW no pudo registrarse:", err);
      });
  }, []);

  useEffect(function () {
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
      var t = setTimeout(function () {
        Notification.requestPermission();
      }, 3000);
      return function () { clearTimeout(t); };
    }
  }, []);

  useEffect(function () {
    if (!reservations) return;
    checkAndNotifyRef.current(reservations);
  }, [reservations]);

  useEffect(function () {
    checkInterval.current = setInterval(function () {
      var stored = localStorage.getItem("aruba_reservations");
      if (stored) checkAndNotifyRef.current(JSON.parse(stored));
    }, 60 * 1000);
    return function () { clearInterval(checkInterval.current); };
  }, []);

  var testNotification = useCallback(function () {
    if (Notification.permission !== "granted") {
      Notification.requestPermission().then(function (p) {
        if (p === "granted") {
          swMessage("SHOW_NOTIFICATION", {
            title: "Feliz Enterprise — Prueba",
            body: "Las notificaciones están funcionando correctamente.",
            tag: "feliz-test",
            url: "/",
            count: 0,
          });
        }
      });
    } else {
      swMessage("SHOW_NOTIFICATION", {
        title: "Feliz Enterprise — Prueba",
        body: "Las notificaciones están funcionando correctamente.",
        tag: "feliz-test",
        url: "/",
        count: 0,
      });
    }
  }, []);

  return { testNotification };
}
