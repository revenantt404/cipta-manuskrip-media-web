"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const MOTION_TARGETS = [
  ".home-hero",
  ".services-section .section-heading",
  ".service-card",
  ".closing-note",
  ".publish-hero",
  ".package-heading",
  ".package-card",
  ".assist-section",
  ".book-preview-section",
  ".journal-hero",
  ".journal-flow-hero",
  ".journal-assets-section",
  ".journal-asset-card",
  ".journal-facilities-section",
  ".journal-facility",
  ".journal-next-step",
  ".journal-category-section",
  ".journal-category-card",
  ".journal-assist-info",
  ".journal-assist-form-panel",
  ".about-hero",
  ".about-intro",
  ".about-values",
  ".about-value-card",
  ".about-journey",
  ".about-steps li",
  ".about-contact",
  ".about-pending-card",
  ".home-flow .home-section-head",
  ".home-step",
  ".home-ground .home-section-head",
  ".home-ground-card",
  ".home-catalog-panel",
  ".home-faq .home-section-head",
  ".home-faq-item",
  ".home-contact-panel",
  ".home-closing",
].join(",");

/** Lightweight, one-time scroll reveals for the redesigned public pages. */
export function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!("IntersectionObserver" in window)) return;
    // Peramban modern sudah punya animasi gulir deklaratif
    // (`animation-timeline: view()`). Kalau didukung, biarkan CSS yang
    // mengurus kemunculan bagian — hasilnya sama, tanpa perlu JavaScript
    // dan tanpa risiko isi tersembunyi saat hidrasi belum selesai.
    if (typeof CSS !== "undefined" && CSS.supports?.("animation-timeline: view()")) return;

    const elements = Array.from(document.querySelectorAll<HTMLElement>(MOTION_TARGETS));
    const sequence = new Map<Element, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const target = entry.target as HTMLElement;
          target.classList.add("motion-visible");
          observer.unobserve(target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -36px 0px" },
    );

    elements.forEach((element) => {
      const parent = element.parentElement;
      const order = parent ? sequence.get(parent) ?? 0 : 0;
      if (parent) sequence.set(parent, order + 1);
      element.style.setProperty("--motion-delay", `${Math.min(order, 4) * 65}ms`);
      element.classList.add("motion-pending");
      observer.observe(element);
    });

    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
