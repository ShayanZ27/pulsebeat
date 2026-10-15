export function showToast(message, type = 'success') {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('pulsebeat-toast', {
        detail: { message, type },
      })
    );
  }
}
