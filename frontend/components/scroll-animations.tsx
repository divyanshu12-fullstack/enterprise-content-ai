'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function ScrollAnimations() {
    const pathname = usePathname();

    useEffect(() => {
        const selector =
            'main > *, section, article, header, [data-gsap], .rounded-xl, .rounded-2xl, .rounded-3xl';

        const rawTargets = gsap.utils.toArray<HTMLElement>(selector);
        const targets = Array.from(new Set(rawTargets)).filter((el) => {
            if (el.dataset.gsapSkip === 'true') return false;
            return el.offsetParent !== null || el.tagName.toLowerCase() === 'header';
        });

        targets.forEach((el, index) => {
            gsap.fromTo(
                el,
                { autoAlpha: 0, y: 28 },
                {
                    autoAlpha: 1,
                    y: 0,
                    duration: 0.7,
                    delay: Math.min(index * 0.03, 0.2),
                    ease: 'power2.out',
                    overwrite: 'auto',
                    scrollTrigger: {
                        trigger: el,
                        start: 'top 88%',
                        once: true,
                    },
                },
            );
        });

        ScrollTrigger.refresh();

        return () => {
            ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
            gsap.killTweensOf(targets);
        };
    }, [pathname]);

    return null;
}