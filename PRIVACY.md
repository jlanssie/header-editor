# Privacy Policy for Header Editor

**Last updated:** November 26, 2026

## 1. No Data Collection
**Header Editor** does not collect, transmit, store, or share any personal data, browsing history, HTTP traffic, or usage analytics on external servers.

## 2. Local Storage Only
All custom HTTP header rules and extension preferences you configure are saved exclusively on your local device using Chrome's `storage` API (`chrome.storage.local` / `chrome.storage.sync`). This data never leaves your browser (except via your own Google account if Chrome Sync is enabled in your browser settings) and is completely inaccessible to the developer.

## 3. Permissions Usage
* **`declarativeNetRequest`:** Used strictly on your device to apply your configured request and response header modifications locally within the browser.
* **`storage`:** Used strictly to save your header rules and extension settings between browser sessions.
* **Host permissions (`<all_urls>`):** Required so your local header rules can execute on the URLs you define. The extension does not read, log, or exfiltrate page content or network payloads.

## 4. Third-Party Services
This extension does not integrate any third-party, neither analytics, tracking scripts, crash reporters, or advertising networks.

## 5. Changes to This Policy
If future updates change how the extension handles data, this policy will be updated accordingly before the new version is released.

## 6. Contact
If you have questions about this privacy policy, you can open an issue on the [GitHub repository](https://github.com/jlanssie/header-editor) or contact **jeremy.lanssiers@gmail.com*.
