export function setupMainTabs(onChange) {
  const tabs = [
    {
      id: "tab-earthquake",
      name: "earthquake"
    },
    {
      id: "tab-kyoshin",
      name: "kyoshin"
    },
    {
      id: "tab-tsunami",
      name: "tsunami"
    }
  ];

  tabs.forEach(tab => {
    const button =
      document.getElementById(tab.id);

    if (!button) {
      return;
    }

    button.addEventListener("click", () => {
      onChange(tab.name);
    });
  });
}

export function updateMainTabUI(currentTab) {
  const tabs = [
    "earthquake",
    "kyoshin",
    "tsunami"
  ];

  tabs.forEach(tab => {
    const button =
      document.getElementById(`tab-${tab}`);

    if (!button) {
      return;
    }

    button.classList.toggle(
      "active",
      currentTab === tab
    );
  });
}