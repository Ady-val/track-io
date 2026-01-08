import { useEffect, useRef, useState } from "react";

type TitleSize = "xl" | "lg" | "base";

interface UseAdaptiveTitleSizeOptions {
  title: string;
  baseSize?: TitleSize;
}

export function useAdaptiveTitleSize({
  title,
  baseSize = "xl",
}: UseAdaptiveTitleSizeOptions) {
  const titleRef = useRef<HTMLDivElement>(null);
  const [titleSize, setTitleSize] = useState<TitleSize>(baseSize);
  const [shouldTruncate, setShouldTruncate] = useState(false);

  useEffect(() => {
    if (!titleRef.current) return;

    const checkOverflow = () => {
      const element = titleRef.current;
      if (!element) return;

      // Get the parent container width
      const parent = element.parentElement;
      if (!parent) return;

      // Get the actual icon element width if available
      const iconElement = parent.querySelector('[style*="color"]');
      const iconWidth = iconElement
        ? iconElement.getBoundingClientRect().width
        : 20; // fallback to 20px
      const gap = 8; // gap-2 = 8px
      const containerWidth = parent.clientWidth;
      const availableWidth = containerWidth - iconWidth - gap;

      // Create a temporary span to measure text width
      const tempSpan = document.createElement("span");
      tempSpan.style.visibility = "hidden";
      tempSpan.style.position = "absolute";
      tempSpan.style.whiteSpace = "nowrap";
      tempSpan.style.fontWeight = "600";
      tempSpan.style.fontFamily = getComputedStyle(element).fontFamily;
      tempSpan.textContent = title;
      document.body.appendChild(tempSpan);

      // Check with baseSize first
      tempSpan.className = `text-${baseSize}`;
      const baseWidth = tempSpan.getBoundingClientRect().width;
      if (baseWidth <= availableWidth) {
        setTitleSize(baseSize);
        setShouldTruncate(false);
        document.body.removeChild(tempSpan);
        return;
      }

      // If baseSize is xl, try lg
      if (baseSize === "xl") {
        tempSpan.className = "text-lg";
        const lgWidth = tempSpan.getBoundingClientRect().width;
        if (lgWidth <= availableWidth) {
          setTitleSize("lg");
          setShouldTruncate(false);
          document.body.removeChild(tempSpan);
          return;
        }
      }

      // Try base size
      tempSpan.className = "text-base";
      const baseTextWidth = tempSpan.getBoundingClientRect().width;
      if (baseTextWidth <= availableWidth) {
        setTitleSize("base");
        setShouldTruncate(false);
        document.body.removeChild(tempSpan);
        return;
      }

      // If still overflowing, use base with truncate
      setTitleSize("base");
      setShouldTruncate(true);
      document.body.removeChild(tempSpan);
    };

    // Use requestAnimationFrame to ensure DOM is ready
    const rafId = requestAnimationFrame(() => {
      checkOverflow();
    });

    // Re-check on window resize with debounce
    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(checkOverflow, 100);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(resizeTimeout);
      window.removeEventListener("resize", handleResize);
    };
  }, [title, baseSize]);

  return {
    titleRef,
    titleSize,
    shouldTruncate,
    titleClassName: `font-semibold text-slate-100 ${
      titleSize === "xl"
        ? "text-xl"
        : titleSize === "lg"
          ? "text-lg"
          : "text-base"
    } ${shouldTruncate ? "truncate" : ""} min-w-0 flex-1`,
  };
}

