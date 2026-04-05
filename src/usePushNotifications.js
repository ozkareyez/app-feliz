// src/usePushNotifications.js
// Hook que maneja:
//   1. Registro del Service Worker
//   2. Permiso de notificaciones
//   3. Badge counter (ícono de la app)
//   4. Notificaciones locales programadas (sin servidor)
//   5. Verificación diaria de recogidas pendientes

import { useEffect, useRef } from "react";

// ─── helpers ─────────────────────────────────────────────────────────────────

function isToday(d) {
  return d === new Date().toLocaleDateString("en-CA");
}
function isTomorrow(d) {
  var t = new Date();
  t.setDate(t.getDate() + 1);
  return d === t.toLocaleDateString("en-CA");
}

// Envía mensaje al Service Worker activo
function swMessage(type, payload) {
  if (!navigator.serviceWorker || !navigator.serviceWorker.controller) return;
  navigator.serviceWorker.controller.postMessage({ type, ...payload });
}

// ─── hook principal ───────────────────────────────────────────────────────────

export function usePushNotifications(reservations) {
  var swRegistered = useRef(false);
  var lastBadgeCount = useRef(-1);
  var checkInterval = useRef(null);

  // 1. Registrar SW una vez
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

  // 2. Solicitar permiso de notificaciones (solo una vez, al montar)
  useEffect(function () {
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
      // Pequeño delay para no pedir permiso inmediatamente al abrir
      var t = setTimeout(function () {
        Notification.requestPermission();
      }, 3000);
      return function () {
        clearTimeout(t);
      };
    }
  }, []);

  // 3. Actualizar badge y verificar alertas cuando cambian las reservas
  useEffect(
    function () {
      if (!reservations) return;
      checkAndNotify(reservations);
    },
    [reservations],
  );

  // 4. Verificar cada minuto (para cuando la app está abierta en background/tab)
  useEffect(function () {
    checkInterval.current = setInterval(function () {
      var stored = localStorage.getItem("aruba_reservations");
      if (stored) checkAndNotify(JSON.parse(stored));
    }, 60 * 1000);

    return function () {
      clearInterval(checkInterval.current);
    };
  }, []);

  // ─── lógica central ────────────────────────────────────────────────────────

  function checkAndNotify(resList) {
    var pending = resList.filter(function (r) {
      return (
        r.status !== "recogido" && (isToday(r.pickup) || isTomorrow(r.pickup))
      );
    });

    var count = pending.length;

    // Actualizar badge solo si cambió
    if (count !== lastBadgeCount.current) {
      lastBadgeCount.current = count;
      updateBadge(count);
    }

    // Notificación local si hay recogidas para HOY y la app no está en primer plano
    var todayPickups = pending.filter(function (r) {
      return isToday(r.pickup);
    });
    if (todayPickups.length > 0 && document.hidden) {
      showLocalNotification(todayPickups, count);
    }
  }

  function updateBadge(count) {
    // Badge API nativa (Android Chrome, Samsung Internet, algunos iOS)
    if ("setAppBadge" in navigator) {
      if (count > 0) {
        navigator.setAppBadge(count).catch(function () {});
      } else {
        navigator.clearAppBadge().catch(function () {});
      }
    }

    // Fallback: decirle al SW que actualice el badge
    swMessage("UPDATE_BADGE", { count });
  }

  function showLocalNotification(pickups, totalCount) {
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") return;
    if (!navigator.serviceWorker || !navigator.serviceWorker.controller) return;

    var names = pickups
      .slice(0, 2)
      .map(function (r) {
        return r.client;
      })
      .join(", ");
    var extra = pickups.length > 2 ? " y " + (pickups.length - 2) + " más" : "";

    swMessage("SHOW_NOTIFICATION", {
      title:
        "📦 " +
        totalCount +
        " recogida" +
        (totalCount !== 1 ? "s" : "") +
        " pendiente" +
        (totalCount !== 1 ? "s" : ""),
      body: names + extra,
      tag: "feliz-pickup",
      url: "/?tab=alertas",
      count: totalCount,
    });
  }

  // Exponer función para que el componente pueda forzar una notificación de prueba
  function testNotification() {
    if (Notification.permission !== "granted") {
      Notification.requestPermission().then(function (p) {
        if (p === "granted") _sendTest();
      });
    } else {
      _sendTest();
    }
  }

  function _sendTest() {
    swMessage("SHOW_NOTIFICATION", {
      title: "Feliz Enterprise — Prueba",
      body: "Las notificaciones están funcionando correctamente.",
      tag: "feliz-test",
      url: "/",
      count: 0,
    });
  }

  return { testNotification };
}
