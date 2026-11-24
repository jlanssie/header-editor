const STORAGE_KEY = "requestHeaderRules";

const listEl = document.getElementById("requestModifiersList");
const addBtn = document.getElementById("addRequestModifierBtn");
const saveBtn = document.getElementById("saveBtn");

/**
 * Creates a single rule row <li> element.
 */
function createRuleRow(rule = {}) {
  const {
    enabled = true,
    target = "request",
    urlFilter = "",
    headerName = "",
    headerValue = "",
  } = rule;

  const li = document.createElement("li");
  li.className = "rule-item";

  const activeCheckbox = document.createElement("input");
  activeCheckbox.type = "checkbox";
  activeCheckbox.className = "rule-enabled";
  activeCheckbox.checked = Boolean(enabled);
  activeCheckbox.title = "Enable rule";

  const targetSelect = document.createElement("select");
  targetSelect.className = "rule-target";
  targetSelect.title = "Apply to request or response headers";

  const requestOpt = document.createElement("option");
  requestOpt.value = "request";
  requestOpt.textContent = "Request Header";

  const responseOpt = document.createElement("option");
  responseOpt.value = "response";
  responseOpt.textContent = "Response Header";

  targetSelect.append(requestOpt, responseOpt);
  targetSelect.value = target === "response" ? "response" : "request";

  const urlInput = document.createElement("input");
  urlInput.type = "text";
  urlInput.className = "rule-url";
  urlInput.placeholder = "URL filter (e.g. example.com or *)";
  urlInput.value = urlFilter;

  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.className = "rule-header-name";
  nameInput.placeholder = "Header name (e.g. Authorization or Access-Control-Allow-Origin)";
  nameInput.value = headerName;

  const valueInput = document.createElement("input");
  valueInput.type = "text";
  valueInput.className = "rule-header-value";
  valueInput.placeholder = "Header value";
  valueInput.value = headerValue;

  const removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.className = "rule-remove";
  removeBtn.textContent = "×";
  removeBtn.title = "Remove rule";
  removeBtn.addEventListener("click", () => {
    li.remove();
    if (listEl.children.length === 0) {
      listEl.appendChild(createRuleRow());
    }
  });

  li.append(activeCheckbox, targetSelect, urlInput, nameInput, valueInput, removeBtn);
  return li;
}

/**
 * Renders saved rules, or one blank row if none exist.
 */
function renderRules(rules) {
  listEl.innerHTML = "";
  if (Array.isArray(rules) && rules.length > 0) {
    rules.forEach((rule) => listEl.appendChild(createRuleRow(rule)));
  } else {
    listEl.appendChild(createRuleRow());
  }
}

/**
 * Collects rules currently displayed in the DOM.
 */
function collectRulesFromDom() {
  const rows = [...listEl.querySelectorAll(".rule-item")];
  return rows
    .map((row, index) => ({
      id: index + 1,
      enabled: row.querySelector(".rule-enabled").checked,
      target: row.querySelector(".rule-target").value,
      urlFilter: row.querySelector(".rule-url").value.trim(),
      headerName: row.querySelector(".rule-header-name").value.trim(),
      headerValue: row.querySelector(".rule-header-value").value,
    }))
    .filter((rule) => rule.headerName !== "");
}

/**
 * Applies enabled rules to chrome.declarativeNetRequest dynamic rules.
 */
async function syncDeclarativeNetRequest(rules) {
  if (!chrome.declarativeNetRequest?.updateDynamicRules) {
    return;
  }

  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  const removeRuleIds = existing.map((r) => r.id);

  const addRules = rules
    .filter((r) => r.enabled && r.headerName)
    .map((r, idx) => {
      const headerEntry = {
        header: r.headerName,
        operation: "set",
        value: r.headerValue,
      };

      const action =
        r.target === "response"
          ? { type: "modifyHeaders", responseHeaders: [headerEntry] }
          : { type: "modifyHeaders", requestHeaders: [headerEntry] };

      return {
        id: idx + 1,
        priority: 1,
        action,
        condition: {
          ...(r.urlFilter ? { urlFilter: r.urlFilter } : {}),
          resourceTypes: [
            "main_frame",
            "sub_frame",
            "xmlhttprequest",
            "script",
            "stylesheet",
            "image",
            "font",
            "other",
          ],
        },
      };
    });

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds,
    addRules,
  });
}

/**
 * Loads rules from chrome.storage.local on popup open.
 */
async function loadRules() {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    renderRules(result[STORAGE_KEY]);
  } catch (err) {
    console.error("Failed to load rules:", err);
    renderRules([]);
  }
}

/**
 * Saves rules to chrome.storage.local and applies them.
 */
async function handleSave() {
  const rules = collectRulesFromDom();

  try {
    await chrome.storage.local.set({ [STORAGE_KEY]: rules });
    await syncDeclarativeNetRequest(rules);
    renderRules(rules);

    const originalText = saveBtn.textContent;
    saveBtn.textContent = "Saved!";
    setTimeout(() => {
      saveBtn.textContent = originalText;
    }, 1200);
  } catch (err) {
    console.error("Failed to save rules:", err);
  }
}

addBtn.addEventListener("click", () => {
  listEl.appendChild(createRuleRow());
});

saveBtn.addEventListener("click", handleSave);

document.addEventListener("DOMContentLoaded", loadRules);
