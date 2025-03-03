document.addEventListener("DOMContentLoaded", () => {
  const loginSection = document.getElementById("login-section");
  const mainSection = document.getElementById("main-section");
  const loginButton = document.getElementById("login-button");
  const logoutButton = document.getElementById("logout-button");
  const fetchPapersButton = document.getElementById("fetch-papers");
  const saveNotesButton = document.getElementById("save-notes");
  const papersDiv = document.getElementById("papers");
  const notesTextarea = document.getElementById("notes");

  // Check if already logged in
  chrome.storage.local.get(["token"], (result) => {
    if (result.token) {
      loginSection.style.display = "none";
      mainSection.style.display = "block";
    }
  });

  loginButton.addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "login" }, (response) => {
      if (response.error) {
        alert("Login failed: " + response.error.message);
      } else {
        loginSection.style.display = "none";
        mainSection.style.display = "block";
      }
    });
  });

  logoutButton.addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "logout" }, (response) => {
      if (response.success) {
        loginSection.style.display = "block";
        mainSection.style.display = "none";
        papersDiv.innerHTML = "";
        notesTextarea.value = "";
      }
    });
  });

  fetchPapersButton.addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "fetchPapers" }, (response) => {
      if (response.error) {
        alert("Error fetching papers: " + response.error);
      } else {
        papersDiv.innerHTML = "";
        response.papers.forEach((paper) => {
          const p = document.createElement("p");
          p.textContent = paper.title;
          papersDiv.appendChild(p);
        });
      }
    });
  });

  saveNotesButton.addEventListener("click", () => {
    const notes = notesTextarea.value;
    if (!notes) {
      alert("Please enter some notes to save.");
      return;
    }
    chrome.runtime.sendMessage({ action: "saveNotes", notes: notes }, (response) => {
      if (response.error) {
        alert("Error saving notes: " + response.error);
      } else {
        alert("Notes saved to Google Drive with ID: " + response.fileId);
      }
    });
  });
});