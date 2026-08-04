import { getDeviceId } from "./deviceId";

function urlBase64ToUint8Array(base64: string): BufferSource {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64Safe = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64Safe);
  const array = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) array[i] = raw.charCodeAt(i);
  return array.buffer;
}

export function pushSupported(): boolean {
  return "serviceWorker" in navigator && "PushManager" in window;
}

export async function getPushPermissionState(): Promise<NotificationPermission | "unsupported"> {
  if (!pushSupported()) return "unsupported";
  return Notification.permission;
}

export async function enablePushNotifications(): Promise<{ ok: boolean; error?: string }> {
  if (!pushSupported()) return { ok: false, error: "Push notifications aren't supported in this browser." };

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return { ok: false, error: "Notification permission was not granted." };

    const registration = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;

    const keyRes = await fetch("/api/push/public-key");
    const { publicKey } = await keyRes.json();

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
    }

    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Device-Id": getDeviceId() },
      body: JSON.stringify({ subscription }),
    });

    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to enable notifications." };
  }
}

export async function sendTestPush(): Promise<void> {
  await fetch("/api/push/test", {
    method: "POST",
    headers: { "X-Device-Id": getDeviceId() },
  });
}
