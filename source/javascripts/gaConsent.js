var gaConsentNotice = function (GA_TRACKING_ID) {
  var gaOptIn = function () {
    delete window['ga-disable-' + GA_TRACKING_ID]
  }
  var gaOptOut = function () {
    window['ga-disable-' + GA_TRACKING_ID] = true
    document.cookie = '_ga=; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
    document.cookie = '_gid=; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
    document.cookie = '_gat_gtag_' + GA_TRACKING_ID.replace('-', '_') + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
  }

  window.addEventListener("load", function() {
    window.cookieconsent.initialise({
      "palette": {
        "popup": {
          "background": "rgba(226, 239, 247, 0.95)",
          "text": "#333333"
        },
        "button": {
          "background": "rgba(22, 82, 128, 0.9)",
          "text": "#fafafa"
        }
      },
      "theme": "classic",
      "showLink": false,
      "revokeBtn": "<span class='cc-revoke'></span>",
      "type": "opt-out",
      "content": {
        "message": "This website uses Google Analytics to collect anonymous page view information.",
        "allow": "Ok",
        "deny": "Opt out"
      },

      onInitialise: function (status) {
        var type = this.options.type
        var didConsent = this.hasConsented()
        if (type == 'opt-in' && didConsent) {
          gaOptIn()
        }
        if (type == 'opt-out' && !didConsent) {
          gaOptOut()
        }
      },

      onStatusChange: function (status, chosenBefore) {
        var type = this.options.type
        var didConsent = this.hasConsented()
        if (type == 'opt-in' && didConsent) {
          gaOptIn()
        }
        if (type == 'opt-out' && !didConsent) {
          gaOptOut()
        }
      },

      onRevokeChoice: function () {
        var type = this.options.type
        if (type == 'opt-in') {
          gaOptOut()
        }
        if (type == 'opt-out') {
          gaOptIn()
        }
      }
    })
  })
}

gaConsentNotice.retrigger = function (event) {
  if (event && event.preventDefault) { event.preventDefault() }
  document.querySelector('.cc-revoke').click()
}
