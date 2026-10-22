export function showToast(messageOrOptions, type = 'success') {
  if (typeof window !== 'undefined') {
    const message =
      typeof messageOrOptions === 'object' && messageOrOptions !== null
        ? messageOrOptions.message
        : messageOrOptions;
    const toastType =
      typeof messageOrOptions === 'object' && messageOrOptions !== null
        ? messageOrOptions.type || 'success'
        : type;

    window.dispatchEvent(
      new CustomEvent('pulsebeat-toast', {
        detail: { message, type: toastType },
      })
    );
  }
}

showToast.success = (msg) => showToast(msg, 'success');
showToast.error = (msg) => showToast(msg, 'error');
showToast.info = (msg) => showToast(msg, 'info');

