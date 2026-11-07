/**
 * PIXORA — Smooth Page Transition & Loading Bar Controller
 */

document.addEventListener("DOMContentLoaded", () => {
  // Create top progress bar if not exists
  let loader = document.getElementById("pageLoader");
  if (!loader) {
    loader = document.createElement("div");
    loader.id = "pageLoader";
    document.body.prepend(loader);
  }

  // Intercept internal link clicks to display smooth transition
  document.querySelectorAll("a").forEach((link) => {
    const href = link.getAttribute("href");
    if (href && !href.startsWith("#") && !href.startsWith("javascript") && !link.target) {
      link.addEventListener("click", (e) => {
        // Only internal links
        if (href.endsWith(".html") || href === "/" || href.startsWith("http://localhost")) {
          e.preventDefault();
          loader.style.width = "75%";
          loader.style.opacity = "1";
          setTimeout(() => {
            loader.style.width = "100%";
            setTimeout(() => {
              window.location.href = href;
            }, 120);
          }, 150);
        }
      });
    }
  });

  // Finish load animation
  window.addEventListener("pageshow", () => {
    if (loader) {
      loader.style.width = "100%";
      setTimeout(() => {
        loader.style.opacity = "0";
        setTimeout(() => {
          loader.style.width = "0%";
        }, 300);
      }, 200);
    }
  });
});
