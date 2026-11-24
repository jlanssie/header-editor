const STORAGE_KEY = "requestHeaderRules";

const requestModifiersListElement = document.getElementById("requestModifiersList");
const addRequestModifierBtnElement = document.getElementById("addRequestModifierBtn");
const saveBtnElement = document.getElementById("saveBtn");

/**
 * Creates a single rule row <li> element.
 */
function createRuleRow(rule = {}) {
  const {
    enabled = true,
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

  const urlInput = document.createElement("input");
  urlInput.type = "text";
  urlInput.className = "rule-url";
  urlInput.placeholder = "URL filter (e.g. example.com or *)";
  urlInput.value = urlFilter;

  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.className = "rule-header-name";
  nameInput.placeholder = "Header name (e.g. Authorization)";
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
    // Keep at least one empty input row available
    if (requestModifiersListElement.children.length === 0) {
      requestModifiersListElement.appendChild(createRuleRow());
    }
  });

  li.append(activeCheckbox, urlInput, nameInput, valueInput, removeBtn);
  return li;
}

/**
 * Renders saved rules, or one blank row if none exist.
 */
function renderRules(rules) {
  requestModifiersListElement.innerHTML = "";
  if (Array.isArray(rules) && rules.length > 0) {
    rules.forEach((rule) => requestModifiersListElement.appendChild(createRuleRow(rule)));
  } else {
    requestModifiersListElement.appendChild(createRuleRow());
  }
}

/**
 * Collects rules currently displayed in the DOM.
 */
function collectRulesFromDom() {
  const rows = [...requestModifiersListElement.querySelectorAll(".rule-item")];
  return rows
    .map((row, index) => ({
      id: index + 1,
      enabled: row.querySelector(".rule-enabled").checked,
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
    .map((r, idx) => ({
      id: idx + 1,
      priority: 1,
      action: {
        type: "modifyHeaders",
        requestHeaders: [
          {
            header: r.headerName,
            operation: "set",
            value: r.headerValue,
          },
        ],
      },
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
    }));

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

    const originalText = saveBtnElement.textContent;
    saveBtnElement.textContent = "Saved!";
    setTimeout(() => {
      saveBtnElement.textContent = originalText;
    }, 1200);
  } catch (err) {
    console.error("Failed to save rules:", err);
  }
}

addRequestModifierBtnElement.addEventListener("click", () => {
  requestModifiersListElement.appendChild(createRuleRow());
});

saveBtnElement.addEventListener("click", handleSave);

document.addEventListener("DOMContentLoaded", loadRules);
