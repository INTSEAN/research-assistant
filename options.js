document.addEventListener("DOMContentLoaded", () => {
  const interestsTextarea = document.getElementById("interests");
  const saveButton = document.getElementById("save-button");

  // Load existing interests
  chrome.storage.local.get(["interests"], (result) => {
    interestsTextarea.value = result.interests || "";
  });

  saveButton.addEventListener("click", () => {
    const interests = interestsTextarea.value;
    chrome.storage.local.set({ interests: interests }, () => {
      alert("Interests saved successfully!");
    });
  });
});