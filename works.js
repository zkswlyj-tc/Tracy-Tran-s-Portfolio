/**
 * Tracy Tran Portfolio - Works Logic
 * Handling Filters and Modal Interactions
 */

document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("grid");
  const chips = document.querySelectorAll(".chip");
  const modal = document.getElementById("workModal");

  // Safety check: only run if essential elements exist
  if (!grid || !modal) return;

  const hero = document.getElementById("workHero");
  const meta = document.getElementById("workMeta");
  const title = document.getElementById("workTitle");
  const desc = document.getElementById("workDesc");

 /**
/**
   * 1. FILTER LOGIC
   */
  chips.forEach((chip) => {
    chip.addEventListener("click", (e) => {
      // 1. Get the filter key safely
      const filterKey = (chip.getAttribute('data-filter') || "all").toLowerCase();
      
      console.log("Filtering by:", filterKey); // Check your browser console (F12)!

      // 2. UI: Update active state
      chips.forEach((c) => c.setAttribute("aria-pressed", "false"));
      chip.setAttribute("aria-pressed", "true");

      // 3. Filter Cards
      const cards = grid.querySelectorAll(".card");
      cards.forEach((card) => {
        const rawTags = (card.getAttribute('data-tags') || "").toLowerCase();
        
        // Logic: Show if "all" OR if the tags contain the filterKey string
        const isVisible = filterKey === "all" || rawTags.includes(filterKey);
        
        card.classList.toggle("is-hidden", !isVisible);
      });
    });
  });

  /**
   * 2. MODAL OPEN LOGIC
   * Injects data from the clicked card into the dialog
   */
  const openWorkModal = (card) => {
    const cardTitle = card.dataset.title || "Untitled Project";
    const cardYear = card.dataset.year || "";
    const cardTags = (card.dataset.tags || "").replace(/,/g, " • ");

    // Set text content
    title.textContent = cardTitle;
    meta.textContent = `${cardTags} ${cardYear ? " • " + cardYear : ""}`.trim();
    
    // Set Hero Image
    hero.src = card.dataset.hero || card.querySelector("img")?.src || "";
    hero.alt = `${cardTitle} full view`;

    // Inject Rich Description from <template>
    desc.innerHTML = "";
    const template = card.querySelector(".card__desc-template");
    
    if (template && template.content) {
      desc.appendChild(template.content.cloneNode(true));
    } else {
      // Fallback if no template is found
      const fallback = card.querySelector(".label__desc")?.textContent || "";
      const p = document.createElement("p");
      p.textContent = fallback;
      desc.appendChild(p);
    }

    modal.showModal();
  };

  /**
   * 3. EVENT DELEGATION
   * Listens for clicks on the grid and directs them to the cards
   */
  grid.addEventListener("click", (e) => {
    const card = e.target.closest(".card");
    
    // Ensure we clicked a card and it's not currently hidden by a filter
    if (!card || card.classList.contains("is-hidden")) return;

    // Prevent default navigation to the subpage so we can show the modal instead
    e.preventDefault();
    openWorkModal(card);
  });

  /**
   * 4. MODAL CLOSE LOGIC
   * Handles clicking the 'Close' button or the backdrop
   */
  modal.addEventListener("click", (e) => {
    const isCloseBtn = e.target.hasAttribute("data-close");
    const isBackdrop = e.target === modal; // Dialog clicks target backdrop if not child

    if (isCloseBtn || isBackdrop) {
      modal.close();
      // Accessibility: return focus to the grid (optional)
      grid.focus();
    }
  });

  // Handle ESC key (built-in to <dialog>, but good for focus management)
  modal.addEventListener("close", () => {
    // Stop any videos playing inside the modal when it closes
    const videos = modal.querySelectorAll("video");
    videos.forEach(v => v.pause());
  });
});