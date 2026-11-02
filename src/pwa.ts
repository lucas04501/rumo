import { registerSW } from 'virtual:pwa-register'

const CHECK_INTERVAL_MS = 60 * 60 * 1000

const isBusy = () =>
  document.querySelector('dialog[open]') !== null ||
  document.activeElement?.matches('input, textarea') === true

// Recarregar no meio de um formulário perderia o que está sendo digitado.
function reloadWhenFree() {
  if (!isBusy()) {
    window.location.reload()
    return
  }
  document.addEventListener('visibilitychange', reloadWhenFree, { once: true })
}

/**
 * No iPhone, tocar no ícone costuma só acordar o app suspenso, sem carregar nada.
 * Por isso a versão nova é procurada toda vez que o app volta para a tela.
 */
export function startUpdates() {
  registerSW({
    immediate: true,
    onNeedReload: reloadWhenFree,
    onRegisteredSW(_url, registration) {
      if (!registration) return

      const check = () => {
        if (document.visibilityState === 'visible' && navigator.onLine) {
          registration.update().catch(() => {})
        }
      }

      document.addEventListener('visibilitychange', check)
      window.addEventListener('focus', check)
      setInterval(check, CHECK_INTERVAL_MS)
    },
  })
}
