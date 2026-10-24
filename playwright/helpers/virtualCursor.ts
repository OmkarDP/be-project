import type { Page } from "@playwright/test";

/**
 * Injects a realistic glowing virtual red cursor onto the page
 * and smoothly animates it between interactions so the user sees
 * the mouse pointer move, click, and type.
 */
export async function installVirtualCursor(page: Page) {
  await page.addInitScript(() => {
    window.addEventListener("DOMContentLoaded", () => {
      if (document.getElementById("pw-virtual-cursor")) return;

      const cursor = document.createElement("div");
      cursor.id = "pw-virtual-cursor";
      cursor.innerHTML = `
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 2px 8px rgba(255, 0, 80, 0.8));">
          <path d="M5.5 3.2L18.8 14.5L12.5 15.2L15.8 21.8L12.8 23.2L9.6 16.6L5.5 20.2V3.2Z" fill="#ff0055" stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round"/>
        </svg>
        <div id="pw-click-ripple" style="
          position: absolute;
          top: 0; left: 0;
          width: 24px; height: 24px;
          border-radius: 50%;
          background: rgba(255, 0, 85, 0.6);
          transform: translate(-50%, -50%) scale(0);
          opacity: 0;
          pointer-events: none;
          transition: transform 0.4s ease-out, opacity 0.4s ease-out;
        "></div>
      `;

      Object.assign(cursor.style, {
        position: "fixed",
        top: "0px",
        left: "0px",
        width: "28px",
        height: "28px",
        zIndex: "2147483647",
        pointerEvents: "none",
        transform: "translate(100px, 100px)",
        transition: "transform 0.45s cubic-bezier(0.25, 1, 0.5, 1)",
      });

      document.body.appendChild(cursor);

      (window as any).__moveVirtualCursor = (x: number, y: number) => {
        cursor.style.transform = `translate(${x}px, ${y}px)`;
      };

      (window as any).__clickVirtualCursor = () => {
        const ripple = document.getElementById("pw-click-ripple");
        if (ripple) {
          ripple.style.transform = "translate(4px, 4px) scale(2.8)";
          ripple.style.opacity = "1";
          setTimeout(() => {
            ripple.style.transform = "translate(4px, 4px) scale(0)";
            ripple.style.opacity = "0";
          }, 350);
        }
      };
    });
  });
}

/**
 * Moves the virtual cursor smoothly to the target element and clicks it.
 */
export async function humanClick(page: Page, locator: any, delayAfter = 400) {
  await locator.scrollIntoViewIfNeeded().catch(() => {});
  const box = await locator.boundingBox();
  if (box) {
    const targetX = Math.round(box.x + box.width / 2);
    const targetY = Math.round(box.y + box.height / 2);
    await page.evaluate(({ x, y }) => {
      if ((window as any).__moveVirtualCursor) {
        (window as any).__moveVirtualCursor(x, y);
      }
    }, { x: targetX, y: targetY });

    await page.waitForTimeout(450);

    await page.evaluate(() => {
      if ((window as any).__clickVirtualCursor) {
        (window as any).__clickVirtualCursor();
      }
    });

    await page.waitForTimeout(150);
  }
  await locator.click();
  if (delayAfter > 0) {
    await page.waitForTimeout(delayAfter);
  }
}

/**
 * Moves virtual cursor to input, clicks, and types text with human keystroke delay.
 */
export async function humanType(page: Page, locator: any, text: string, delayBetweenChars = 60) {
  await humanClick(page, locator, 200);
  await locator.fill("");
  for (const char of text) {
    await locator.pressSequentially(char, { delay: delayBetweenChars });
  }
  await page.waitForTimeout(300);
}
