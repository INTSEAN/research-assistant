// OAuth Login
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "login") {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (chrome.runtime.lastError || !token) {
        sendResponse({ error: chrome.runtime.lastError });
        return;
      }
      chrome.storage.local.set({ token: token }, () => {
        sendResponse({ token: token });
      });
    });
    return true; // Indicates async response
  }

  if (request.action === "logout") {
    chrome.storage.local.get(["token"], (result) => {
      const token = result.token;
      if (token) {
        chrome.identity.removeCachedAuthToken({ token: token }, () => {
          chrome.storage.local.remove("token", () => {
            sendResponse({ success: true });
          });
        });
      }
    });
    return true;
  }

  if (request.action === "fetchPapers") {
    chrome.storage.local.get(["interests"], async (result) => {
      const interests = result.interests || "";
      if (!interests) {
        sendResponse({ error: "No interests set" });
        return;
      }
      const keywords = interests.split(",").map((k) => k.trim()).join(" ");
      try {
        const papers = await fetchPapers(keywords);
        sendResponse({ papers: papers });
      } catch (error) {
        sendResponse({ error: error.message });
      }
    });
    return true;
  }

  if (request.action === "saveNotes") {
    chrome.storage.local.get(["token"], async (result) => {
      const token = result.token;
      if (!token) {
        sendResponse({ error: "Not logged in" });
        return;
      }
      try {
        const file = await createDriveFile(token, request.notes);
        sendResponse({ fileId: file.id });
      } catch (error) {
        sendResponse({ error: error.message });
      }
    });
    return true;
  }
});

// Fetch papers from Semantic Scholar API
async function fetchPapers(keywords) {
  const apiKey = "YOUR_SEMANTIC_SCHOLAR_API_KEY"; // Replace with your API key
  const response = await fetch(
    `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(
      keywords
    )}&limit=10`,
    {
      headers: { "x-api-key": apiKey },
    }
  );
  const data = await response.json();
  return data.data || [];
}

// Save notes to Google Drive
async function createDriveFile(token, content) {
  const metadata = {
    name: "Research Notes.txt",
    mimeType: "text/plain",
  };
  const form = new FormData();
  form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
  form.append("file", new Blob([content], { type: "text/plain" }));

  const response = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    }
  );
  return await response.json();
}

// Context Menu for Fact-Checking
chrome.contextMenus.create({
  id: "factCheck",
  title: "Fact Check",
  contexts: ["selection"],
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "factCheck") {
    const selectedText = info.selectionText;
    factCheck(selectedText).then((results) => {
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icon48.png",
        title: "Fact Check Results",
        message: `${results.length} sources found for "${selectedText}"`,
      });
    }).catch((error) => {
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icon48.png",
        title: "Fact Check Error",
        message: error.message,
      });
    });
  }
});

// Fact-check using Google Custom Search
async function factCheck(text) {
  const apiKey = "YOUR_CUSTOM_SEARCH_API_KEY"; // Replace with your API key
  const cseId = "YOUR_CUSTOM_SEARCH_ENGINE_ID"; // Replace with your CSE ID
  const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cseId}&q=${encodeURIComponent(
    text
  )}`;
  const response = await fetch(url);
  const data = await response.json();
  return data.items || [];
}