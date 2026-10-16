import 'dart:convert';

/// What the app types into one of VenQore's own web pages on the person's behalf.
///
/// The sign-in and register forms are native, but the real accounts, emailed sign-in codes,
/// two-step checks and role routing live on the server's web pages. So the native form hands what
/// was typed to the matching page once, and presses its button. The page then does everything it
/// always does; nothing is bypassed and nothing is stored on the phone.
class WebAutofill {
  const WebAutofill({
    required this.path,
    this.fields = const <String, String>{},
    this.checkboxId,
    this.submitSelector,
    this.clickButtonText,
  });

  /// The page this applies to. It is only run on a page with exactly this path.
  final String path;

  /// Input `name` attribute -> value.
  final Map<String, String> fields;

  /// Id of a checkbox to tick (for example the terms box on register).
  final String? checkboxId;

  /// CSS selector of the button to press once the fields are filled.
  final String? submitSelector;

  /// Instead of filling fields: press the first button whose text contains this (case-insensitive).
  final String? clickButtonText;

  bool matches(Uri uri) => uri.path == path;

  /// JavaScript that waits for the page to render its form (these pages are client-rendered),
  /// fills the fields the way a person typing would, then presses the button. Gives up quietly
  /// after about six seconds so a changed page never leaves the app stuck.
  String script() {
    final cfg = jsonEncode(<String, Object?>{
      'fields': fields,
      'check': checkboxId,
      'submit': submitSelector,
      'text': clickButtonText?.toLowerCase(),
    });

    return '''
(function (cfg) {
  var tries = 0, done = false;
  function setValue(el, value) {
    var proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }
  function ready() {
    if (cfg.text) {
      return Array.prototype.some.call(document.querySelectorAll('button'), function (b) {
        return (b.textContent || '').toLowerCase().indexOf(cfg.text) !== -1;
      });
    }
    return Object.keys(cfg.fields).every(function (n) {
      return document.querySelector('input[name="' + n + '"]');
    });
  }
  function run() {
    if (done) return;
    if (!ready()) { if (++tries < 40) setTimeout(run, 150); return; }
    done = true;
    if (cfg.text) {
      var btns = document.querySelectorAll('button');
      for (var i = 0; i < btns.length; i++) {
        if ((btns[i].textContent || '').toLowerCase().indexOf(cfg.text) !== -1) { btns[i].click(); break; }
      }
      return;
    }
    Object.keys(cfg.fields).forEach(function (n) {
      setValue(document.querySelector('input[name="' + n + '"]'), cfg.fields[n]);
    });
    setTimeout(function () {
      if (cfg.check) {
        var cb = document.getElementById(cfg.check);
        if (cb && !(cb.checked === true || cb.getAttribute('aria-checked') === 'true')) cb.click();
      }
      setTimeout(function () {
        var b = cfg.submit ? document.querySelector(cfg.submit) : null;
        if (b && !b.disabled) b.click();
      }, 250);
    }, 120);
  }
  run();
})($cfg);
''';
  }
}
